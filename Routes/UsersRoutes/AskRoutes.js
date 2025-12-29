const express = require("express");
const router = express.Router();
const {
  sendMessage,
  createConversation,
  getConversations,
  getConversationMessages,
  deleteConversation,
} = require("../../controllers/User/ChatControllers");
const { authenticateToken } = require("../../Utils/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Send a message (creates new conversation if no conversationId provided)
router.post("/", sendMessage);

// Conversation management routes
router.post("/conversations", createConversation);
router.get("/conversations", getConversations);
router.get("/conversations/:conversationId/messages", getConversationMessages);
router.delete("/conversations/:conversationId", deleteConversation);

module.exports = router;
