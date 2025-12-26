const express = require("express");
const passport = require("passport");
const { googleCallback } = require("../../controllers/Auth/googleAuthController");

const router = express.Router();

// Google Auth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleCallback
);

module.exports = router;
