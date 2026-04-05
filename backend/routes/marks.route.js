const express = require("express");
const {
  getMarksController,
  addMarksController,
  deleteMarksController,
  addBulkMarksController,
  getStudentsWithMarksController,
  getStudentMarksController,
  getStudentAverageSummaryController,
  getAverageSummaryByStudentController,
} = require("../controllers/marks.controller");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const router = express.Router();

router.get("/", auth, allowRoles("admin", "faculty"), getMarksController);
router.get("/students", auth, allowRoles("admin", "faculty"), getStudentsWithMarksController);
router.get("/student", auth, allowRoles("student"), getStudentMarksController);
router.get(
  "/student/summary",
  auth,
  allowRoles("student"),
  getStudentAverageSummaryController
);
router.get(
  "/summary/:studentId",
  auth,
  allowRoles("admin", "faculty"),
  getAverageSummaryByStudentController
);
router.post("/", auth, allowRoles("admin", "faculty"), addMarksController);
router.post("/bulk", auth, allowRoles("admin", "faculty"), addBulkMarksController);
router.delete("/:id", auth, allowRoles("admin", "faculty"), deleteMarksController);

module.exports = router;
