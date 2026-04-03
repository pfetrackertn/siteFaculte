const Timetable = require("../models/timetable.model");
const AcademicClass = require("../models/class.model");
const ApiResponse = require("../utils/ApiResponse");

const normalizeClassId = (classId) => {
  if (!classId || classId === "null" || classId === "undefined") {
    return null;
  }

  return classId;
};

const ensureTimetableClassMatchesContext = async ({
  classId,
  branch,
  semester,
}) => {
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

const getTimetableController = async (req, res) => {
  try {
    const { semester, branch, classId } = req.query;
    let query = {};

    if (semester) query.semester = semester;
    if (branch) query.branch = branch;
    if (classId) {
      query.$or = [{ classId }, { classId: null }];
    }

    const timetables = await Timetable.find(query)
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
    const classId = normalizeClassId(req.body.classId);

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

    const classValidation = await ensureTimetableClassMatchesContext({
      classId,
      branch,
      semester,
    });

    if (classValidation.error) {
      return ApiResponse.badRequest(classValidation.error).send(res);
    }

    let timetableQuery;

    if (classId) {
      timetableQuery = { classId };
    } else {
      timetableQuery = { semester, branch, classId: null };
    }

    let timetable = await Timetable.findOne(timetableQuery);

    if (timetable) {
      timetable = await Timetable.findByIdAndUpdate(
        timetable._id,
        {
          semester,
          branch,
          classId,
          link: req.file.filename,
        },
        { new: true }
      )
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
        timetable,
        "Emploi du temps mis a jour avec succes"
      ).send(res);
    }

    timetable = await Timetable.create({
      semester,
      branch,
      classId,
      link: req.file.filename,
    });

    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate("branch")
      .populate({
        path: "classId",
        select: "name code semester branchId",
        populate: {
          path: "branchId",
          select: "name branchId",
        },
      });

    return ApiResponse.created(
      populatedTimetable,
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

    const currentTimetable = await Timetable.findById(id);

    if (!currentTimetable) {
      return ApiResponse.notFound("Emploi du temps introuvable").send(res);
    }

    const normalizedClassId = Object.prototype.hasOwnProperty.call(
      req.body,
      "classId"
    )
      ? normalizeClassId(req.body.classId)
      : currentTimetable.classId;

    const classValidation = await ensureTimetableClassMatchesContext({
      classId: normalizedClassId,
      branch: branch || currentTimetable.branch,
      semester: semester || currentTimetable.semester,
    });

    if (classValidation.error) {
      return ApiResponse.badRequest(classValidation.error).send(res);
    }

    const updateData = {
      semester,
      branch,
      classId: normalizedClassId,
    };

    if (req.file) {
      updateData.link = req.file.filename;
    }

    const timetable = await Timetable.findByIdAndUpdate(id, updateData, {
      new: true,
    })
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
