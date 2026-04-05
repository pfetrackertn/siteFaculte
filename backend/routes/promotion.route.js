const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const {
  getPromotionsController,
  addPromotionController,
  updatePromotionController,
  deletePromotionController,
} = require("../controllers/promotion.controller");

const router = express.Router();

router.get("/", auth, getPromotionsController);
router.post("/", auth, allowRoles("admin"), addPromotionController);
router.patch("/:id", auth, allowRoles("admin"), updatePromotionController);
router.delete("/:id", auth, allowRoles("admin"), deletePromotionController);

module.exports = router;
