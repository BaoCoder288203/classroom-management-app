const express = require("express");
const router = express.Router();
const {
  createAccessCode,
  instructorSignup,
  validateAccessCode,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const {
  otpSendLimiter,
  otpVerifyLimiter,
} = require("../middleware/rateLimit.middleware");

router.post("/createAccessCode", otpSendLimiter, createAccessCode);
router.post("/instructorSignup", otpSendLimiter, instructorSignup);
router.post("/validateAccessCode", otpVerifyLimiter, validateAccessCode);

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
