const express = require("express");
const {
  getSubjectController,
  addSubjectController,
  deleteSubjectController,
  updateSubjectController,
} = require("../controllers/subject.controller");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
router.get("/", auth, getSubjectController);
router.post("/", auth, allowRoles("admin"), addSubjectController);
router.delete("/:id", auth, allowRoles("admin"), deleteSubjectController);
router.patch("/:id", auth, allowRoles("admin"), updateSubjectController);
router.put("/:id", auth, allowRoles("admin"), updateSubjectController);

module.exports = router;
