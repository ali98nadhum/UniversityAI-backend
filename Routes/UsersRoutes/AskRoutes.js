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
// CHANGE: Add rate limiting middleware for guest users
const { guestRateLimitMiddleware } = require("../../Utils/rateLimiter");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// CHANGE: Apply rate limiting only to the send message endpoint (guests only)
// Students have unlimited access, so middleware will skip them
router.post("/", guestRateLimitMiddleware, sendMessage);

// Conversation management routes
router.post("/conversations", createConversation);
router.get("/conversations", getConversations);
router.get("/conversations/:conversationId/messages", getConversationMessages);
router.delete("/conversations/:conversationId", deleteConversation);

module.exports = router;
