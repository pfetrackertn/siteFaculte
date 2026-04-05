const express = require("express");
const {
  getAllExamsController,
  addExamController,
  updateExamController,
  deleteExamController,
} = require("../controllers/exam.controller");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");

router.get("/", auth, getAllExamsController);
router.post(
  "/",
  auth,
  allowRoles("admin", "faculty"),
  upload.single("file"),
  addExamController
);
router.patch(
  "/:id",
  auth,
  allowRoles("admin", "faculty"),
  upload.single("file"),
  updateExamController
);
router.delete("/:id", auth, allowRoles("admin", "faculty"), deleteExamController);

module.exports = router;
