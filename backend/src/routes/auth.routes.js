const express = require("express");
const router = express.Router();
const {
  createAccessCode,
  validateAccessCode,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.post("/createAccessCode", createAccessCode);
router.post("/validateAccessCode", validateAccessCode);

// test middleware: can Bearer token
router.get("/me", verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      phone: req.user.phone,
      role: req.user.role,
    },
  });
});

module.exports = router;
