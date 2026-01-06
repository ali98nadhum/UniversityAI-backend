const express = require("express");
const router = express.Router();

// CHANGE: Student auth (registration & login)
const {
  registerStudent,
  loginStudent,
} = require("../../controllers/Auth/AuthControllers");

// CHANGE: Google OAuth for guests
const googleAuthRoutes = require("./googleAuth");

// Student auth routes
router.post("/student/register", registerStudent);
router.post("/student/login", loginStudent);

// Google OAuth routes (guests)
router.use("/", googleAuthRoutes);

module.exports = router;
