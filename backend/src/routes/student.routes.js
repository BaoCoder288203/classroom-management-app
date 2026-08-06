const express = require("express");
const router = express.Router();
const {
  loginEmail,
  validateAccessCode,
} = require("../controllers/student.controller");

router.post("/loginEmail", loginEmail);
router.post("/validateAccessCode", validateAccessCode);

module.exports = router;
