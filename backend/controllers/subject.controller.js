const Subject = require("../models/subject.model");
const AcademicClass = require("../models/class.model");
const Branch = require("../models/branch.model");
const ApiResponse = require("../utils/ApiResponse");
const { getArchiveFilter, buildArchiveUpdate } = require("../utils/archive");
const { resolveAcademicYearId } = require("../utils/academic-year");

const populateSubject = (query) =>
  query
    .populate("branch", "name branchId")
    .populate("departmentId", "name code")
    .populate("classId", "name code level semester")
    .populate("academicYearId", "name isActive");

const getSubjectController = async (req, res) => {
  try {
    const { branch, semester, classId, academicYearId } = req.query;
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (branch) query.branch = branch;
    if (semester) query.semester = Number(semester);
    if (classId) query.classId = classId;
    if (academicYearId) query.academicYearId = academicYearId;

    const subjects = await populateSubject(
      Subject.find(query).sort({ semester: 1, name: 1 })
    );

    if (!subjects.length) {
      return ApiResponse.notFound("Aucune matiere trouvee").send(res);
    }

    return ApiResponse.success(subjects, "Matieres chargees avec succes").send(
      res
    );
  } catch (error) {
    console.error("Get Subject Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addSubjectController = async (req, res) => {
  try {
    const { name, code, branch, semester, credits, classId = null } = req.body;

    if (!name || !code || !branch || !semester || !credits) {
      return ApiResponse.badRequest("Tous les champs sont obligatoires").send(
        res
      );
    }

    const branchDoc = await Branch.findById(branch);
    if (!branchDoc) {
      return ApiResponse.notFound("Filiere introuvable").send(res);
    }

    let academicClass = null;
    if (classId) {
      academicClass = await AcademicClass.findById(classId);
      if (!academicClass) {
        return ApiResponse.notFound("Classe introuvable").send(res);
      }
    }

    const academicYearId = await resolveAcademicYearId(req.body.academicYearId);
    const normalizedCode = code.trim().toUpperCase();

    const subject = await Subject.findOne({
      code: normalizedCode,
      branch,
      semester: Number(semester),
      academicYearId: academicYearId || null,
      isArchived: false,
    });

    if (subject) {
      return ApiResponse.conflict("Cette matiere existe deja").send(res);
    }

    const newSubject = await Subject.create({
      name: name.trim(),
      code: normalizedCode,
      branch,
      departmentId: req.body.departmentId || branchDoc.departmentId || null,
      classId: classId || null,
      academicYearId:
        academicYearId || academicClass?.academicYearId || null,
      semester: Number(semester),
      credits: Number(credits),
      status: req.body.status || "active",
    });

    const populatedSubject = await populateSubject(Subject.findById(newSubject._id));

    return ApiResponse.created(
      populatedSubject,
      "Matiere ajoutee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Add Subject Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateSubjectController = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return ApiResponse.notFound("Matiere introuvable").send(res);
    }

    const updateFields = { ...req.body };

    if (updateFields.name) updateFields.name = updateFields.name.trim();
    if (updateFields.code) updateFields.code = updateFields.code.trim().toUpperCase();
    if (updateFields.semester) updateFields.semester = Number(updateFields.semester);
    if (updateFields.credits) updateFields.credits = Number(updateFields.credits);

    if (Object.prototype.hasOwnProperty.call(updateFields, "academicYearId")) {
      updateFields.academicYearId = await resolveAcademicYearId(
        updateFields.academicYearId
      );
    }

    const updatedSubject = await populateSubject(
      Subject.findByIdAndUpdate(req.params.id, updateFields, { new: true })
    );

    return ApiResponse.success(
      updatedSubject,
      "Matiere mise a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Subject Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteSubjectController = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module admin"),
      { new: true }
    );

    if (!subject) {
      return ApiResponse.notFound("Matiere introuvable").send(res);
    }

    return ApiResponse.success(subject, "Matiere archivee avec succes").send(
      res
    );
  } catch (error) {
    console.error("Delete Subject Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getSubjectController,
  addSubjectController,
  deleteSubjectController,
  updateSubjectController,
};
