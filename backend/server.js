const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/auth.routes");
const studentRoutes = require("./src/routes/student.routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
