const multer = require("multer");
const path = require("path");
const fs = require("fs");

// CHANGE: Configure multer for avatar uploads
const AVATAR_UPLOAD_DIR = path.join(__dirname, "../uploads/avatars");

// Ensure upload directory exists
if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
  fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, AVATAR_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId_timestamp.extension
    const userId = req.user?.id || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

module.exports = upload;

