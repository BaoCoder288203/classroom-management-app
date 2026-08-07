const express = require("express");
const router = express.Router();
const { addStudent } = require("../controllers/instructor.controller");
const {
  verifyToken,
  requireRole,
} = require("../middleware/auth.middleware");

router.post(
  "/addStudent",
  verifyToken,
  requireRole("instructor"),
  addStudent
);

module.exports = router;
