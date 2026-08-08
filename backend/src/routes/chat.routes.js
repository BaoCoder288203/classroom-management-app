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

// GIF picker: Giphy API hoặc bộ curated fallback
const FALLBACK_GIFS = [
  {
    id: "1",
    preview: "https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/200.gif",
    url: "https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif",
    title: "Thumbs up",
  },
  {
    id: "2",
    preview: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200.gif",
    url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    title: "Party",
  },
  {
    id: "3",
    preview: "https://media.giphy.com/media/26u4cqiYI30juCOGY/200.gif",
    url: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
    title: "Clap",
  },
  {
    id: "4",
    preview: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/200.gif",
    url: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    title: "Happy",
  },
  {
    id: "5",
    preview: "https://media.giphy.com/media/5GoVLqeAOo6PK/200.gif",
    url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
    title: "Excited",
  },
  {
    id: "6",
    preview: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/200.gif",
    url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
    title: "Wow",
  },
  {
    id: "7",
    preview: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/200.gif",
    url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    title: "Thank you",
  },
  {
    id: "8",
    preview: "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/200.gif",
    url: "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
    title: "Coffee",
  },
];

router.get("/gifs", verifyToken, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const apiKey = process.env.GIPHY_API_KEY;

    if (apiKey) {
      const endpoint = q
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=24&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=24&rating=g`;
      const response = await fetch(endpoint);
      const data = await response.json();
      const gifs = (data.data || []).map((g) => ({
        id: g.id,
        preview:
          g.images?.fixed_height_small?.url ||
          g.images?.fixed_height?.url ||
          "",
        url: g.images?.original?.url || g.images?.downsized?.url || "",
        title: g.title || "gif",
      })).filter((g) => g.url);

      return res.status(200).json({ success: true, gifs, source: "giphy" });
    }

    const lower = q.toLowerCase();
    const gifs = !q
      ? FALLBACK_GIFS
      : FALLBACK_GIFS.filter((g) =>
          g.title.toLowerCase().includes(lower)
        );

    return res.status(200).json({
      success: true,
      gifs,
      source: "fallback",
      message: "Set GIPHY_API_KEY on backend for full Giphy search",
    });
  } catch (error) {
    console.log("gifs error:", error);
    return res.status(200).json({
      success: true,
      gifs: FALLBACK_GIFS,
      source: "fallback",
    });
  }
});

module.exports = router;
