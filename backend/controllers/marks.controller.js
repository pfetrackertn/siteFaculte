const Marks = require("../models/marks.model");
const Student = require("../models/details/student-details.model");

const getMarksController = async (req, res) => {
  try {
    const { studentId, semester, examId, subjectId } = req.query;

    const query = {};
    if (studentId) query.studentId = studentId;
    if (semester) query.semester = Number(semester);
    if (examId) query.examId = examId;
    if (subjectId) query.subjectId = subjectId;

    const marks = await Marks.find(query)
      .populate("studentId", "firstName middleName lastName enrollmentNo")
      .populate("subjectId", "name code")
      .populate("examId", "name examType totalMarks")
      .sort({ semester: 1, createdAt: -1 });

    if (!marks || marks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Aucune note n'a ete trouvee pour ces criteres",
      });
    }

    return res.json({
      success: true,
      message: "Notes chargees avec succes",
      data: marks,
    });
  } catch (error) {
    console.error("Error in getMarksController:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
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
      return res.status(400).json({
        success: false,
        message:
          "Donnees invalides. Champs requis : studentId, semester, subjectId, examId et marksObtained",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Etudiant introuvable",
      });
    }

    const marks = await Marks.findOneAndUpdate(
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
        marksObtained: Number(marksObtained),
      },
      {
        new: true,
        upsert: true,
      }
    )
      .populate("studentId", "firstName middleName lastName enrollmentNo")
      .populate("subjectId", "name code")
      .populate("examId", "name examType totalMarks");

    return res.json({
      success: true,
      message: "Notes mises a jour avec succes",
      data: marks,
    });
  } catch (error) {
    console.error("Error in addMarksController:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

const deleteMarksController = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMarks = await Marks.findByIdAndDelete(id);

    if (!deletedMarks) {
      return res.status(404).json({
        success: false,
        message: "Notes introuvables",
      });
    }

    return res.json({
      success: true,
      message: "Notes supprimees avec succes",
    });
  } catch (error) {
    console.error("Error in deleteMarksController:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

const addBulkMarksController = async (req, res) => {
  try {
    const { marks, examId, subjectId, semester } = req.body;

    if (!marks || !Array.isArray(marks) || !examId || !subjectId || !semester) {
      return res.status(400).json({
        success: false,
        message:
          "Donnees invalides. Champs requis : tableau de notes, examId, subjectId et semestre",
      });
    }

    const results = [];
    for (const markData of marks) {
      const existingMark = await Marks.findOne({
        studentId: markData.studentId,
        examId,
        subjectId,
        semester: Number(semester),
      });

      if (existingMark) {
        existingMark.marksObtained = Number(markData.obtainedMarks);
        await existingMark.save();
        results.push(existingMark);
      } else {
        const newMark = await Marks.create({
          studentId: markData.studentId,
          examId,
          subjectId,
          semester: Number(semester),
          marksObtained: Number(markData.obtainedMarks),
        });
        results.push(newMark);
      }
    }

    return res.json({
      success: true,
      message: "Notes enregistrees avec succes",
      data: results,
    });
  } catch (error) {
    console.error("Error in addBulkMarksController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de l'enregistrement des notes",
    });
  }
};

const getStudentsWithMarksController = async (req, res) => {
  try {
    const { branch, subject, semester, examId } = req.query;

    if (!branch || !subject || !semester || !examId) {
      return res.status(400).json({
        success: false,
        message:
          "Parametres requis manquants : filiere, matiere, semestre et examId sont obligatoires",
      });
    }

    const students = await Student.find({
      branchId: branch,
      semester: Number(semester),
    }).select("_id enrollmentNo firstName lastName");

    if (!students || students.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Aucun etudiant trouve pour ces criteres",
      });
    }

    const marks = await Marks.find({
      studentId: { $in: students.map((s) => s._id) },
      examId,
      subjectId: subject,
      semester: Number(semester),
    });

    const studentsWithMarks = students.map((student) => {
      const studentMarks = marks.find(
        (m) => m.studentId.toString() === student._id.toString()
      );

      return {
        ...student.toObject(),
        obtainedMarks: studentMarks ? studentMarks.marksObtained : 0,
      };
    });

    return res.json({
      success: true,
      message: "Etudiants et notes charges avec succes",
      data: studentsWithMarks,
    });
  } catch (error) {
    console.error("Error in getStudentsWithMarksController:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "Erreur lors du chargement des etudiants avec notes",
    });
  }
};

const getStudentMarksController = async (req, res) => {
  try {
    const { semester } = req.query;
    const studentId = req.userId;

    if (!semester) {
      return res.status(400).json({
        success: false,
        message: "Le semestre est requis",
      });
    }

    const marks = await Marks.find({
      studentId,
      semester: Number(semester),
    })
      .populate("subjectId", "name")
      .populate("examId", "name examType totalMarks")
      .sort({ createdAt: -1 });

    if (!marks || marks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Aucune note trouvee pour ce semestre",
      });
    }

    return res.json({
      success: true,
      message: "Notes chargees avec succes",
      data: marks,
    });
  } catch (error) {
    console.error("Error in getStudentMarksController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Erreur lors du chargement des notes",
    });
  }
};

module.exports = {
  getMarksController,
  addMarksController,
  deleteMarksController,
  addBulkMarksController,
  getStudentsWithMarksController,
  getStudentMarksController,
};
