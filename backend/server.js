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

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/instructor", instructorRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

initChatSocket(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
