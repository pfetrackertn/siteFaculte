const Material = require("../models/material.model");
const AcademicClass = require("../models/class.model");
const ApiResponse = require("../utils/ApiResponse");
const { getArchiveFilter, buildArchiveUpdate } = require("../utils/archive");
const { resolveAcademicYearId } = require("../utils/academic-year");

const normalizeClassId = (classId) => {
  if (!classId || classId === "null" || classId === "undefined") {
    return null;
  }

  return classId;
};

const ensureMaterialClassMatchesContext = async ({
  classId,
  branch,
  semester,
  academicYearId,
}) => {
  if (!classId) {
    return { academicClass: null };
  }

  const academicClass = await AcademicClass.findById(classId);

  if (!academicClass) {
    return { error: "Classe introuvable" };
  }

  if (branch && academicClass.branchId?.toString() !== branch.toString()) {
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

  return { academicClass };
};

const populateMaterial = (query) =>
  query
    .populate("subject")
    .populate("faculty")
    .populate("branch")
    .populate("academicYearId", "name isActive")
    .populate({
      path: "classId",
      select: "name code semester branchId academicYearId",
      populate: [
        {
          path: "branchId",
          select: "name branchId",
        },
        {
          path: "academicYearId",
          select: "name isActive",
        },
      ],
    });

const getMaterialsController = async (req, res) => {
  try {
    const { subject, faculty, semester, branch, type, classId, academicYearId } =
      req.query;
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (subject) query.subject = subject;
    if (faculty) query.faculty = faculty;
    if (semester) query.semester = Number(semester);
    if (branch) query.branch = branch;
    if (type) query.type = type;
    if (academicYearId) query.academicYearId = academicYearId;
    if (classId) {
      query.$or = [{ classId }, { classId: null }];
    }

    const materials = await populateMaterial(
      Material.find(query).sort({ createdAt: -1 })
    );

    if (!materials.length) {
      return ApiResponse.notFound("Aucune ressource trouvee").send(res);
    }

    return ApiResponse.success(materials, "Ressources chargees avec succes")
      .send(res);
  } catch (error) {
    console.error("Get Materials Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addMaterialController = async (req, res) => {
  try {
    const { title, subject, semester, branch, type } = req.body;
    const classId = normalizeClassId(req.body.classId);
    const academicYearId = await resolveAcademicYearId(req.body.academicYearId);

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
      academicYearId,
    });

    if (classValidation.error) {
      return ApiResponse.badRequest(classValidation.error).send(res);
    }

    const material = await Material.create({
      title: title.trim(),
      subject,
      faculty: req.userId,
      semester: Number(semester),
      branch,
      classId,
      academicYearId: academicYearId || classValidation.academicClass?.academicYearId || null,
      type,
      file: req.file.filename,
    });

    const populatedMaterial = await populateMaterial(
      Material.findById(material._id)
    );

    return ApiResponse.created(
      populatedMaterial,
      "Ressource ajoutee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Add Material Error:", error);
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
    const resolvedAcademicYearId = Object.prototype.hasOwnProperty.call(
      req.body,
      "academicYearId"
    )
      ? await resolveAcademicYearId(req.body.academicYearId)
      : material.academicYearId;

    const classValidation = await ensureMaterialClassMatchesContext({
      classId: normalizedClassId,
      branch: branch || material.branch,
      semester: semester || material.semester,
      academicYearId: resolvedAcademicYearId,
    });

    if (classValidation.error) {
      return ApiResponse.badRequest(classValidation.error).send(res);
    }

    if (title) updateData.title = title.trim();
    if (subject) updateData.subject = subject;
    if (semester) updateData.semester = Number(semester);
    if (branch) updateData.branch = branch;
    if (Object.prototype.hasOwnProperty.call(req.body, "classId")) {
      updateData.classId = normalizedClassId;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "academicYearId")) {
      updateData.academicYearId = resolvedAcademicYearId;
    }
    if (type) {
      if (!["notes", "assignment", "syllabus", "other"].includes(type)) {
        return ApiResponse.badRequest("Type de ressource invalide").send(res);
      }
      updateData.type = type;
    }
    if (req.file) updateData.file = req.file.filename;

    const updatedMaterial = await populateMaterial(
      Material.findByIdAndUpdate(id, updateData, {
        new: true,
      })
    );

    return ApiResponse.success(
      updatedMaterial,
      "Ressource mise a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Material Error:", error);
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

    const archivedMaterial = await Material.findByIdAndUpdate(
      id,
      buildArchiveUpdate(true, "Suppression logique depuis le module ressource"),
      { new: true }
    );

    return ApiResponse.success(
      archivedMaterial,
      "Ressource archivee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Delete Material Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getMaterialsController,
  addMaterialController,
  updateMaterialController,
  deleteMaterialController,
};
