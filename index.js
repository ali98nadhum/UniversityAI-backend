const express = require("express");
const path = require("path");
require("dotenv").config();




// --------------------
// Middlewares
// --------------------
const app = express();
app.use(express.static(path.join(__dirname, "public")));




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Chatboot AI Server running on http://localhost:${PORT}`);
});
