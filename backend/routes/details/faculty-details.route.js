const express = require("express");
const router = express.Router();
const {
  loginFacultyController,
  registerFacultyController,
  updateFacultyController,
  deleteFacultyController,
  getAllFacultyController,
  getMyFacultyDetailsController,
  sendFacultyResetPasswordEmail,
  updateFacultyPasswordHandler,
  updateLoggedInPasswordController,
} = require("../../controllers/details/faculty-details.controller");
const upload = require("../../middlewares/multer.middleware");
const auth = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.post(
  "/register",
  auth,
  allowRoles("admin"),
  upload.single("file"),
  registerFacultyController
);
router.post("/login", loginFacultyController);
router.get("/my-details", auth, allowRoles("faculty"), getMyFacultyDetailsController);

router.get("/", auth, allowRoles("admin"), getAllFacultyController);
router.patch(
  "/:id",
  auth,
  allowRoles("admin"),
  upload.single("file"),
  updateFacultyController
);
router.delete("/:id", auth, allowRoles("admin"), deleteFacultyController);
router.post("/forget-password", sendFacultyResetPasswordEmail);
router.post("/update-password/:resetId", updateFacultyPasswordHandler);
router.post(
  "/change-password",
  auth,
  allowRoles("faculty"),
  updateLoggedInPasswordController
);

module.exports = router;
