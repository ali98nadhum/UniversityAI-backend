const express = require("express");
const path = require("path");
const passport = require("./config/passport");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const AdminRoutes = require("./Routes/AdminRoutes/adminAllRoutes");
// const AuthRoutes = require("./Routes/AuthRoutes/AuthAllRoutes");




// --------------------
// Middlewares
// --------------------
const app = express();
app.use(passport.initialize());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));



// 🔗  All Routes
app.use("/api/v1/admin", AdminRoutes);
// Google Auth Routes
app.use("/auth" , require("./Routes/AuthRoutes/googleAuth"));




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Chatboot AI Server running on http://localhost:${PORT}`);
});
