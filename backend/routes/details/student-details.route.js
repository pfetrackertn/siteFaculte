const express = require("express");
const router = express.Router();
const {
  loginStudentController,
  getAllDetailsController,
  registerStudentController,
  updateDetailsController,
  deleteDetailsController,
  getMyDetailsController,
  sendForgetPasswordEmail,
  updatePasswordHandler,
  searchStudentsController,
  updateLoggedInPasswordController,
} = require("../../controllers/details/student-details.controller");
const upload = require("../../middlewares/multer.middleware");
const auth = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.post(
  "/register",
  auth,
  allowRoles("admin"),
  upload.single("file"),
  registerStudentController
);
router.post("/login", loginStudentController);
router.get("/my-details", auth, allowRoles("student"), getMyDetailsController);

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
  allowRoles("student"),
  updateLoggedInPasswordController
);
router.post("/search", auth, allowRoles("admin", "faculty"), searchStudentsController);

module.exports = router;
