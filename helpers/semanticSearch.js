
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {getVector} = require("./embeddingService")
const { cos_sim } = require("@xenova/transformers");
const { askDeepSeek } = require("./AskDeepSeek");


async function askQuestion(message) {
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

  if (bestScore > 0.75 && bestMatch) {
    return { from: "university", answer: bestMatch.answer };
  }

  return await askDeepSeek(message);
}

module.exports = { askQuestion };