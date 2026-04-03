const ApiResponse = require("../utils/ApiResponse");
const AcademicClass = require("../models/class.model");
const Branch = require("../models/branch.model");
const StudentDetail = require("../models/details/student-details.model");
const Material = require("../models/material.model");
const Timetable = require("../models/timetable.model");

const normalizeCode = (code = "") => code.trim().toUpperCase();

const getClassesController = async (req, res) => {
  try {
    const { search = "", branchId = "", semester = "", status = "" } = req.query;
    const query = {};

    if (branchId) {
      query.branchId = branchId;
    }

    if (semester) {
      query.semester = Number(semester);
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const classes = await AcademicClass.find(query)
      .populate("branchId", "name branchId")
      .sort({ semester: 1, name: 1 });

    if (!classes || classes.length === 0) {
      return ApiResponse.notFound("Aucune classe trouvee").send(res);
    }

    return ApiResponse.success(classes, "Classes chargees avec succes").send(
      res
    );
  } catch (error) {
    console.error("Get Classes Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addClassController = async (req, res) => {
  try {
    const {
      name,
      code,
      branchId,
      semester,
      capacity = 0,
      description = "",
      status = "active",
    } = req.body;

    if (!name || !code || !branchId || !semester) {
      return ApiResponse.badRequest(
        "Les champs nom, code, filiere et semestre sont requis"
      ).send(res);
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return ApiResponse.notFound("Filiere introuvable").send(res);
    }

    const normalizedCode = normalizeCode(code);
    const existingClass = await AcademicClass.findOne({
      $or: [
        { code: normalizedCode },
        { name: name.trim(), branchId, semester: Number(semester) },
      ],
    });

    if (existingClass) {
      return ApiResponse.conflict(
        "Une classe avec ce nom ou ce code existe deja"
      ).send(res);
    }

    const academicClass = await AcademicClass.create({
      name: name.trim(),
      code: normalizedCode,
      branchId,
      semester: Number(semester),
      capacity: Number(capacity) || 0,
      description: description.trim(),
      status,
    });

    const populatedClass = await AcademicClass.findById(academicClass._id)
      .populate("branchId", "name branchId");

    return ApiResponse.created(
      populatedClass,
      "Classe ajoutee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Add Class Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateClassController = async (req, res) => {
  try {
    const { id } = req.params;
    const currentClass = await AcademicClass.findById(id);

    if (!currentClass) {
      return ApiResponse.notFound("Classe introuvable").send(res);
    }

    const nextBranchId = req.body.branchId || currentClass.branchId.toString();
    const nextSemester = Number(req.body.semester || currentClass.semester);
    const nextName = req.body.name ? req.body.name.trim() : currentClass.name;
    const nextCode = req.body.code
      ? normalizeCode(req.body.code)
      : currentClass.code;

    const branch = await Branch.findById(nextBranchId);
    if (!branch) {
      return ApiResponse.notFound("Filiere introuvable").send(res);
    }

    const duplicateClass = await AcademicClass.findOne({
      _id: { $ne: id },
      $or: [
        { code: nextCode },
        { name: nextName, branchId: nextBranchId, semester: nextSemester },
      ],
    });

    if (duplicateClass) {
      return ApiResponse.conflict(
        "Une classe avec ce nom ou ce code existe deja"
      ).send(res);
    }

    const branchChanged =
      String(currentClass.branchId) !== String(nextBranchId) ||
      Number(currentClass.semester) !== nextSemester;

    if (branchChanged) {
      const [studentUsingClass, materialUsingClass, timetableUsingClass] =
        await Promise.all([
          StudentDetail.exists({ classId: id }),
          Material.exists({ classId: id }),
          Timetable.exists({ classId: id }),
        ]);

      if (studentUsingClass || materialUsingClass || timetableUsingClass) {
        return ApiResponse.conflict(
          "Impossible de changer la filiere ou le semestre d'une classe deja utilisee"
        ).send(res);
      }
    }

    const updatedClass = await AcademicClass.findByIdAndUpdate(
      id,
      {
        ...req.body,
        name: nextName,
        code: nextCode,
        branchId: nextBranchId,
        semester: nextSemester,
        capacity:
          req.body.capacity !== undefined
            ? Number(req.body.capacity) || 0
            : currentClass.capacity,
        description:
          req.body.description !== undefined
            ? req.body.description.trim()
            : currentClass.description,
      },
      { new: true }
    ).populate("branchId", "name branchId");

    return ApiResponse.success(
      updatedClass,
      "Classe mise a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Class Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteClassController = async (req, res) => {
  try {
    const { id } = req.params;
    const academicClass = await AcademicClass.findById(id);

    if (!academicClass) {
      return ApiResponse.notFound("Classe introuvable").send(res);
    }

    const [studentUsingClass, materialUsingClass, timetableUsingClass] =
      await Promise.all([
        StudentDetail.exists({ classId: id }),
        Material.exists({ classId: id }),
        Timetable.exists({ classId: id }),
      ]);

    if (studentUsingClass || materialUsingClass || timetableUsingClass) {
      return ApiResponse.conflict(
        "Cette classe est deja utilisee par des etudiants ou des contenus academiques"
      ).send(res);
    }

    await AcademicClass.findByIdAndDelete(id);

    return ApiResponse.success(null, "Classe supprimee avec succes").send(res);
  } catch (error) {
    console.error("Delete Class Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getClassesController,
  addClassController,
  updateClassController,
  deleteClassController,
};
