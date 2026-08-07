const jwt = require("jsonwebtoken");
require("dotenv").config();

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function generateSetupToken(email) {
  return jwt.sign(
    { email, purpose: "setup" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}

function verifySetupToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== "setup" || !decoded.email) {
    throw new Error("Invalid setup token");
  }
  return decoded;
}

module.exports = {
  generateToken,
  verifyJWT,
  generateSetupToken,
  verifySetupToken,
};
