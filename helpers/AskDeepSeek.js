const axios = require("axios");

async function askDeepSeek(message) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1",
        messages: [{ role: "user", content: message }],
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
