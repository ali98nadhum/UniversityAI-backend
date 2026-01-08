const express = require("express");
const router = express.Router();

// CHANGE: User routes
router.use("/chat", require("./AskRoutes"));
// CHANGE: Profile management routes (avatar, update info, delete account)
router.use("/profile", require("./ProfileRoutes"));

module.exports = router;
