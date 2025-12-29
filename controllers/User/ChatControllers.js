
const { askQuestion } = require("../../helpers/semanticSearch");




// ==================================
// @desc Start new chat
// @route /api/v1/chat
// @method POST
// @access public ( for logged in users )
// ==================================
module.exports.startChat = async (req, res) => {
     const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const result = await askQuestion(message);
  res.json(result);
}

