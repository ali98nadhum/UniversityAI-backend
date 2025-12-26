const jwt = require("jsonwebtoken");

exports.googleCallback = (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login successful",
    token,
    user: req.user,
  });
};
