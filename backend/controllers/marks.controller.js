const Marks = require("../models/marks.model");
const Student = require("../models/details/student-details.model");
const Subject = require("../models/subject.model");
const Exam = require("../models/exam.model");
const ApiResponse = require("../utils/ApiResponse");
const { getArchiveFilter, buildArchiveUpdate } = require("../utils/archive");
const { resolveAcademicYearId } = require("../utils/academic-year");
const { computeStudentAverageSummary } = require("../utils/student-average");

const buildMarksQuery = (queryParams = {}) => {
  const query = {
    ...getArchiveFilter(queryParams),
  };

  if (queryParams.studentId) query.studentId = queryParams.studentId;
  if (queryParams.semester) query.semester = Number(queryParams.semester);
  if (queryParams.examId) query.examId = queryParams.examId;
  if (queryParams.subjectId) query.subjectId = queryParams.subjectId;
  if (queryParams.academicYearId) query.academicYearId = queryParams.academicYearId;

  return query;
};

const populateMarks = (query) =>
  query
    .populate("studentId", "firstName middleName lastName enrollmentNo")
    .populate("subjectId", "name code credits")
    .populate("classId", "name code level semester")
    .populate("academicYearId", "name isActive")
    .populate("examId", "name examType totalMarks");

const ensureMarksDependencies = async ({
  studentId,
  subjectId,
  examId,
  semester,
}) => {
  const [student, subject, exam] = await Promise.all([
    Student.findById(studentId).select(
      "classId academicYearId semester branchId departmentId isArchived"
    ),
    Subject.findById(subjectId).select(
      "semester academicYearId classId branch departmentId isArchived"
    ),
    Exam.findById(examId).select(
      "semester academicYearId classId branchId departmentId totalMarks isArchived"
    ),
  ]);

  if (!student || student.isArchived) {
    return { error: "Etudiant introuvable" };
  }

  if (!subject || subject.isArchived) {
    return { error: "Matiere introuvable" };
  }

  if (!exam || exam.isArchived) {
    return { error: "Examen introuvable" };
  }

  if (Number(subject.semester) !== Number(semester)) {
    return {
      error: "La matiere selectionnee ne correspond pas au semestre choisi",
    };
  }

  if (Number(exam.semester) !== Number(semester)) {
    return {
      error: "L'examen selectionne ne correspond pas au semestre choisi",
    };
  }

  return { student, subject, exam };
};

const getMarksController = async (req, res) => {
  try {
    const marks = await populateMarks(
      Marks.find(buildMarksQuery(req.query)).sort({ semester: 1, createdAt: -1 })
    );

    if (!marks.length) {
      return ApiResponse.success(
        [],
        "Aucune note n'a ete trouvee pour ces criteres"
      ).send(res);
    }

    return ApiResponse.success(marks, "Notes chargees avec succes").send(res);
  } catch (error) {
    console.error("Get Marks Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addMarksController = async (req, res) => {
  try {
    const { studentId, semester, subjectId, examId, marksObtained } = req.body;

    if (
      !studentId ||
      !semester ||
      !subjectId ||
      !examId ||
      marksObtained === undefined
    ) {
      return ApiResponse.badRequest(
        "Donnees invalides. Champs requis : studentId, semester, subjectId, examId et marksObtained"
      ).send(res);
    }

    const dependencyCheck = await ensureMarksDependencies({
      studentId,
      subjectId,
      examId,
      semester,
    });

    if (dependencyCheck.error) {
      return ApiResponse.badRequest(dependencyCheck.error).send(res);
    }

    const resolvedAcademicYearId = await resolveAcademicYearId(
      req.body.academicYearId || dependencyCheck.student.academicYearId
    );

    const marks = await populateMarks(
      Marks.findOneAndUpdate(
        {
          studentId,
          semester: Number(semester),
          subjectId,
          examId,
        },
        {
          studentId,
          semester: Number(semester),
          subjectId,
          examId,
          classId: dependencyCheck.student.classId || dependencyCheck.subject.classId || null,
          academicYearId:
            resolvedAcademicYearId ||
            dependencyCheck.subject.academicYearId ||
            dependencyCheck.exam.academicYearId ||
            null,
          marksObtained: Number(marksObtained),
          isArchived: false,
          archivedAt: null,
          archiveReason: "",
        },
        {
          new: true,
          upsert: true,
        }
      )
    );

    return ApiResponse.success(marks, "Notes mises a jour avec succes").send(
      res
    );
  } catch (error) {
    console.error("Add Marks Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteMarksController = async (req, res) => {
  try {
    const archivedMarks = await Marks.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module de notes"),
      { new: true }
    );

    if (!archivedMarks) {
      return ApiResponse.notFound("Notes introuvables").send(res);
    }

    return ApiResponse.success(
      archivedMarks,
      "Notes archivees avec succes"
    ).send(res);
  } catch (error) {
    console.error("Delete Marks Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addBulkMarksController = async (req, res) => {
  try {
    const { marks, examId, subjectId, semester, academicYearId } = req.body;

    if (!marks || !Array.isArray(marks) || !examId || !subjectId || !semester) {
      return ApiResponse.badRequest(
        "Donnees invalides. Champs requis : tableau de notes, examId, subjectId et semestre"
      ).send(res);
    }

    const results = [];

    for (const markData of marks) {
      const dependencyCheck = await ensureMarksDependencies({
        studentId: markData.studentId,
        subjectId,
        examId,
        semester,
      });

      if (dependencyCheck.error) {
        return ApiResponse.badRequest(
          `Erreur pour l'etudiant ${markData.studentId}: ${dependencyCheck.error}`
        ).send(res);
      }

      const resolvedAcademicYearId = await resolveAcademicYearId(
        academicYearId || dependencyCheck.student.academicYearId
      );

      const savedMark = await Marks.findOneAndUpdate(
        {
          studentId: markData.studentId,
          examId,
          subjectId,
          semester: Number(semester),
        },
        {
          studentId: markData.studentId,
          examId,
          subjectId,
          semester: Number(semester),
          classId:
            dependencyCheck.student.classId ||
            dependencyCheck.subject.classId ||
            null,
          academicYearId:
            resolvedAcademicYearId ||
            dependencyCheck.subject.academicYearId ||
            dependencyCheck.exam.academicYearId ||
            null,
          marksObtained: Number(markData.obtainedMarks),
          isArchived: false,
          archivedAt: null,
          archiveReason: "",
        },
        {
          new: true,
          upsert: true,
        }
      );

      results.push(savedMark);
    }

    return ApiResponse.success(results, "Notes enregistrees avec succes").send(
      res
    );
  } catch (error) {
    console.error("Add Bulk Marks Error:", error);
    return ApiResponse.internalServerError(
      error.message || "Erreur lors de l'enregistrement des notes"
    ).send(res);
  }
};

const getStudentsWithMarksController = async (req, res) => {
  try {
    const { branch, subject, semester, examId, classId } = req.query;

    if (!branch || !subject || !semester || !examId) {
      return ApiResponse.badRequest(
        "Parametres requis manquants : filiere, matiere, semestre et examId sont obligatoires"
      ).send(res);
    }

    const students = await Student.find({
      branchId: branch,
      semester: Number(semester),
      ...(classId ? { classId } : {}),
      ...getArchiveFilter(),
    }).select("_id enrollmentNo firstName lastName classId");

    if (!students.length) {
      return ApiResponse.success(
        [],
        "Aucun etudiant trouve pour ces criteres"
      ).send(res);
    }

    const marks = await Marks.find({
      studentId: { $in: students.map((student) => student._id) },
      examId,
      subjectId: subject,
      semester: Number(semester),
      ...getArchiveFilter(),
    });

    const studentsWithMarks = students.map((student) => {
      const studentMarks = marks.find(
        (mark) => mark.studentId.toString() === student._id.toString()
      );

      return {
        ...student.toObject(),
        obtainedMarks: studentMarks ? studentMarks.marksObtained : 0,
      };
    });

    return ApiResponse.success(
      studentsWithMarks,
      "Etudiants et notes charges avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Students With Marks Error:", error);
    return ApiResponse.internalServerError(
      error.message || "Erreur lors du chargement des etudiants avec notes"
    ).send(res);
  }
};

const getStudentMarksController = async (req, res) => {
  try {
    const { semester } = req.query;
    const studentId = req.userId;

    if (!semester) {
      return ApiResponse.badRequest("Le semestre est requis").send(res);
    }

    const marks = await populateMarks(
      Marks.find({
        studentId,
        semester: Number(semester),
        ...getArchiveFilter(),
      }).sort({ createdAt: -1 })
    );

    return ApiResponse.success(
      marks,
      marks.length
        ? "Notes chargees avec succes"
        : "Aucune note trouvee pour ce semestre"
    ).send(res);
  } catch (error) {
    console.error("Get Student Marks Error:", error);
    return ApiResponse.internalServerError(
      error.message || "Erreur lors du chargement des notes"
    ).send(res);
  }
};

const getStudentAverageSummaryController = async (req, res) => {
  try {
    const summary = await computeStudentAverageSummary({
      studentId: req.userId,
      semester: req.query.semester || null,
    });

    return ApiResponse.success(
      summary,
      "Synthese des moyennes chargee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Student Average Summary Error:", error);
    return ApiResponse.internalServerError(
      error.message || "Erreur lors du calcul de la moyenne generale"
    ).send(res);
  }
};

const getAverageSummaryByStudentController = async (req, res) => {
  try {
    const summary = await computeStudentAverageSummary({
      studentId: req.params.studentId,
      semester: req.query.semester || null,
    });

    return ApiResponse.success(
      summary,
      "Synthese des moyennes chargee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Average Summary By Student Error:", error);
    return ApiResponse.internalServerError(
      error.message || "Erreur lors du calcul de la moyenne generale"
    ).send(res);
  }
};

module.exports = {
  getMarksController,
  addMarksController,
  deleteMarksController,
  addBulkMarksController,
  getStudentsWithMarksController,
  getStudentMarksController,
  getStudentAverageSummaryController,
  getAverageSummaryByStudentController,
};
