const Material = require("../models/material.model");
const AcademicClass = require("../models/class.model");
const ApiResponse = require("../utils/ApiResponse");

const normalizeClassId = (classId) => {
  if (!classId || classId === "null" || classId === "undefined") {
    return null;
  }

  return classId;
};

const ensureMaterialClassMatchesContext = async ({ classId, branch, semester }) => {
  if (!classId) {
    return { academicClass: null };
  }

  const academicClass = await AcademicClass.findById(classId);

  if (!academicClass) {
    return { error: "Classe introuvable" };
  }

  if (branch && academicClass.branchId.toString() !== branch.toString()) {
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

const getMaterialsController = async (req, res) => {
  try {
    const { subject, faculty, semester, branch, type, classId } = req.query;
    let query = {};

    if (subject) query.subject = subject;
    if (faculty) query.faculty = faculty;
    if (semester) query.semester = semester;
    if (branch) query.branch = branch;
    if (type) query.type = type;
    if (classId) {
      query.$or = [{ classId }, { classId: null }];
    }

    const materials = await Material.find(query)
      .populate("subject")
      .populate("faculty")
      .populate("branch")
      .populate({
        path: "classId",
        select: "name code semester branchId",
        populate: {
          path: "branchId",
          select: "name branchId",
        },
      })
      .sort({ createdAt: -1 });

    if (!materials || materials.length === 0) {
      return ApiResponse.notFound("Aucune ressource trouvee").send(res);
    }

    return ApiResponse.success(materials, "Ressources chargees avec succes")
      .send(res);
  } catch (error) {
    console.error("Get Materials Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addMaterialController = async (req, res) => {
  try {
    const { title, subject, semester, branch, type } = req.body;
    const classId = normalizeClassId(req.body.classId);

    if (!title || !subject || !semester || !branch || !type) {
      return ApiResponse.badRequest("Tous les champs sont obligatoires").send(
        res
      );
    }

    if (!req.file) {
      return ApiResponse.badRequest("Le fichier de la ressource est requis")
        .send(res);
    }

    if (!["notes", "assignment", "syllabus", "other"].includes(type)) {
      return ApiResponse.badRequest("Type de ressource invalide").send(res);
    }

    const classValidation = await ensureMaterialClassMatchesContext({
      classId,
      branch,
      semester,
    });

    if (classValidation.error) {
      return ApiResponse.badRequest(classValidation.error).send(res);
    }

    const material = await Material.create({
      title,
      subject,
      faculty: req.userId,
      semester,
      branch,
      classId,
      type,
      file: req.file.filename,
    });

    const populatedMaterial = await Material.findById(material._id)
      .populate("subject")
      .populate("faculty")
      .populate("branch")
      .populate({
        path: "classId",
        select: "name code semester branchId",
        populate: {
          path: "branchId",
          select: "name branchId",
        },
      });

    return ApiResponse.created(populatedMaterial, "Ressource ajoutee avec succes")
      .send(res);
  } catch (error) {
    console.error("Add Material Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateMaterialController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, semester, branch, type } = req.body;

    if (!id) {
      return ApiResponse.badRequest("L'identifiant de la ressource est requis")
        .send(res);
    }

    const material = await Material.findById(id);

    if (!material) {
      return ApiResponse.notFound("Ressource introuvable").send(res);
    }

    if (material.faculty.toString() !== req.userId) {
      return ApiResponse.unauthorized(
        "Vous n'etes pas autorise a modifier cette ressource"
      ).send(res);
    }

    const updateData = {};
    const normalizedClassId = Object.prototype.hasOwnProperty.call(
      req.body,
      "classId"
    )
      ? normalizeClassId(req.body.classId)
      : material.classId;

    const classValidation = await ensureMaterialClassMatchesContext({
      classId: normalizedClassId,
      branch: branch || material.branch,
      semester: semester || material.semester,
    });

    if (classValidation.error) {
      return ApiResponse.badRequest(classValidation.error).send(res);
    }

    if (title) updateData.title = title;
    if (subject) updateData.subject = subject;
    if (semester) updateData.semester = semester;
    if (branch) updateData.branch = branch;
    if (Object.prototype.hasOwnProperty.call(req.body, "classId")) {
      updateData.classId = normalizedClassId;
    }
    if (type) {
      if (!["notes", "assignment", "syllabus", "other"].includes(type)) {
        return ApiResponse.badRequest("Type de ressource invalide").send(res);
      }
      updateData.type = type;
    }
    if (req.file) updateData.file = req.file.filename;

    const updatedMaterial = await Material.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("subject")
      .populate("faculty")
      .populate("branch")
      .populate({
        path: "classId",
        select: "name code semester branchId",
        populate: {
          path: "branchId",
          select: "name branchId",
        },
      });

    return ApiResponse.success(
      updatedMaterial,
      "Ressource mise a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Material Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteMaterialController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ApiResponse.badRequest("L'identifiant de la ressource est requis")
        .send(res);
    }

    const material = await Material.findById(id);

    if (!material) {
      return ApiResponse.notFound("Ressource introuvable").send(res);
    }

    if (material.faculty.toString() !== req.userId) {
      return ApiResponse.unauthorized(
        "Vous n'etes pas autorise a supprimer cette ressource"
      ).send(res);
    }

    await Material.findByIdAndDelete(id);

    return ApiResponse.success(null, "Ressource supprimee avec succes").send(
      res
    );
  } catch (error) {
    console.error("Delete Material Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getMaterialsController,
  addMaterialController,
  updateMaterialController,
  deleteMaterialController,
};
