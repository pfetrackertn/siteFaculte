const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const {
  getMaterialsController,
  addMaterialController,
  updateMaterialController,
  deleteMaterialController,
} = require("../controllers/material.controller");

router.get("/", auth, getMaterialsController);
router.post(
  "/",
  auth,
  allowRoles("faculty"),
  upload.single("file"),
  addMaterialController
);
router.put(
  "/:id",
  auth,
  allowRoles("faculty"),
  upload.single("file"),
  updateMaterialController
);
router.delete("/:id", auth, allowRoles("faculty"), deleteMaterialController);

module.exports = router;
