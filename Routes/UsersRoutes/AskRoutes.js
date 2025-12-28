const express = require("express");
const router = express.Router();
const { startChat } = require("../../controllers/User/ChatControllers");


router.post("/", startChat);

module.exports = router;
