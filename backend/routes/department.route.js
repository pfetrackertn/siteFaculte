const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const {
  getDepartmentsController,
  addDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
} = require("../controllers/department.controller");

const router = express.Router();

router.get("/", auth, getDepartmentsController);
router.post("/", auth, allowRoles("admin"), addDepartmentController);
router.patch("/:id", auth, allowRoles("admin"), updateDepartmentController);
router.delete("/:id", auth, allowRoles("admin"), deleteDepartmentController);

module.exports = router;
