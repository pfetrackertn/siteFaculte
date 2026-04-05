const express = require("express");
const router = express.Router();
const {
  getAllDetailsController,
  registerAdminController,
  updateDetailsController,
  deleteDetailsController,
  loginAdminController,
  getMyDetailsController,
  sendForgetPasswordEmail,
  updatePasswordHandler,
  updateLoggedInPasswordController,
} = require("../../controllers/details/admin-details.controller");
const upload = require("../../middlewares/multer.middleware");
const auth = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.post(
  "/register",
  auth,
  allowRoles("admin"),
  upload.single("file"),
  registerAdminController
);
router.post("/login", loginAdminController);
router.get("/my-details", auth, allowRoles("admin"), getMyDetailsController);

router.get("/", auth, allowRoles("admin"), getAllDetailsController);
router.patch(
  "/:id",
  auth,
  allowRoles("admin"),
  upload.single("file"),
  updateDetailsController
);
router.delete("/:id", auth, allowRoles("admin"), deleteDetailsController);
router.post("/forget-password", sendForgetPasswordEmail);
router.post("/update-password/:resetId", updatePasswordHandler);
router.post(
  "/change-password",
  auth,
  allowRoles("admin"),
  updateLoggedInPasswordController
);

module.exports = router;
