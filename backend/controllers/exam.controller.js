const Exam = require("../models/exam.model");
const ApiResponse = require("../utils/ApiResponse");
const { getArchiveFilter, buildArchiveUpdate } = require("../utils/archive");
const { resolveAcademicYearId } = require("../utils/academic-year");

const populateExam = (query) =>
  query
    .populate("academicYearId", "name isActive")
    .populate("branchId", "name branchId")
    .populate("departmentId", "name code")
    .populate("classId", "name code level semester");

const getAllExamsController = async (req, res) => {
  try {
    const {
      examType = "",
      semester = "",
      academicYearId = "",
      classId = "",
      branchId = "",
      status = "",
    } = req.query;

    const query = {
      ...getArchiveFilter(req.query),
    };

    if (semester) query.semester = Number(semester);
    if (examType) query.examType = examType;
    if (academicYearId) query.academicYearId = academicYearId;
    if (classId) query.classId = classId;
    if (branchId) query.branchId = branchId;
    if (status) query.status = status;

    const exams = await populateExam(Exam.find(query).sort({ date: 1 }));

    if (!exams.length) {
      return ApiResponse.notFound("Aucun examen trouve").send(res);
    }

    return ApiResponse.success(exams, "Examens charges avec succes").send(res);
  } catch (error) {
    console.error("Get Exams Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addExamController = async (req, res) => {
  try {
    const formData = { ...req.body };

    if (req.file) {
      formData.timetableLink = req.file.filename;
    }

    if (
      !formData.name ||
      !formData.date ||
      !formData.semester ||
      !formData.examType ||
      !formData.totalMarks
    ) {
      return ApiResponse.badRequest(
        "Le nom, la date, le semestre, le type et la note maximale sont requis"
      ).send(res);
    }

    formData.academicYearId = await resolveAcademicYearId(formData.academicYearId);
    formData.totalMarks = Number(formData.totalMarks);
    formData.semester = Number(formData.semester);

    const exam = await Exam.create(formData);
    return ApiResponse.success(exam, "Examen ajoute avec succes").send(res);
  } catch (error) {
    console.error("Add Exam Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateExamController = async (req, res) => {
  try {
    const formData = { ...req.body };

    if (req.file) {
      formData.timetableLink = req.file.filename;
    }

    if (Object.prototype.hasOwnProperty.call(formData, "academicYearId")) {
      formData.academicYearId = await resolveAcademicYearId(
        formData.academicYearId
      );
    }

    if (formData.totalMarks !== undefined) {
      formData.totalMarks = Number(formData.totalMarks);
    }

    if (formData.semester !== undefined) {
      formData.semester = Number(formData.semester);
    }

    const exam = await populateExam(
      Exam.findByIdAndUpdate(req.params.id, formData, {
        new: true,
      })
    );

    if (!exam) {
      return ApiResponse.notFound("Examen introuvable").send(res);
    }

    return ApiResponse.success(exam, "Examen mis a jour avec succes").send(res);
  } catch (error) {
    console.error("Update Exam Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteExamController = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module examen"),
      { new: true }
    );

    if (!exam) {
      return ApiResponse.notFound("Examen introuvable").send(res);
    }

    return ApiResponse.success(exam, "Examen archive avec succes").send(res);
  } catch (error) {
    console.error("Delete Exam Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getAllExamsController,
  addExamController,
  updateExamController,
  deleteExamController,
};
