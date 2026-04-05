const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const {
  getAcademicYearsController,
  getActiveAcademicYearController,
  addAcademicYearController,
  updateAcademicYearController,
  activateAcademicYearController,
  deleteAcademicYearController,
} = require("../controllers/academic-year.controller");

const router = express.Router();

router.get("/", auth, getAcademicYearsController);
router.get("/active", auth, getActiveAcademicYearController);
router.post("/", auth, allowRoles("admin"), addAcademicYearController);
router.patch("/:id", auth, allowRoles("admin"), updateAcademicYearController);
router.patch(
  "/:id/activate",
  auth,
  allowRoles("admin"),
  activateAcademicYearController
);
router.delete("/:id", auth, allowRoles("admin"), deleteAcademicYearController);

module.exports = router;
