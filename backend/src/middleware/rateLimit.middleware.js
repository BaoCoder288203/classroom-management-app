const rateLimit = require("express-rate-limit");

const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Gửi mã quá nhiều. Thử lại sau 15 phút.",
  },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Thử mã quá nhiều. Thử lại sau 15 phút.",
  },
});

module.exports = { otpSendLimiter, otpVerifyLimiter };
