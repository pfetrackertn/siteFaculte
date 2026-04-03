const Timetable = require("../models/timetable.model");
const ApiResponse = require("../utils/ApiResponse");

const getTimetableController = async (req, res) => {
  try {
    const { semester, branch } = req.query;
    let query = {};

    if (semester) query.semester = semester;
    if (branch) query.branch = branch;

    const timetables = await Timetable.find(query)
      .populate("branch")
      .sort({ createdAt: -1 });

    if (!timetables || timetables.length === 0) {
      return ApiResponse.notFound("Aucun emploi du temps trouve").send(res);
    }

    return ApiResponse.success(
      timetables,
      "Emplois du temps charges avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Timetable Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addTimetableController = async (req, res) => {
  try {
    const { semester, branch } = req.body;

    if (!semester || !branch) {
      return ApiResponse.badRequest("Le semestre et la filiere sont requis").send(
        res
      );
    }

    if (!req.file) {
      return ApiResponse.badRequest(
        "Le fichier de l'emploi du temps est requis"
      ).send(res);
    }

    let timetable = await Timetable.findOne({ semester, branch });

    if (timetable) {
      timetable = await Timetable.findByIdAndUpdate(
        timetable._id,
        {
          semester,
          branch,
          link: req.file.filename,
        },
        { new: true }
      );
      return ApiResponse.success(
        timetable,
        "Emploi du temps mis a jour avec succes"
      ).send(res);
    }

    timetable = await Timetable.create({
      semester,
      branch,
      link: req.file.filename,
    });

    return ApiResponse.created(
      timetable,
      "Emploi du temps ajoute avec succes"
    ).send(
      res
    );
  } catch (error) {
    console.error("Add Timetable Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateTimetableController = async (req, res) => {
  try {
    const { id } = req.params;
    const { semester, branch } = req.body;

    if (!id) {
      return ApiResponse.badRequest(
        "L'identifiant de l'emploi du temps est requis"
      ).send(res);
    }

    const timetable = await Timetable.findByIdAndUpdate(
      id,
      {
        semester,
        branch,
        link: req.file ? req.file.filename : undefined,
      },
      { new: true }
    );

    if (!timetable) {
      return ApiResponse.notFound("Emploi du temps introuvable").send(res);
    }

    return ApiResponse.success(
      timetable,
      "Emploi du temps mis a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Timetable Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteTimetableController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ApiResponse.badRequest(
        "L'identifiant de l'emploi du temps est requis"
      ).send(res);
    }

    const timetable = await Timetable.findByIdAndDelete(id);

    if (!timetable) {
      return ApiResponse.notFound("Emploi du temps introuvable").send(res);
    }

    return ApiResponse.success(null, "Emploi du temps supprime avec succes").send(
      res
    );
  } catch (error) {
    console.error("Delete Timetable Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getTimetableController,
  addTimetableController,
  updateTimetableController,
  deleteTimetableController,
};
