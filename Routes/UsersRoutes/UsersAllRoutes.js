const express = require("express");
const router = express.Router();

// Admin Routes
router.use("/chat", require("./AskRoutes"));


module.exports = router;
