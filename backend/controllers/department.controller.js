const Department = require("../models/department.model");
const ApiResponse = require("../utils/ApiResponse");
const { buildArchiveUpdate, getArchiveFilter } = require("../utils/archive");

const getDepartmentsController = async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const departments = await Department.find(query).sort({ name: 1 });

    if (!departments.length) {
      return ApiResponse.notFound("Aucun departement trouve").send(res);
    }

    return ApiResponse.success(
      departments,
      "Departements charges avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Departments Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addDepartmentController = async (req, res) => {
  try {
    const { name, code, description = "", status = "active" } = req.body;

    if (!name || !code) {
      return ApiResponse.badRequest(
        "Le nom et le code du departement sont requis"
      ).send(res);
    }

    const normalizedCode = code.trim().toUpperCase();
    const duplicateDepartment = await Department.findOne({
      $or: [{ name: name.trim() }, { code: normalizedCode }],
    });

    if (duplicateDepartment) {
      return ApiResponse.conflict(
        "Un departement avec ce nom ou ce code existe deja"
      ).send(res);
    }

    const department = await Department.create({
      name: name.trim(),
      code: normalizedCode,
      description: description.trim(),
      status,
    });

    return ApiResponse.created(
      department,
      "Departement cree avec succes"
    ).send(res);
  } catch (error) {
    console.error("Add Department Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateDepartmentController = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return ApiResponse.notFound("Departement introuvable").send(res);
    }

    const updateData = { ...req.body };

    if (updateData.name || updateData.code) {
      const duplicateDepartment = await Department.findOne({
        _id: { $ne: req.params.id },
        $or: [
          { name: updateData.name ? updateData.name.trim() : undefined },
          {
            code: updateData.code
              ? updateData.code.trim().toUpperCase()
              : undefined,
          },
        ],
      });

      if (duplicateDepartment) {
        return ApiResponse.conflict(
          "Un departement avec ce nom ou ce code existe deja"
        ).send(res);
      }
    }

    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
    }

    if (updateData.description !== undefined) {
      updateData.description = updateData.description.trim();
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    return ApiResponse.success(
      updatedDepartment,
      "Departement mis a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Department Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteDepartmentController = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module admin"),
      { new: true }
    );

    if (!department) {
      return ApiResponse.notFound("Departement introuvable").send(res);
    }

    return ApiResponse.success(
      department,
      "Departement archive avec succes"
    ).send(res);
  } catch (error) {
    console.error("Delete Department Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getDepartmentsController,
  addDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
};
