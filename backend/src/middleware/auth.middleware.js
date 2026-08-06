const { verifyJWT } = require("../services/jwt.service");

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc thiếu",
      });
    }

    const token = authHeader.slice(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc thiếu",
      });
    }

    const decoded = verifyJWT(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền",
      });
    }

    next();
  };
}

module.exports = { verifyToken, requireRole };
