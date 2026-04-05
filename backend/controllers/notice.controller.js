const Notice = require("../models/notice.model");
const ApiResponse = require("../utils/ApiResponse");
const { getArchiveFilter, buildArchiveUpdate } = require("../utils/archive");
const { resolveAcademicYearId } = require("../utils/academic-year");

const populateNotice = (query) =>
  query.populate("academicYearId", "name isActive");

const getNoticeController = async (req, res) => {
  try {
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.academicYearId) {
      query.academicYearId = req.query.academicYearId;
    }

    const notices = await populateNotice(Notice.find(query).sort({ createdAt: -1 }));

    if (!notices.length) {
      return ApiResponse.notFound("Aucune annonce trouvee").send(res);
    }

    return ApiResponse.success(notices, "Annonces chargees avec succes").send(
      res
    );
  } catch (error) {
    console.error("Get Notice Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addNoticeController = async (req, res) => {
  try {
    const { title, description, type, link = "", status = "active" } = req.body;

    if (!title || !description || !type) {
      return ApiResponse.badRequest("Tous les champs sont obligatoires").send(
        res
      );
    }

    const academicYearId = await resolveAcademicYearId(req.body.academicYearId);

    const notice = await Notice.create({
      title: title.trim(),
      type,
      description: description.trim(),
      link: link.trim(),
      status,
      academicYearId,
    });

    return ApiResponse.created(notice, "Annonce ajoutee avec succes").send(res);
  } catch (error) {
    console.error("Add Notice Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateNoticeController = async (req, res) => {
  try {
    const updateFields = { ...req.body };

    ["title", "description", "link"].forEach((field) => {
      if (updateFields[field] !== undefined) {
        updateFields[field] = updateFields[field].trim();
      }
    });

    if (Object.prototype.hasOwnProperty.call(updateFields, "academicYearId")) {
      updateFields.academicYearId = await resolveAcademicYearId(
        updateFields.academicYearId
      );
    }

    const notice = await populateNotice(
      Notice.findByIdAndUpdate(req.params.id, updateFields, { new: true })
    );

    if (!notice) {
      return ApiResponse.notFound("Annonce introuvable").send(res);
    }

    return ApiResponse.success(notice, "Annonce mise a jour avec succes").send(
      res
    );
  } catch (error) {
    console.error("Update Notice Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteNoticeController = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module annonce"),
      { new: true }
    );

    if (!notice) {
      return ApiResponse.notFound("Annonce introuvable").send(res);
    }

    return ApiResponse.success(notice, "Annonce archivee avec succes").send(
      res
    );
  } catch (error) {
    console.error("Delete Notice Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getNoticeController,
  addNoticeController,
  updateNoticeController,
  deleteNoticeController,
};
