const { PrismaClient } = require("@prisma/client");
const { askQuestion } = require("../../helpers/semanticSearch");
// CHANGE: Import rate limiter for guest users
const { incrementGuestUsage } = require("../../Utils/rateLimiter");

const prisma = new PrismaClient();

// ==================================
// @desc Create a new conversation
// @route /api/v1/client/chat/conversations
// @method POST
// @access private (logged in users)
// ==================================
module.exports.createConversation = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { title } = req.body;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || `Chat ${new Date().toLocaleDateString()}`,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
};

// ==================================
// @desc Get all conversations for a user
// @route /api/v1/client/chat/conversations
// @method GET
// @access private (logged in users)
// ==================================
module.exports.getConversations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get only the last message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// ==================================
// @desc Get messages for a specific conversation
// @route /api/v1/client/chat/conversations/:conversationId/messages
// @method GET
// @access private (logged in users)
// ==================================
module.exports.getConversationMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(conversationId),
        userId,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(conversationId) },
      orderBy: { createdAt: "asc" },
    });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// ==================================
// @desc Send a message (role-aware)
// @route /api/v1/client/chat
// @method POST
// @access private (logged in users: STUDENT or GUEST)
// ==================================
module.exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { message, conversationId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // CHANGE: Build userContext for personalized AI responses (students only)
    const userContext =
      role === "STUDENT"
        ? {
            role,
            name: req.user.name || null,
            department: req.user.department || null,
            stage: req.user.stage || null,
          }
        : {
            role: "GUEST",
          };

    // ==================================
    // Branch 1: STUDENT → persistent chat history
    // ==================================
    if (role === "STUDENT") {
      let conversation;

      // If conversationId is provided, verify it belongs to the user
      if (conversationId) {
        conversation = await prisma.conversation.findFirst({
          where: {
            id: parseInt(conversationId),
            userId,
          },
        });

        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }
      } else {
        // Create a new conversation if none provided
        conversation = await prisma.conversation.create({
          data: {
            userId,
            title:
              message.substring(0, 50) ||
              `Chat ${new Date().toLocaleDateString()}`,
          },
        });
      }

      // Save user message
      const userMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: message,
        },
      });

      // Get conversation history for context
      const previousMessages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
        take: -50, // Limit to last 50 messages for context
      });

      // Format history for AI (exclude current message)
      const conversationHistory = previousMessages
        .filter((msg) => msg.id !== userMessage.id)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Get AI response with context + student info
      const aiResponse = await askQuestion(
        message,
        conversationHistory,
        userContext
      );

      // Save AI response
      const aiMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: aiResponse.answer,
        },
      });

      // Update conversation's updatedAt timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return res.json({
        success: true,
        role,
        conversation: {
          id: conversation.id,
          title: conversation.title,
        },
        userMessage: {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt,
        },
        aiMessage: {
          id: aiMessage.id,
          role: aiMessage.role,
          content: aiMessage.content,
          from: aiResponse.from,
          createdAt: aiMessage.createdAt,
        },
        // CHANGE: Students have unlimited access
        rateLimit: {
          remaining: null,
          limit: null,
          used: null,
          unlimited: true,
        },
      });
    }

    // ==================================
    // Branch 2: GUEST → no chat history, general context only
    // ==================================
    // Guests do not have stored history; we only pass the current message.
    // CHANGE: Rate limiting is handled by middleware, but we track usage after successful request
    const aiResponse = await askQuestion(message, [], userContext);

    // CHANGE: Increment guest usage counter after successful AI response
    await incrementGuestUsage(userId);

    // Get remaining questions for response
    const { checkGuestLimit } = require("../../Utils/rateLimiter");
    const limitInfo = await checkGuestLimit(userId);

    return res.json({
      success: true,
      role,
      conversation: null,
      userMessage: {
        role: "user",
        content: message,
      },
      aiMessage: {
        role: "assistant",
        content: aiResponse.answer,
        from: aiResponse.from,
      },
      // CHANGE: Include rate limit info in response for frontend
      rateLimit: {
        remaining: limitInfo.remaining,
        limit: limitInfo.limit,
        used: limitInfo.used,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// ==================================
// @desc Delete a conversation
// @route /api/v1/client/chat/conversations/:conversationId
// @method DELETE
// @access private (logged in users)
// ==================================
module.exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: parseInt(conversationId),
        userId,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Delete conversation (messages will be cascade deleted)
    await prisma.conversation.delete({
      where: { id: parseInt(conversationId) },
    });

    res.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
};

