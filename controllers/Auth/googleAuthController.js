const jwt = require("jsonwebtoken");

exports.googleCallback = (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const redirectUrl =
    `${process.env.FRONTEND_URL}/auth/google/callback` +
    `?token=${token}` +
    `&user=${encodeURIComponent(JSON.stringify(req.user))}`;

  res.redirect(redirectUrl);
};
