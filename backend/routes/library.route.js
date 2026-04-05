const express = require("express");
const auth = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");
const {
  attachResolvedUser,
  allowRoles,
} = require("../middlewares/role.middleware");
const {
  getLibraryItemsController,
  addLibraryItemController,
  updateLibraryItemController,
  deleteLibraryItemController,
} = require("../controllers/library.controller");

const router = express.Router();

router.get("/", auth, attachResolvedUser, getLibraryItemsController);
router.post(
  "/",
  auth,
  allowRoles("admin", "faculty"),
  upload.single("file"),
  addLibraryItemController
);
router.patch(
  "/:id",
  auth,
  allowRoles("admin", "faculty"),
  upload.single("file"),
  updateLibraryItemController
);
router.delete(
  "/:id",
  auth,
  allowRoles("admin", "faculty"),
  deleteLibraryItemController
);

module.exports = router;
