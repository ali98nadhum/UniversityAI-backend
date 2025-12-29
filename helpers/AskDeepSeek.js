const axios = require("axios");

/**
 * Sends a message to DeepSeek AI with optional conversation history
 * @param {string} message - The current user message
 * @param {Array} conversationHistory - Array of previous messages in format [{role: "user"|"assistant", content: "..."}]
 * @returns {Promise<Object>} - Response object with from and answer fields
 */
async function askDeepSeek(message, conversationHistory = []) {
  try {
    // Build messages array with history + current message
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

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
