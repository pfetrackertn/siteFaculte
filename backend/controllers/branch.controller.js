const Branch = require("../models/branch.model");
const ApiResponse = require("../utils/ApiResponse");
const { buildArchiveUpdate, getArchiveFilter } = require("../utils/archive");

const populateBranch = (query) =>
  query.populate("departmentId", "name code status");

const getBranchController = async (req, res) => {
  try {
    const { search = "", departmentId = "", status = "" } = req.query;
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { branchId: { $regex: search, $options: "i" } },
      ];
    }

    const branches = await populateBranch(Branch.find(query).sort({ name: 1 }));

    if (!branches.length) {
      return ApiResponse.notFound("Aucune filiere trouvee").send(res);
    }

    return ApiResponse.success(branches, "Filieres chargees avec succes").send(
      res
    );
  } catch (error) {
    console.error("Get Branch Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addBranchController = async (req, res) => {
  try {
    const { name, branchId, description = "", departmentId = null } = req.body;

    if (!name || !branchId) {
      return ApiResponse.badRequest(
        "Le nom et l'identifiant de la filiere sont requis"
      ).send(res);
    }

    const duplicateBranch = await Branch.findOne({
      $or: [{ name: name.trim() }, { branchId: branchId.trim() }],
    });

    if (duplicateBranch) {
      return ApiResponse.conflict(
        "Une filiere avec ce nom ou cet identifiant existe deja"
      ).send(res);
    }

    const newBranch = await Branch.create({
      name: name.trim(),
      branchId: branchId.trim(),
      description: description.trim(),
      departmentId: departmentId || null,
      status: req.body.status || "active",
    });

    const populatedBranch = await populateBranch(Branch.findById(newBranch._id));

    return ApiResponse.created(
      populatedBranch,
      "Filiere ajoutee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Add Branch Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateBranchController = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return ApiResponse.notFound("Filiere introuvable").send(res);
    }

    const updateData = { ...req.body };

    if (updateData.name || updateData.branchId) {
      const duplicateBranch = await Branch.findOne({
        _id: { $ne: req.params.id },
        $or: [
          { name: updateData.name ? updateData.name.trim() : undefined },
          {
            branchId: updateData.branchId
              ? updateData.branchId.trim()
              : undefined,
          },
        ],
      });

      if (duplicateBranch) {
        return ApiResponse.conflict(
          "Une filiere avec ce nom ou cet identifiant existe deja"
        ).send(res);
      }
    }

    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (updateData.branchId) {
      updateData.branchId = updateData.branchId.trim();
    }

    if (updateData.description !== undefined) {
      updateData.description = updateData.description.trim();
    }

    const updatedBranch = await populateBranch(
      Branch.findByIdAndUpdate(req.params.id, updateData, { new: true })
    );

    return ApiResponse.success(
      updatedBranch,
      "Filiere mise a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Branch Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteBranchController = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module admin"),
      { new: true }
    );

    if (!branch) {
      return ApiResponse.notFound("Filiere introuvable").send(res);
    }

    return ApiResponse.success(branch, "Filiere archivee avec succes").send(
      res
    );
  } catch (error) {
    console.error("Delete Branch Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getBranchController,
  addBranchController,
  updateBranchController,
  deleteBranchController,
};
