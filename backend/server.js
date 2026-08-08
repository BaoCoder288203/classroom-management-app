const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./src/routes/auth.routes");
const studentRoutes = require("./src/routes/student.routes");
const instructorRoutes = require("./src/routes/instructor.routes");
const initChatSocket = require("./src/socket/chat.socket");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: frontendOrigin,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: frontendOrigin,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/chat", require("./src/routes/chat.routes"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

initChatSocket(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
