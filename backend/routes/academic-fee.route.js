const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const {
  getAcademicFeesController,
  addAcademicFeeController,
  updateAcademicFeeController,
  deleteAcademicFeeController,
  getStudentAcademicFeesController,
} = require("../controllers/academic-fee.controller");

const router = express.Router();

router.get("/", auth, allowRoles("admin"), getAcademicFeesController);
router.get("/student", auth, allowRoles("student"), getStudentAcademicFeesController);
router.post("/", auth, allowRoles("admin"), addAcademicFeeController);
router.patch("/:id", auth, allowRoles("admin"), updateAcademicFeeController);
router.delete("/:id", auth, allowRoles("admin"), deleteAcademicFeeController);

module.exports = router;
