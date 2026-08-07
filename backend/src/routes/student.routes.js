const express = require("express");
const router = express.Router();
const {
  loginEmail,
  validateAccessCode,
  setupAccount,
  getMyLessons,
  markLessonDone,
  getProfile,
  editProfile,
  getConversations,
} = require("../controllers/student.controller");
const {
  verifyToken,
  requireRole,
} = require("../middleware/auth.middleware");

router.post("/loginEmail", loginEmail);
router.post("/validateAccessCode", validateAccessCode);
router.post("/setupAccount", setupAccount);

router.get("/myLessons", verifyToken, requireRole("student"), getMyLessons);
router.get("/profile", verifyToken, requireRole("student"), getProfile);
router.get(
  "/conversations",
  verifyToken,
  requireRole("student"),
  getConversations
);
router.post(
  "/markLessonDone",
  verifyToken,
  requireRole("student"),
  markLessonDone
);
router.put("/editProfile", verifyToken, requireRole("student"), editProfile);

module.exports = router;
