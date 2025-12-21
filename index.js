const express = require("express");
const path = require("path");
const passport = require("./config/passport");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();




// --------------------
// Middlewares
// --------------------
const app = express();
app.use(passport.initialize());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Chatboot AI Server running on http://localhost:${PORT}`);
});
