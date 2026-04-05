const express = require("express");
const {
  getNoticeController,
  addNoticeController,
  updateNoticeController,
  deleteNoticeController,
} = require("../controllers/notice.controller");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const router = express.Router();

router.get("/", auth, getNoticeController);
router.post("/", auth, allowRoles("admin", "faculty"), addNoticeController);
router.put("/:id", auth, allowRoles("admin", "faculty"), updateNoticeController);
router.delete(
  "/:id",
  auth,
  allowRoles("admin", "faculty"),
  deleteNoticeController
);

module.exports = router;
