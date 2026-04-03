const Marks = require("../models/marks.model");
const Student = require("../models/details/student-details.model");

const getMarksController = async (req, res) => {
  try {
    const { studentId, semester, examId } = req.query;

    const query = { student: studentId };
    if (semester) {
      query.semester = semester;
    }

    if (examId) {
      query.examId = examId;
    }

    const marks = await Marks.find(query)
      .populate("branch", "name")
      .populate("marks.subject", "name")
      .populate("student", "firstName lastName enrollmentNo");

    if (!marks || marks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Aucune note n'a ete trouvee pour ces criteres",
      });
    }

    res.json({
      success: true,
      message: "Notes chargees avec succes",
      data: marks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

const addMarksController = async (req, res) => {
  try {
    const { studentId, semester, branch, marks } = req.body;

    if (!studentId || !semester || !branch || !marks || !Array.isArray(marks)) {
      return res.status(400).json({
        success: false,
        message: "Donnees d'entree invalides",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Etudiant introuvable",
      });
    }

    let existingMarks = await Marks.findOne({ student: studentId, semester });

    if (existingMarks) {
      existingMarks.marks = marks;
      await existingMarks.save();
    } else {
      existingMarks = await Marks.create({
        student: studentId,
        semester,
        branch,
        marks,
      });
    }

    res.json({
      success: true,
      message: "Notes mises a jour avec succes",
      data: existingMarks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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

    res.json({
      success: true,
      message: "Notes supprimees avec succes",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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
        semester,
      });

      if (existingMark) {
        existingMark.marksObtained = markData.obtainedMarks;
        await existingMark.save();
        results.push(existingMark);
      } else {
        const newMark = await Marks.create({
          studentId: markData.studentId,
          examId,
          subjectId,
          semester,
          marksObtained: markData.obtainedMarks,
        });
        results.push(newMark);
      }
    }

    res.json({
      success: true,
      message: "Notes enregistrees avec succes",
      data: results,
    });
  } catch (error) {
    console.error("Error in addBulkMarksController:", error);
    res.status(500).json({
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

    res.json({
      success: true,
      message: "Etudiants et notes charges avec succes",
      data: studentsWithMarks,
    });
  } catch (error) {
    console.error("Error in getStudentsWithMarksController:", error);
    res.status(500).json({
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
      .populate("examId", "name examType totalMarks");

    if (!marks || marks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Aucune note trouvee pour ce semestre",
      });
    }

    res.json({
      success: true,
      message: "Notes chargees avec succes",
      data: marks,
    });
  } catch (error) {
    console.error("Error in getStudentMarksController:", error);
    res.status(500).json({
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
