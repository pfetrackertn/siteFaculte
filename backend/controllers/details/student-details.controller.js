const studentDetails = require("../../models/details/student-details.model");
const resetToken = require("../../models/reset-password.model");
const AcademicClass = require("../../models/class.model");
const Branch = require("../../models/branch.model");
const Promotion = require("../../models/promotion.model");
const bcrypt = require("bcryptjs");
const ApiResponse = require("../../utils/ApiResponse");
const jwt = require("jsonwebtoken");
const sendResetMail = require("../../utils/SendMail");
const { getArchiveFilter, buildArchiveUpdate } = require("../../utils/archive");
const { resolveAcademicYearId } = require("../../utils/academic-year");

const applyStudentPopulate = (query) =>
  query
    .populate("branchId", "name branchId departmentId")
    .populate("departmentId", "name code")
    .populate("promotionId", "name code intakeYear")
    .populate("academicYearId", "name isActive")
    .populate({
      path: "classId",
      select: "name code semester branchId status academicYearId departmentId level",
      populate: [
        {
          path: "branchId",
          select: "name branchId",
        },
        {
          path: "academicYearId",
          select: "name isActive",
        },
        {
          path: "departmentId",
          select: "name code",
        },
      ],
    });

const normalizeClassId = (classId) => {
  if (!classId || classId === "null" || classId === "undefined") {
    return null;
  }

  return classId;
};

const ensureClassMatchesAcademicContext = async ({
  classId,
  branchId,
  semester,
  academicYearId,
  departmentId,
}) => {
  if (!classId) {
    return { academicClass: null };
  }

  const academicClass = await AcademicClass.findById(classId);

  if (!academicClass) {
    return { error: "Classe introuvable" };
  }

  if (branchId && academicClass.branchId.toString() !== branchId.toString()) {
    return {
      error: "La classe selectionnee ne correspond pas a la filiere choisie",
    };
  }

  if (semester && Number(academicClass.semester) !== Number(semester)) {
    return {
      error: "La classe selectionnee ne correspond pas au semestre choisi",
    };
  }

  if (
    academicYearId &&
    academicClass.academicYearId &&
    academicClass.academicYearId.toString() !== academicYearId.toString()
  ) {
    return {
      error:
        "La classe selectionnee ne correspond pas a l'annee academique choisie",
    };
  }

  if (
    departmentId &&
    academicClass.departmentId &&
    academicClass.departmentId.toString() !== departmentId.toString()
  ) {
    return {
      error:
        "La classe selectionnee ne correspond pas au departement selectionne",
    };
  }

  return { academicClass };
};

const generateEnrollmentNo = async () => {
  let enrollmentNo;
  let exists = true;

  while (exists) {
    enrollmentNo = Math.floor(100000 + Math.random() * 900000);
    exists = await studentDetails.exists({ enrollmentNo });
  }

  return enrollmentNo;
};

const buildStudentAcademicContext = async (payload) => {
  const branch = await Branch.findById(payload.branchId);
  if (!branch) {
    return { error: "Filiere introuvable" };
  }

  const classId = normalizeClassId(payload.classId);
  const academicYearId = await resolveAcademicYearId(payload.academicYearId);
  const departmentId = payload.departmentId || branch.departmentId || null;

  const classValidation = await ensureClassMatchesAcademicContext({
    classId,
    branchId: payload.branchId,
    semester: payload.semester,
    academicYearId,
    departmentId,
  });

  if (classValidation.error) {
    return { error: classValidation.error };
  }

  if (payload.promotionId) {
    const promotion = await Promotion.findById(payload.promotionId);
    if (!promotion) {
      return { error: "Promotion introuvable" };
    }
  }

  return {
    branch,
    classId,
    academicYearId: academicYearId || classValidation.academicClass?.academicYearId || null,
    departmentId:
      departmentId || classValidation.academicClass?.departmentId || null,
  };
};

const loginStudentController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await studentDetails.findOne({ email });

    if (!user || user.isArchived) {
      return ApiResponse.notFound("Utilisateur introuvable").send(res);
    }

    if (user.status === "inactive") {
      return ApiResponse.forbidden("Ce compte etudiant est inactif").send(res);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return ApiResponse.unauthorized("Mot de passe invalide").send(res);
    }

    const token = jwt.sign(
      { userId: user._id, role: "Student" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return ApiResponse.success({ token }, "Connexion reussie").send(res);
  } catch (error) {
    console.error("Login Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getAllDetailsController = async (req, res) => {
  try {
    const users = await applyStudentPopulate(
      studentDetails.find(getArchiveFilter(req.query)).select("-__v -password")
    );

    if (!users.length) {
      return ApiResponse.notFound("Aucun etudiant trouve").send(res);
    }

    return ApiResponse.success(users, "Details des etudiants charges").send(
      res
    );
  } catch (error) {
    console.error("Get Details Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const registerStudentController = async (req, res) => {
  try {
    const profile = req.file?.filename || "";
    const context = await buildStudentAcademicContext(req.body);

    if (context.error) {
      return ApiResponse.badRequest(context.error).send(res);
    }

    const enrollmentNo = await generateEnrollmentNo();
    const email = `${enrollmentNo}@gmail.com`;

    const user = await studentDetails.create({
      ...req.body,
      classId: context.classId,
      departmentId: context.departmentId,
      academicYearId: context.academicYearId,
      entryYear: req.body.entryYear ? Number(req.body.entryYear) : null,
      profile,
      password: "student123",
      email,
      enrollmentNo,
    });

    const sanitizedUser = await applyStudentPopulate(
      studentDetails.findById(user._id).select("-__v -password")
    );

    return ApiResponse.created(sanitizedUser, "Etudiant ajoute avec succes").send(
      res
    );
  } catch (error) {
    console.error("Add Details Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getMyDetailsController = async (req, res) => {
  try {
    const user = await applyStudentPopulate(
      studentDetails.findById(req.userId).select("-password -__v")
    );

    if (!user) {
      return ApiResponse.notFound("Utilisateur introuvable").send(res);
    }

    return ApiResponse.success(user, "Mes informations ont ete chargees").send(
      res
    );
  } catch (error) {
    console.error("Get My Details Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateDetailsController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest("L'identifiant de l'etudiant est requis")
        .send(res);
    }

    const currentUser = await studentDetails.findById(req.params.id);

    if (!currentUser) {
      return ApiResponse.notFound("Etudiant introuvable").send(res);
    }

    const updateData = { ...req.body };
    const { email, phone, password, enrollmentNo } = updateData;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ApiResponse.badRequest("Format d'e-mail invalide").send(res);
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return ApiResponse.badRequest(
        "Le numero de telephone doit contenir 10 chiffres"
      ).send(res);
    }

    if (password && password.length < 8) {
      return ApiResponse.badRequest(
        "Le mot de passe doit contenir au moins 8 caracteres"
      ).send(res);
    }

    if (phone) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        phone,
      });

      if (existingStudent) {
        return ApiResponse.conflict(
          "Ce numero de telephone est deja utilise"
        ).send(res);
      }
    }

    if (email) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        email,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Cet e-mail est deja utilise").send(res);
      }
    }

    if (enrollmentNo) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        enrollmentNo,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Ce numero d'inscription est deja utilise").send(
          res
        );
      }
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      updateData.profile = req.file.filename;
    }

    const context = await buildStudentAcademicContext({
      branchId: updateData.branchId || currentUser.branchId,
      semester: updateData.semester || currentUser.semester,
      classId: Object.prototype.hasOwnProperty.call(updateData, "classId")
        ? updateData.classId
        : currentUser.classId,
      academicYearId: Object.prototype.hasOwnProperty.call(
        updateData,
        "academicYearId"
      )
        ? updateData.academicYearId
        : currentUser.academicYearId,
      departmentId: Object.prototype.hasOwnProperty.call(
        updateData,
        "departmentId"
      )
        ? updateData.departmentId
        : currentUser.departmentId,
      promotionId: Object.prototype.hasOwnProperty.call(
        updateData,
        "promotionId"
      )
        ? updateData.promotionId
        : currentUser.promotionId,
    });

    if (context.error) {
      return ApiResponse.badRequest(context.error).send(res);
    }

    updateData.classId = context.classId;
    updateData.departmentId = context.departmentId;
    updateData.academicYearId = context.academicYearId;

    if (updateData.entryYear) {
      updateData.entryYear = Number(updateData.entryYear);
    }

    if (updateData.dob) {
      updateData.dob = new Date(updateData.dob);
    }

    const updatedUser = await applyStudentPopulate(
      studentDetails
        .findByIdAndUpdate(req.params.id, updateData, { new: true })
        .select("-__v -password")
    );

    return ApiResponse.success(
      updatedUser,
      "Etudiant mis a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Details Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteDetailsController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest("L'identifiant de l'etudiant est requis")
        .send(res);
    }

    const user = await studentDetails.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module etudiant"),
      { new: true }
    );

    if (!user) {
      return ApiResponse.notFound("Aucun etudiant trouve").send(res);
    }

    return ApiResponse.success(null, "Etudiant archive avec succes").send(res);
  } catch (error) {
    console.error("Delete Details Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const sendForgetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return ApiResponse.badRequest("L'e-mail est requis").send(res);
    }

    const user = await studentDetails.findOne({ email });

    if (!user) {
      return ApiResponse.notFound("Aucun etudiant trouve").send(res);
    }
    const resetTkn = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    await resetToken.deleteMany({
      type: "StudentDetails",
      userId: user._id,
    });

    const resetId = await resetToken.create({
      resetToken: resetTkn,
      type: "StudentDetails",
      userId: user._id,
    });

    await sendResetMail(user.email, resetId._id, "student");

    return ApiResponse.success(
      null,
      "E-mail de reinitialisation envoye avec succes"
    ).send(res);
  } catch (error) {
    console.error("Send Reset Mail Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updatePasswordHandler = async (req, res) => {
  try {
    const { resetId } = req.params;
    const { password } = req.body;
    if (!resetId || !password) {
      return ApiResponse.badRequest(
        "Le mot de passe et l'identifiant de reinitialisation sont requis"
      ).send(res);
    }

    const resetTkn = await resetToken.findById(resetId);

    if (!resetTkn) {
      return ApiResponse.notFound(
        "Aucune demande de reinitialisation trouvee"
      ).send(res);
    }

    const verifyToken = await jwt.verify(
      resetTkn.resetToken,
      process.env.JWT_SECRET
    );

    if (!verifyToken) {
      return ApiResponse.notFound("Jeton expire").send(res);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await studentDetails.findByIdAndUpdate(verifyToken._id, {
      password: hashedPassword,
    });

    await resetToken.deleteMany({
      type: "StudentDetails",
      userId: verifyToken._id,
    });

    return ApiResponse.success(null, "Mot de passe mis a jour").send(res);
  } catch (error) {
    console.error("Update Password Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const searchStudentsController = async (req, res) => {
  try {
    const {
      enrollmentNo,
      name,
      semester,
      branch,
      classId,
      departmentId,
      promotionId,
      academicYearId,
    } = req.body;
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (
      !enrollmentNo &&
      !name &&
      !semester &&
      !branch &&
      !classId &&
      !departmentId &&
      !promotionId &&
      !academicYearId
    ) {
      return ApiResponse.badRequest(
        "Veuillez selectionner au moins un filtre"
      ).send(res);
    }

    if (enrollmentNo) {
      query.enrollmentNo = enrollmentNo;
    }

    if (name) {
      query.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { middleName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }

    if (semester) {
      query.semester = Number(semester);
    }

    if (branch) {
      query.branchId = branch;
    }

    if (classId) {
      query.classId = classId;
    }

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (promotionId) {
      query.promotionId = promotionId;
    }

    if (academicYearId) {
      query.academicYearId = academicYearId;
    }

    const students = await applyStudentPopulate(
      studentDetails
        .find(query)
        .select("-password -__v")
        .sort({ enrollmentNo: 1 })
    );

    if (!students.length) {
      return ApiResponse.notFound("Aucun etudiant trouve").send(res);
    }

    return ApiResponse.success(students, "Etudiants trouves avec succes").send(
      res
    );
  } catch (error) {
    console.error("Search Students Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateLoggedInPasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return ApiResponse.badRequest(
        "Le mot de passe actuel et le nouveau mot de passe sont requis"
      ).send(res);
    }

    if (newPassword.length < 8) {
      return ApiResponse.badRequest(
        "Le nouveau mot de passe doit contenir au moins 8 caracteres"
      ).send(res);
    }

    const user = await studentDetails.findById(userId);
    if (!user) {
      return ApiResponse.notFound("Utilisateur introuvable").send(res);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return ApiResponse.unauthorized(
        "Le mot de passe actuel est incorrect"
      ).send(res);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await studentDetails.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    return ApiResponse.success(
      null,
      "Mot de passe mis a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Password Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  loginStudentController,
  getAllDetailsController,
  registerStudentController,
  updateDetailsController,
  deleteDetailsController,
  getMyDetailsController,
  sendForgetPasswordEmail,
  updatePasswordHandler,
  searchStudentsController,
  updateLoggedInPasswordController,
};
