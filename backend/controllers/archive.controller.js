const AcademicYear = require("../models/academic-year.model");
const AcademicClass = require("../models/class.model");
const Exam = require("../models/exam.model");
const Marks = require("../models/marks.model");
const Notice = require("../models/notice.model");
const StudentDetail = require("../models/details/student-details.model");
const ApiResponse = require("../utils/ApiResponse");
const { buildArchiveUpdate } = require("../utils/archive");

const RESOURCE_MODELS = {
  students: StudentDetail,
  academicYears: AcademicYear,
  classes: AcademicClass,
  marks: Marks,
  notices: Notice,
  exams: Exam,
};

const getArchiveOverviewController = async (req, res) => {
  try {
    const [students, academicYears, classes, marks, notices, exams] =
      await Promise.all([
        StudentDetail.find({ isArchived: true })
          .select(
            "firstName middleName lastName enrollmentNo branchId classId archivedAt"
          )
          .populate("branchId", "name")
          .populate("classId", "name code")
          .sort({ archivedAt: -1 }),
        AcademicYear.find({ isArchived: true }).sort({ archivedAt: -1 }),
        AcademicClass.find({ isArchived: true })
          .populate("branchId", "name")
          .populate("academicYearId", "name")
          .sort({ archivedAt: -1 }),
        Marks.find({ isArchived: true })
          .populate("studentId", "firstName middleName lastName enrollmentNo")
          .populate("subjectId", "name code")
          .populate("examId", "name examType")
          .sort({ archivedAt: -1 }),
        Notice.find({ isArchived: true }).sort({ archivedAt: -1 }),
        Exam.find({ isArchived: true })
          .populate("academicYearId", "name")
          .sort({ archivedAt: -1 }),
      ]);

    return ApiResponse.success(
      {
        students,
        academicYears,
        classes,
        marks,
        notices,
        exams,
      },
      "Archives chargees avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Archive Overview Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const restoreArchivedResourceController = async (req, res) => {
  try {
    const { resource, id } = req.params;
    const ResourceModel = RESOURCE_MODELS[resource];

    if (!ResourceModel) {
      return ApiResponse.badRequest("Type de ressource d'archive invalide").send(
        res
      );
    }

    const restoredResource = await ResourceModel.findByIdAndUpdate(
      id,
      buildArchiveUpdate(false),
      { new: true }
    );

    if (!restoredResource) {
      return ApiResponse.notFound("Ressource archivee introuvable").send(res);
    }

    return ApiResponse.success(
      restoredResource,
      "Ressource restauree avec succes"
    ).send(res);
  } catch (error) {
    console.error("Restore Archived Resource Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getArchiveOverviewController,
  restoreArchivedResourceController,
};
