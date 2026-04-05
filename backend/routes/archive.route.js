const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const {
  getArchiveOverviewController,
  restoreArchivedResourceController,
} = require("../controllers/archive.controller");

const router = express.Router();

router.get("/overview", auth, allowRoles("admin"), getArchiveOverviewController);
router.patch(
  "/:resource/:id/restore",
  auth,
  allowRoles("admin"),
  restoreArchivedResourceController
);

module.exports = router;
