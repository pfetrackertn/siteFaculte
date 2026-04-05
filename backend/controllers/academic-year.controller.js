const AcademicYear = require("../models/academic-year.model");
const ApiResponse = require("../utils/ApiResponse");
const {
  deactivateOtherAcademicYears,
  getActiveAcademicYear,
} = require("../utils/academic-year");
const { buildArchiveUpdate, getArchiveFilter } = require("../utils/archive");

const validateAcademicYearDates = (startDate, endDate) => {
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (
    Number.isNaN(parsedStartDate.getTime()) ||
    Number.isNaN(parsedEndDate.getTime())
  ) {
    return { error: "Les dates de l'annee academique sont invalides" };
  }

  if (parsedStartDate >= parsedEndDate) {
    return {
      error:
        "La date de debut de l'annee academique doit preceder la date de fin",
    };
  }

  return {
    startDate: parsedStartDate,
    endDate: parsedEndDate,
  };
};

const getAcademicYearsController = async (req, res) => {
  try {
    const { search = "", status = "", activeOnly = false } = req.query;
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (status) {
      query.status = status;
    }

    if (String(activeOnly) === "true") {
      query.isActive = true;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const academicYears = await AcademicYear.find(query).sort({
      startDate: -1,
    });

    if (!academicYears.length) {
      return ApiResponse.notFound("Aucune annee academique trouvee").send(res);
    }

    return ApiResponse.success(
      academicYears,
      "Annees academiques chargees avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Academic Years Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getActiveAcademicYearController = async (req, res) => {
  try {
    const academicYear = await getActiveAcademicYear();

    if (!academicYear) {
      return ApiResponse.notFound(
        "Aucune annee academique active n'a ete definie"
      ).send(res);
    }

    return ApiResponse.success(
      academicYear,
      "Annee academique active chargee"
    ).send(res);
  } catch (error) {
    console.error("Get Active Academic Year Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addAcademicYearController = async (req, res) => {
  try {
    const { name, startDate, endDate, isActive = false, description = "" } =
      req.body;

    if (!name || !startDate || !endDate) {
      return ApiResponse.badRequest(
        "Le nom, la date de debut et la date de fin sont requis"
      ).send(res);
    }

    const dateValidation = validateAcademicYearDates(startDate, endDate);
    if (dateValidation.error) {
      return ApiResponse.badRequest(dateValidation.error).send(res);
    }

    const existingAcademicYear = await AcademicYear.findOne({
      name: name.trim(),
    });

    if (existingAcademicYear) {
      return ApiResponse.conflict(
        "Une annee academique avec ce nom existe deja"
      ).send(res);
    }

    const academicYear = await AcademicYear.create({
      name: name.trim(),
      startDate: dateValidation.startDate,
      endDate: dateValidation.endDate,
      description: description.trim(),
      isActive: String(isActive) === "true" || isActive === true,
      status: req.body.status || "active",
    });

    if (academicYear.isActive) {
      await deactivateOtherAcademicYears(academicYear._id);
    }

    return ApiResponse.created(
      academicYear,
      "Annee academique creee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Add Academic Year Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateAcademicYearController = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);

    if (!academicYear) {
      return ApiResponse.notFound("Annee academique introuvable").send(res);
    }

    const updateData = { ...req.body };

    if (updateData.startDate || updateData.endDate) {
      const dateValidation = validateAcademicYearDates(
        updateData.startDate || academicYear.startDate,
        updateData.endDate || academicYear.endDate
      );

      if (dateValidation.error) {
        return ApiResponse.badRequest(dateValidation.error).send(res);
      }

      updateData.startDate = dateValidation.startDate;
      updateData.endDate = dateValidation.endDate;
    }

    if (updateData.name) {
      const duplicateAcademicYear = await AcademicYear.findOne({
        _id: { $ne: req.params.id },
        name: updateData.name.trim(),
      });

      if (duplicateAcademicYear) {
        return ApiResponse.conflict(
          "Une annee academique avec ce nom existe deja"
        ).send(res);
      }

      updateData.name = updateData.name.trim();
    }

    if (updateData.description !== undefined) {
      updateData.description = updateData.description.trim();
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "isActive")) {
      updateData.isActive =
        String(updateData.isActive) === "true" || updateData.isActive === true;
    }

    const updatedAcademicYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (updatedAcademicYear?.isActive) {
      await deactivateOtherAcademicYears(updatedAcademicYear._id);
    }

    return ApiResponse.success(
      updatedAcademicYear,
      "Annee academique mise a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Academic Year Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const activateAcademicYearController = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);

    if (!academicYear) {
      return ApiResponse.notFound("Annee academique introuvable").send(res);
    }

    academicYear.isActive = true;
    academicYear.status = "active";
    await academicYear.save();
    await deactivateOtherAcademicYears(academicYear._id);

    return ApiResponse.success(
      academicYear,
      "Annee academique active mise a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Activate Academic Year Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteAcademicYearController = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      {
        ...buildArchiveUpdate(true, "Suppression logique depuis le module admin"),
        isActive: false,
      },
      { new: true }
    );

    if (!academicYear) {
      return ApiResponse.notFound("Annee academique introuvable").send(res);
    }

    return ApiResponse.success(
      academicYear,
      "Annee academique archivee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Delete Academic Year Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getAcademicYearsController,
  getActiveAcademicYearController,
  addAcademicYearController,
  updateAcademicYearController,
  activateAcademicYearController,
  deleteAcademicYearController,
};
