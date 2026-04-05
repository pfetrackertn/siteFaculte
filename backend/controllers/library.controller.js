const LibraryItem = require("../models/library-item.model");
const ApiResponse = require("../utils/ApiResponse");
const { buildArchiveUpdate, getArchiveFilter } = require("../utils/archive");

const getVisibleLibraryRoles = (role) => {
  switch (role) {
    case "student":
      return ["all", "student"];
    case "faculty":
      return ["all", "faculty"];
    case "admin":
      return ["all", "admin", "faculty", "student"];
    default:
      return ["all"];
  }
};

const getLibraryItemsController = async (req, res) => {
  try {
    const { search = "", category = "", visibility = "", status = "" } =
      req.query;
    const query = {
      ...getArchiveFilter(req.query),
    };

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
      ];
    }

    if (req.userRole !== "admin") {
      query.visibility = { $in: getVisibleLibraryRoles(req.userRole) };
    } else if (visibility) {
      query.visibility = visibility;
    }

    const libraryItems = await LibraryItem.find(query).sort({
      createdAt: -1,
    });

    if (!libraryItems.length) {
      return ApiResponse.notFound("Aucun document de la bibliotheque trouve")
        .send(res);
    }

    return ApiResponse.success(
      libraryItems,
      "Bibliotheque chargee avec succes"
    ).send(res);
  } catch (error) {
    console.error("Get Library Items Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addLibraryItemController = async (req, res) => {
  try {
    const {
      title,
      description = "",
      category,
      authorName,
      visibility = "all",
      status = "active",
    } = req.body;

    if (!title || !category || !authorName) {
      return ApiResponse.badRequest(
        "Le titre, la categorie et l'auteur sont requis"
      ).send(res);
    }

    if (!req.file) {
      return ApiResponse.badRequest("Le fichier du document est requis").send(
        res
      );
    }

    const libraryItem = await LibraryItem.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      authorName: authorName.trim(),
      visibility,
      status,
      file: req.file.filename,
      uploadedBy: req.userId,
      uploadedByRole: req.userRole,
    });

    return ApiResponse.created(
      libraryItem,
      "Document ajoute a la bibliotheque avec succes"
    ).send(res);
  } catch (error) {
    console.error("Add Library Item Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateLibraryItemController = async (req, res) => {
  try {
    const libraryItem = await LibraryItem.findById(req.params.id);

    if (!libraryItem) {
      return ApiResponse.notFound("Document introuvable").send(res);
    }

    const updateData = { ...req.body };
    ["title", "description", "category", "authorName"].forEach((field) => {
      if (updateData[field] !== undefined) {
        updateData[field] = updateData[field].trim();
      }
    });

    if (req.file) {
      updateData.file = req.file.filename;
    }

    const updatedLibraryItem = await LibraryItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    return ApiResponse.success(
      updatedLibraryItem,
      "Document mis a jour avec succes"
    ).send(res);
  } catch (error) {
    console.error("Update Library Item Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteLibraryItemController = async (req, res) => {
  try {
    const libraryItem = await LibraryItem.findByIdAndUpdate(
      req.params.id,
      buildArchiveUpdate(true, "Suppression logique depuis le module library"),
      { new: true }
    );

    if (!libraryItem) {
      return ApiResponse.notFound("Document introuvable").send(res);
    }

    return ApiResponse.success(
      libraryItem,
      "Document archive avec succes"
    ).send(res);
  } catch (error) {
    console.error("Delete Library Item Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getLibraryItemsController,
  addLibraryItemController,
  updateLibraryItemController,
  deleteLibraryItemController,
};
