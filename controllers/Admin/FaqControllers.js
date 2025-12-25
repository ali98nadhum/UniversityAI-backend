const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getVector } = require("../../helpers/embeddingService");





// ==================================
// @desc Create new Faq
// @route /api/v1/faq
// @method POST
// @access private ( just admin )
// ==================================
module.exports.createFaq = async (req, res) => {
  try {
    const { question, answer, keywords } = req.body;
    const vector = await getVector(question);
    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        keywords: keywords || [],
        embedding: vector,
      },
    });

    res.json({ message: "Success", id: faq.id });
  } catch (error) {
    console.error(err);
    res.status(500).json({ error: "Failed to save FAQ" });
  }
};