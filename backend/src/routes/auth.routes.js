const express = require("express");
const router = express.Router();
const { createAccessCode } = require("../controllers/auth.controller");

router.post("/createAccessCode", createAccessCode);

module.exports = router;
