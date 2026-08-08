const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");

const uploadDir = path.join(__dirname, "../../uploads/chat");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = String(file.originalname || "file")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /^image\//.test(file.mimetype) ||
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "text/plain";
    if (!ok) {
      return cb(new Error("Loại file không được hỗ trợ"));
    }
    cb(null, true);
  },
});

router.post("/upload", verifyToken, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Upload thất bại",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Thiếu file",
      });
    }

    const base =
      process.env.API_PUBLIC_URL ||
      `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${base.replace(/\/$/, "")}/uploads/chat/${req.file.filename}`;
    const isImage = /^image\//.test(req.file.mimetype);
    const isGif =
      req.file.mimetype === "image/gif" ||
      /\.gif$/i.test(req.file.originalname || "");

    return res.status(200).json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      type: isGif ? "gif" : isImage ? "image" : "file",
    });
  });
});

module.exports = router;
