const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadAvatar,
  updateStudentProfile,
  deleteAccount,
  getProfile,
} = require("../../controllers/User/ProfileControllers");
const { authenticateToken } = require("../../Utils/authMiddleware");
const upload = require("../../Utils/multerConfig");

// CHANGE: All profile routes require authentication
router.use(authenticateToken);

// Get current user profile
router.get("/", getProfile);

// CHANGE: Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "Maximum file size is 5MB",
      });
    }
    return res.status(400).json({
      error: "File upload error",
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      error: "Upload error",
      message: err.message,
    });
  }
  next();
};

// Upload/Update avatar (single file upload with field name 'avatar')
router.put(
  "/avatar",
  upload.single("avatar"),
  handleMulterError,
  uploadAvatar
);

// Update student profile information (STUDENT only)
router.put("/", updateStudentProfile);

// Delete user account
router.delete("/", deleteAccount);

module.exports = router;

