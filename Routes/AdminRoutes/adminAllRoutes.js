const express = require("express");
const router = express.Router();

// Admin Routes
router.use("/faq", require("./faqRoutes"));


module.exports = router;
app.use("/api/v1/admin", AdminRoutes);
