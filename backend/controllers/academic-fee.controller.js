const AcademicFee = require("../models/academic-fee.model");
const StudentDetail = require("../models/details/student-details.model");
const ApiResponse = require("../utils/ApiResponse");
const { buildArchiveUpdate, getArchiveFilter } = require("../utils/archive");
const { resolveAcademicYearId } = require("../utils/academic-year");

const populateAcademicFee = (query) =>
  query
    .populate("academicYearId", "name isActive")
    .populate("departmentId", "name code")
    .populate("branchId", "name branchId")
    .populate("classId", "name code level semester");

const getAcademicFeesController = async (req, res) => {
  try {
    const {
      search = "",
      academicYearId = "",
      classId = "",
      branchId = "",
      departmentId = "",
      status = "",
    } = req.query;
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (academicYearId) query.academicYearId = academicYearId;
    if (classId) query.classId = classId;
    if (branchId) query.branchId = branchId;
    if (departmentId) query.departmentId = departmentId;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { feeType: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const academicFees = await populateAcademicFee(
      AcademicFee.find(query).sort({ dueDate: 1, createdAt: -1 })
    );

    if (!academicFees.length) {
      return ApiResponse.notFound("Aucun frais academique trouve").send(res);
    }

    return ApiResponse.success(
      academicFees,
      "Frais academiques charges avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Academic Fees Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addAcademicFeeController = async (req, res) => {
  try {
    const {
      feeType,
      amount,
      description = "",
      dueDate,
      classId = null,
      branchId = null,
      departmentId = null,
      status = "active",
    } = req.body;

    if (!feeType || amount === undefined || !dueDate) {
      return ApiResponse.badRequest(
        "Le type de frais, le montant et la date limite sont requis"
      ).send(res);
    }

    const academicYearId = await resolveAcademicYearId(req.body.academicYearId);
    if (!academicYearId) {
      return ApiResponse.badRequest(
        "Aucune annee academique active n'est disponible"
      ).send(res);
    }

    const academicFee = await AcademicFee.create({
      feeType: feeType.trim(),
      amount: Number(amount),
      description: description.trim(),
      dueDate: new Date(dueDate),
      academicYearId,
      classId: classId || null,
      branchId: branchId || null,
      departmentId: departmentId || null,
      status,
    });

    const populatedAcademicFee = await populateAcademicFee(
      AcademicFee.findById(academicFee._id)
    );

    return ApiResponse.created(
      populatedAcademicFee,
      "Frais academique cree avec succes"
    ).send(res);
  } catch (error) {
    console.error("Add Academic Fee Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateAcademicFeeController = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const academicFee = await AcademicFee.findById(req.params.id);

    if (!academicFee) {
      return ApiResponse.notFound("Frais academique introuvable").send(res);
    }

    if (updateData.feeType) {
      updateData.feeType = updateData.feeType.trim();
    }

    if (updateData.description !== undefined) {
      updateData.description = updateData.description.trim();
    }

    if (updateData.amount !== undefined) {
      updateData.amount = Number(updateData.amount);
    }

    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "academicYearId")) {
      updateData.academicYearId = await resolveAcademicYearId(
        updateData.academicYearId
      );
    }

    const updatedAcademicFee = await populateAcademicFee(
      AcademicFee.findByIdAndUpdate(req.params.id, updateData, { new: true })
    );

    return ApiResponse.success(
      updatedAcademicFee,
      "Frais academique mis a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Academic Fee Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteAcademicFeeController = async (req, res) => {
  try {
    const academicFee = await AcademicFee.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module admin"),
      { new: true }
    );

    if (!academicFee) {
      return ApiResponse.notFound("Frais academique introuvable").send(res);
    }

    return ApiResponse.success(
      academicFee,
      "Frais academique archive avec succes"
    ).send(res);
  } catch (error) {
    console.error("Delete Academic Fee Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getStudentAcademicFeesController = async (req, res) => {
  try {
    const student = await StudentDetail.findById(req.userId).select(
      "academicYearId branchId classId departmentId"
    );

    if (!student) {
      return ApiResponse.notFound("Etudiant introuvable").send(res);
    }

    const academicYearId = await resolveAcademicYearId(student.academicYearId);
    if (!academicYearId) {
      return ApiResponse.notFound(
        "Aucune annee academique active n'est disponible"
      ).send(res);
    }

    const academicFees = await populateAcademicFee(
      AcademicFee.find({
        academicYearId,
        status: "active",
        ...getArchiveFilter(),
        $and: [
          {
            $or: [{ classId: null }, { classId: student.classId || null }],
          },
          {
            $or: [{ branchId: null }, { branchId: student.branchId || null }],
          },
          {
            $or: [
              { departmentId: null },
              { departmentId: student.departmentId || null },
            ],
          },
        ],
      }).sort({ dueDate: 1, createdAt: -1 })
    );

    if (!academicFees.length) {
      return ApiResponse.notFound(
        "Aucun frais academique disponible pour cet etudiant"
      ).send(res);
    }

    return ApiResponse.success(
      academicFees,
      "Frais academiques de l'etudiant charges avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Student Academic Fees Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getAcademicFeesController,
  addAcademicFeeController,
  updateAcademicFeeController,
  deleteAcademicFeeController,
  getStudentAcademicFeesController,
};
