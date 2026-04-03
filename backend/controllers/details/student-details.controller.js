const studentDetails = require("../../models/details/student-details.model");
const resetToken = require("../../models/reset-password.model");
const AcademicClass = require("../../models/class.model");
const bcrypt = require("bcryptjs");
const ApiResponse = require("../../utils/ApiResponse");
const jwt = require("jsonwebtoken");
const sendResetMail = require("../../utils/SendMail");

const applyStudentPopulate = (query) =>
  query
    .populate("branchId", "name branchId")
    .populate({
      path: "classId",
      select: "name code semester branchId status",
      populate: {
        path: "branchId",
        select: "name branchId",
      },
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
}) => {
  if (!classId) {
    return { academicClass: null };
  }

  const academicClass = await AcademicClass.findById(classId);

  if (!academicClass) {
    return { error: "Classe introuvable" };
  }

  if (
    branchId &&
    academicClass.branchId.toString() !== branchId.toString()
  ) {
    return {
      error: "La classe selectionnee ne correspond pas a la filiere choisie",
    };
  }

  if (semester && Number(academicClass.semester) !== Number(semester)) {
    return {
      error: "La classe selectionnee ne correspond pas au semestre choisi",
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

const loginStudentController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await studentDetails.findOne({ email });

    if (!user) {
      return ApiResponse.notFound("Utilisateur introuvable").send(res);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return ApiResponse.unauthorized("Mot de passe invalide").send(res);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return ApiResponse.success({ token }, "Connexion reussie").send(res);
  } catch (error) {
    console.error("Login Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getAllDetailsController = async (req, res) => {
  try {
    const users = await applyStudentPopulate(
      studentDetails.find().select("-__v -password")
    );

    if (!users || users.length === 0) {
      return ApiResponse.notFound("Aucun etudiant trouve").send(res);
    }

    return ApiResponse.success(users, "Details des etudiants charges").send(
      res
    );
  } catch (error) {
    console.error("Get Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const registerStudentController = async (req, res) => {
  try {
    const profile = req.file?.filename || "";
    const normalizedClassId = normalizeClassId(req.body.classId);
    const classValidation = await ensureClassMatchesAcademicContext({
      classId: normalizedClassId,
      branchId: req.body.branchId,
      semester: req.body.semester,
    });

    if (classValidation.error) {
      return ApiResponse.badRequest(classValidation.error).send(res);
    }

    const enrollmentNo = await generateEnrollmentNo();
    const email = `${enrollmentNo}@gmail.com`;

    const user = await studentDetails.create({
      ...req.body,
      classId: normalizedClassId,
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
    console.error("Add Details Error: ", error);
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
    console.error("Get My Details Error: ", error);
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
        phone: phone,
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
        email: email,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Cet e-mail est deja utilise").send(res);
      }
    }

    if (enrollmentNo) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        enrollmentNo: enrollmentNo,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Ce numero d'inscription est deja utilise").send(
          res
        );
      }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      updateData.profile = req.file.filename;
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "classId")) {
      updateData.classId = normalizeClassId(updateData.classId);
    }

    const classIdToValidate = Object.prototype.hasOwnProperty.call(
      updateData,
      "classId"
    )
      ? updateData.classId
      : currentUser.classId;

    const branchIdToValidate = updateData.branchId || currentUser.branchId;
    const semesterToValidate = updateData.semester || currentUser.semester;

    const classValidation = await ensureClassMatchesAcademicContext({
      classId: classIdToValidate,
      branchId: branchIdToValidate,
      semester: semesterToValidate,
    });

    if (classValidation.error) {
      return ApiResponse.badRequest(classValidation.error).send(res);
    }

    if (updateData.dob) {
      updateData.dob = new Date(updateData.dob);
    }
    if (updateData.joiningDate) {
      updateData.joiningDate = new Date(updateData.joiningDate);
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
    console.error("Update Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteDetailsController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest("L'identifiant de l'etudiant est requis")
        .send(res);
    }

    const user = await studentDetails.findById(req.params.id);

    if (!user) {
      return ApiResponse.notFound("Aucun etudiant trouve").send(res);
    }

    await studentDetails.findByIdAndDelete(req.params.id);

    return ApiResponse.success(null, "Etudiant supprime avec succes").send(res);
  } catch (error) {
    console.error("Delete Details Error: ", error);
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
    console.error("Send Reset Mail Error: ", error);
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await studentDetails.findByIdAndUpdate(verifyToken._id, {
      password: hashedPassword,
    });

    await resetToken.deleteMany({
      type: "StudentDetails",
      userId: verifyToken._id,
    });

    return ApiResponse.success(null, "Mot de passe mis a jour").send(res);
  } catch (error) {
    console.error("Update Password Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const searchStudentsController = async (req, res) => {
  try {
    const { enrollmentNo, name, semester, branch, classId } = req.body;
    let query = {};

    if (!enrollmentNo && !name && !semester && !branch && !classId) {
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
      query.semester = semester;
    }

    if (branch) {
      query.branchId = branch;
    }

    if (classId) {
      query.classId = classId;
    }

    const students = await applyStudentPopulate(
      studentDetails
        .find(query)
        .select("-password -__v")
        .sort({ enrollmentNo: 1 })
    );

    if (!students || students.length === 0) {
      return ApiResponse.notFound("Aucun etudiant trouve").send(res);
    }

    return ApiResponse.success(students, "Etudiants trouves avec succes").send(
      res
    );
  } catch (error) {
    console.error("Search Students Error: ", error);
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await studentDetails.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    return ApiResponse.success(
      null,
      "Mot de passe mis a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Password Error: ", error);
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
