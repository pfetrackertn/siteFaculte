const ApiResponse = require("../utils/ApiResponse");
const AcademicClass = require("../models/class.model");
const Branch = require("../models/branch.model");
const Department = require("../models/department.model");
const { getArchiveFilter, buildArchiveUpdate } = require("../utils/archive");
const { resolveAcademicYearId } = require("../utils/academic-year");

const normalizeCode = (code = "") => code.trim().toUpperCase();

const populateAcademicClass = (query) =>
  query
    .populate("branchId", "name branchId")
    .populate("departmentId", "name code")
    .populate("academicYearId", "name isActive");

const getClassesController = async (req, res) => {
  try {
    const {
      search = "",
      branchId = "",
      semester = "",
      status = "",
      departmentId = "",
      academicYearId = "",
      level = "",
    } = req.query;
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (branchId) query.branchId = branchId;
    if (semester) query.semester = Number(semester);
    if (status) query.status = status;
    if (departmentId) query.departmentId = departmentId;
    if (academicYearId) query.academicYearId = academicYearId;
    if (level) query.level = level;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const classes = await populateAcademicClass(
      AcademicClass.find(query).sort({ semester: 1, level: 1, name: 1 })
    );

    if (!classes.length) {
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
      level = "L1",
      programType = "licence",
      departmentId = null,
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

    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return ApiResponse.notFound("Departement introuvable").send(res);
      }
    }

    const academicYearId = await resolveAcademicYearId(req.body.academicYearId);
    const normalizedCode = normalizeCode(code);

    const duplicateClass = await AcademicClass.findOne({
      $or: [
        { code: normalizedCode },
        {
          name: name.trim(),
          branchId,
          semester: Number(semester),
          academicYearId: academicYearId || null,
        },
      ],
    });

    if (duplicateClass) {
      return ApiResponse.conflict(
        "Une classe avec ce nom ou ce code existe deja"
      ).send(res);
    }

    const academicClass = await AcademicClass.create({
      name: name.trim(),
      code: normalizedCode,
      branchId,
      departmentId: departmentId || branch.departmentId || null,
      academicYearId,
      level,
      programType,
      semester: Number(semester),
      capacity: Number(capacity) || 0,
      description: description.trim(),
      status,
    });

    const populatedClass = await populateAcademicClass(
      AcademicClass.findById(academicClass._id)
    );

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

    const nextBranchId = req.body.branchId || currentClass.branchId?.toString();
    const nextAcademicYearId = Object.prototype.hasOwnProperty.call(
      req.body,
      "academicYearId"
    )
      ? await resolveAcademicYearId(req.body.academicYearId)
      : currentClass.academicYearId;
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
        {
          name: nextName,
          branchId: nextBranchId,
          semester: nextSemester,
          academicYearId: nextAcademicYearId || null,
        },
      ],
    });

    if (duplicateClass) {
      return ApiResponse.conflict(
        "Une classe avec ce nom ou ce code existe deja"
      ).send(res);
    }

    const updatedClass = await populateAcademicClass(
      AcademicClass.findByIdAndUpdate(
        id,
        {
          ...req.body,
          name: nextName,
          code: nextCode,
          branchId: nextBranchId,
          departmentId:
            req.body.departmentId || currentClass.departmentId || branch.departmentId,
          academicYearId: nextAcademicYearId || null,
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
      )
    );

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
    const academicClass = await AcademicClass.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module admin"),
      { new: true }
    );

    if (!academicClass) {
      return ApiResponse.notFound("Classe introuvable").send(res);
    }

    return ApiResponse.success(
      academicClass,
      "Classe archivee avec succes"
    ).send(res);
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
