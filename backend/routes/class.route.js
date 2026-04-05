const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const {
  getClassesController,
  addClassController,
  updateClassController,
  deleteClassController,
} = require("../controllers/class.controller");

const router = express.Router();

router.get("/", auth, getClassesController);
router.post("/", auth, allowRoles("admin"), addClassController);
router.patch("/:id", auth, allowRoles("admin"), updateClassController);
router.delete("/:id", auth, allowRoles("admin"), deleteClassController);

module.exports = router;
