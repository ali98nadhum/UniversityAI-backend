const { PrismaClient } = require("@prisma/client");
const { askQuestion } = require("../../helpers/semanticSearch");

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
// @desc Send a message (create new conversation or continue existing)
// @route /api/v1/client/chat
// @method POST
// @access private (logged in users)
// ==================================
module.exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { message, conversationId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

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
          title: message.substring(0, 50) || `Chat ${new Date().toLocaleDateString()}`,
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

    // Get AI response with context
    const aiResponse = await askQuestion(message, conversationHistory);

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

    res.json({
      success: true,
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

