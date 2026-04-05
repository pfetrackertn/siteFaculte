const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const {
  getBranchController,
  addBranchController,
  updateBranchController,
  deleteBranchController,
} = require("../controllers/branch.controller");

router.get("/", auth, getBranchController);
router.post("/", auth, allowRoles("admin"), addBranchController);
router.patch("/:id", auth, allowRoles("admin"), updateBranchController);
router.delete("/:id", auth, allowRoles("admin"), deleteBranchController);

module.exports = router;
