const express = require("express");
const router = express.Router();
const {
  loginEmail,
  validateAccessCode,
  setupAccount,
} = require("../controllers/student.controller");

router.post("/loginEmail", loginEmail);
router.post("/validateAccessCode", validateAccessCode);
router.post("/setupAccount", setupAccount);

module.exports = router;
