const Promotion = require("../models/promotion.model");
const ApiResponse = require("../utils/ApiResponse");
const { buildArchiveUpdate, getArchiveFilter } = require("../utils/archive");
const { resolveAcademicYearId } = require("../utils/academic-year");

const populatePromotion = (query) =>
  query
    .populate("academicYearId", "name isActive")
    .populate("departmentId", "name code")
    .populate("branchId", "name branchId")
    .populate("classId", "name code level semester");

const getPromotionsController = async (req, res) => {
  try {
    const {
      search = "",
      academicYearId = "",
      branchId = "",
      classId = "",
      departmentId = "",
      status = "",
    } = req.query;

    const query = {
      ...getArchiveFilter(req.query),
    };

    if (academicYearId) query.academicYearId = academicYearId;
    if (branchId) query.branchId = branchId;
    if (classId) query.classId = classId;
    if (departmentId) query.departmentId = departmentId;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const promotions = await populatePromotion(Promotion.find(query).sort({
      intakeYear: -1,
      createdAt: -1,
    }));

    if (!promotions.length) {
      return ApiResponse.notFound("Aucune promotion trouvee").send(res);
    }

    return ApiResponse.success(
      promotions,
      "Promotions chargees avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Promotions Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addPromotionController = async (req, res) => {
  try {
    const {
      name,
      code,
      description = "",
      intakeYear,
      branchId = null,
      classId = null,
      departmentId = null,
      status = "active",
    } = req.body;

    if (!name || !code || !intakeYear) {
      return ApiResponse.badRequest(
        "Le nom, le code et l'annee d'entree sont requis"
      ).send(res);
    }

    const academicYearId = await resolveAcademicYearId(req.body.academicYearId);
    if (!academicYearId) {
      return ApiResponse.badRequest(
        "Aucune annee academique active n'est disponible"
      ).send(res);
    }

    const normalizedCode = code.trim().toUpperCase();
    const duplicatePromotion = await Promotion.findOne({
      $or: [{ code: normalizedCode }, { name: name.trim() }],
    });

    if (duplicatePromotion) {
      return ApiResponse.conflict(
        "Une promotion avec ce nom ou ce code existe deja"
      ).send(res);
    }

    const promotion = await Promotion.create({
      name: name.trim(),
      code: normalizedCode,
      description: description.trim(),
      intakeYear: Number(intakeYear),
      academicYearId,
      branchId: branchId || null,
      classId: classId || null,
      departmentId: departmentId || null,
      status,
    });

    const populatedPromotion = await populatePromotion(
      Promotion.findById(promotion._id)
    );

    return ApiResponse.created(
      populatedPromotion,
      "Promotion creee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Add Promotion Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updatePromotionController = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return ApiResponse.notFound("Promotion introuvable").send(res);
    }

    const updateData = { ...req.body };

    if (updateData.name || updateData.code) {
      const duplicatePromotion = await Promotion.findOne({
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

      if (duplicatePromotion) {
        return ApiResponse.conflict(
          "Une promotion avec ce nom ou ce code existe deja"
        ).send(res);
      }
    }

    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();
    if (updateData.description !== undefined) {
      updateData.description = updateData.description.trim();
    }
    if (updateData.intakeYear) {
      updateData.intakeYear = Number(updateData.intakeYear);
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "academicYearId")) {
      updateData.academicYearId = await resolveAcademicYearId(
        updateData.academicYearId
      );
    }

    const updatedPromotion = await populatePromotion(
      Promotion.findByIdAndUpdate(req.params.id, updateData, { new: true })
    );

    return ApiResponse.success(
      updatedPromotion,
      "Promotion mise a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Promotion Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deletePromotionController = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module admin"),
      { new: true }
    );

    if (!promotion) {
      return ApiResponse.notFound("Promotion introuvable").send(res);
    }

    return ApiResponse.success(
      promotion,
      "Promotion archivee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Delete Promotion Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getPromotionsController,
  addPromotionController,
  updatePromotionController,
  deletePromotionController,
};
