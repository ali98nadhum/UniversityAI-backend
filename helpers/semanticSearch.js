
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {getVector} = require("./embeddingService")
const { cos_sim } = require("@xenova/transformers");
const { askDeepSeek } = require("./AskDeepSeek");


/**
 * Processes a question with optional conversation history
 * @param {string} message - The current user message
 * @param {Array} conversationHistory - Array of previous messages in format [{role: "user"|"assistant", content: "..."}]
 * @returns {Promise<Object>} - Response object with from and answer fields
 */
async function askQuestion(message, conversationHistory = []) {
  const userVector = await getVector(message);

  const allFaq = await prisma.fAQ.findMany();

  let bestMatch = null;
  let bestScore = 0;

  for (const faq of allFaq) {
    if (!faq.embedding || faq.embedding.length === 0) continue;

    const score = cos_sim(userVector, faq.embedding);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  console.log(`🔍 Similarity Score: ${bestScore.toFixed(4)}`);

  if (bestScore > 0.80 && bestMatch) {
    return { from: "university", answer: bestMatch.answer };
  }

  return await askDeepSeek(message, conversationHistory);
}

module.exports = { askQuestion };