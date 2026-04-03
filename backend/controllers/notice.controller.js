const Notice = require("../models/notice.model");
const ApiResponse = require("../utils/ApiResponse");

const getNoticeController = async (req, res) => {
  try {
    const notices = await Notice.find();
    if (!notices || notices.length === 0) {
      return ApiResponse.error("Aucune annonce trouvee", 404).send(res);
    }
    return ApiResponse.success(notices, "Annonces chargees avec succes").send(
      res
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const addNoticeController = async (req, res) => {
  const { title, description, type, link } = req.body;

  if (!title || !description || !type) {
    return ApiResponse.error("Tous les champs sont obligatoires", 400).send(
      res
    );
  }

  try {
    const notice = await Notice.create({
      title,
      type,
      description,
      link,
    });

    return ApiResponse.created(notice, "Annonce ajoutee avec succes").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const updateNoticeController = async (req, res) => {
  const { title, description, type, link } = req.body;
  const updateFields = {};

  if (title) updateFields.title = title;
  if (description) updateFields.description = description;
  if (type) updateFields.type = type;
  if (link) updateFields.link = link;

  if (Object.keys(updateFields).length === 0) {
    return ApiResponse.error(
      "Aucun champ n'a ete fourni pour la mise a jour",
      400
    ).send(res);
  }

  try {
    let notice = await Notice.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    if (!notice) {
      return ApiResponse.error("Annonce introuvable", 404).send(res);
    }

    return ApiResponse.success(notice, "Annonce mise a jour avec succes").send(
      res
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const deleteNoticeController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.error("L'identifiant de l'annonce est requis", 400)
        .send(res);
    }

    let notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return ApiResponse.error("Annonce introuvable", 404).send(res);
    }
    return ApiResponse.success(null, "Annonce supprimee avec succes").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

module.exports = {
  getNoticeController,
  addNoticeController,
  updateNoticeController,
  deleteNoticeController,
};
