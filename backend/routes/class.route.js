const express = require("express");
const auth = require("../middlewares/auth.middleware");
const {
  getClassesController,
  addClassController,
  updateClassController,
  deleteClassController,
} = require("../controllers/class.controller");

const router = express.Router();

router.get("/", auth, getClassesController);
router.post("/", auth, addClassController);
router.patch("/:id", auth, updateClassController);
router.delete("/:id", auth, deleteClassController);

module.exports = router;
