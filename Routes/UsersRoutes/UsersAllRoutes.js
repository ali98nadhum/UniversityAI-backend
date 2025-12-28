const express = require("express");
const router = express.Router();

// Admin Routes
router.use("/", require("./AskRoutes"));


module.exports = router;
