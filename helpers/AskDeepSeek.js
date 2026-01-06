const axios = require("axios");

/**
 * Sends a message to DeepSeek AI with optional conversation history and user context
 * @param {string} message - The current user message
 * @param {Array} conversationHistory - Array of previous messages in format [{role: "user"|"assistant", content: "..."}]
 * @param {Object|null} userContext - Optional user context (for students): { role, name, department, stage }
 * @returns {Promise<Object>} - Response object with from and answer fields
 *
 * CHANGE: If the user is a STUDENT, we prepend a system prompt with their info
 * so the AI can respond in a more personalized, student-aware way.
 */
async function askDeepSeek(message, conversationHistory = [], userContext = null) {
  try {
    const messages = [];

    // CHANGE: Add system-level context depending on role
    if (userContext && userContext.role === "STUDENT") {
      messages.push({
        role: "system",
        content:
          `You are a helpful university assistant. The current user is a STUDENT.\n` +
          `Student info:\n` +
          `- Name: ${userContext.name || "Unknown"}\n` +
          `- Department: ${userContext.department || "Unknown"}\n` +
          `- Stage: ${userContext.stage || "Unknown"}\n` +
          `Always answer in a friendly and supportive way, and when relevant, ` +
          `adapt your answer to their department and stage.`,
      });
    } else {
      // Guest / generic context
      messages.push({
        role: "system",
        content:
          "You are a helpful university assistant. The user is a GUEST. " +
          "Provide general information about the university, its services, " +
          "and study-related topics. Do not assume any specific department or level.",
      });
    }

    // Build messages array with history + current message
    messages.push(
      ...conversationHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: message }
    );

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1",
        messages: messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://yourwebsite.com",
          "X-Title": "University AI",
          "Content-Type": "application/json",
        },
      }
    );

    return {
      from: "ai",
      answer:
        response.data?.choices?.[0]?.message?.content ||
        "عذراً، لم أستطع توليد إجابة حالياً.",
    };
  } catch (err) {
    console.error("DeepSeek API Error:", err.message);
    return { from: "error", answer: "حدث خطأ في الاتصال بالذكاء الاصطناعي." };
  }
}

module.exports = { askDeepSeek };
