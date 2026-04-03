const facultyDetails = require("../../models/details/faculty-details.model");
const resetToken = require("../../models/reset-password.model");
const bcrypt = require("bcryptjs");
const ApiResponse = require("../../utils/ApiResponse");
const jwt = require("jsonwebtoken");
const sendResetMail = require("../../utils/SendMail");

const loginFacultyController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await facultyDetails.findOne({ email });

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

const getAllFacultyController = async (req, res) => {
  try {
    const users = await facultyDetails.find().select("-__v -password");
    if (!users || users.length === 0) {
      return ApiResponse.notFound("Aucun enseignant trouve").send(res);
    }
    return ApiResponse.success(users, "Details des enseignants charges").send(
      res
    );
  } catch (error) {
    console.error("Get All Faculty Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const generateEmployeeId = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const registerFacultyController = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const profile = req.file?.filename || "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ApiResponse.badRequest("Format d'e-mail invalide").send(res);
    }

    if (!/^\d{10}$/.test(phone)) {
      return ApiResponse.badRequest(
        "Le numero de telephone doit contenir 10 chiffres"
      ).send(res);
    }

    const existing = await facultyDetails.findOne({
      $or: [{ phone }, { email }],
    });
    if (existing) {
      return ApiResponse.conflict(
        "Un enseignant avec ces informations existe deja"
      ).send(res);
    }

    const employeeId = generateEmployeeId();

    const user = await facultyDetails.create({
      ...req.body,
      employeeId,
      profile,
      password: "faculty123",
    });

    const sanitizedUser = await facultyDetails
      .findById(user._id)
      .select("-__v -password");
    return ApiResponse.created(
      sanitizedUser,
      "Enseignant cree avec succes"
    ).send(res);
  } catch (error) {
    console.error("Register Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateFacultyController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest(
        "L'identifiant de l'enseignant est requis"
      ).send(res);
    }

    const updateData = { ...req.body };
    const { email, phone, password } = updateData;

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

    if (email) {
      const existing = await facultyDetails.findOne({
        _id: { $ne: req.params.id },
        email,
      });
      if (existing) {
        return ApiResponse.conflict("Cet e-mail est deja utilise").send(res);
      }
    }

    if (phone) {
      const existing = await facultyDetails.findOne({
        _id: { $ne: req.params.id },
        phone,
      });
      if (existing) {
        return ApiResponse.conflict(
          "Ce numero de telephone est deja utilise"
        ).send(res);
      }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      updateData.profile = req.file.filename;
    }

    if (updateData.dob) updateData.dob = new Date(updateData.dob);
    if (updateData.joiningDate)
      updateData.joiningDate = new Date(updateData.joiningDate);

    const updatedUser = await facultyDetails
      .findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select("-__v -password");

    if (!updatedUser) {
      return ApiResponse.notFound("Enseignant introuvable").send(res);
    }

    return ApiResponse.success(
      updatedUser,
      "Enseignant mis a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteFacultyController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest(
        "L'identifiant de l'enseignant est requis"
      ).send(res);
    }

    const user = await facultyDetails.findByIdAndDelete(req.params.id);
    if (!user) {
      return ApiResponse.notFound("Aucun enseignant trouve").send(res);
    }

    return ApiResponse.success(null, "Enseignant supprime avec succes").send(
      res
    );
  } catch (error) {
    console.error("Delete Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getMyFacultyDetailsController = async (req, res) => {
  try {
    const user = await facultyDetails
      .findById(req.userId)
      .select("-__v -password")
      .populate("branchId", "name branchId");
    if (!user) {
      return ApiResponse.notFound("Utilisateur introuvable").send(res);
    }
    return ApiResponse.success(user, "Mes informations ont ete chargees").send(
      res
    );
  } catch (error) {
    console.error("My Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const sendFacultyResetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return ApiResponse.badRequest("L'e-mail est requis").send(res);
    }

    const user = await facultyDetails.findOne({ email });
    if (!user) {
      return ApiResponse.notFound("Aucun enseignant trouve").send(res);
    }

    const resetTkn = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    await resetToken.deleteMany({ type: "FacultyDetails", userId: user._id });

    const resetId = await resetToken.create({
      resetToken: resetTkn,
      type: "FacultyDetails",
      userId: user._id,
    });

    await sendResetMail(user.email, resetId._id, "faculty");

    return ApiResponse.success(
      null,
      "E-mail de reinitialisation envoye avec succes"
    ).send(res);
  } catch (error) {
    console.error("Forgot Password Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateFacultyPasswordHandler = async (req, res) => {
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

    const verifyToken = jwt.verify(resetTkn.resetToken, process.env.JWT_SECRET);
    if (!verifyToken) {
      return ApiResponse.unauthorized("Jeton expire ou invalide").send(res);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await facultyDetails.findByIdAndUpdate(verifyToken._id, {
      password: hashedPassword,
    });

    await resetToken.deleteMany({
      type: "FacultyDetails",
      userId: verifyToken._id,
    });

    return ApiResponse.success(null, "Mot de passe mis a jour avec succes").send(
      res
    );
  } catch (error) {
    console.error("Password Update Error: ", error);
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

    const user = await facultyDetails.findById(userId);
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

    await facultyDetails.findByIdAndUpdate(userId, {
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
  loginFacultyController,
  registerFacultyController,
  updateFacultyController,
  deleteFacultyController,
  getAllFacultyController,
  getMyFacultyDetailsController,
  sendFacultyResetPasswordEmail,
  updateFacultyPasswordHandler,
  updateLoggedInPasswordController,
};
