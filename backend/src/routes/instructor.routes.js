const express = require("express");
const router = express.Router();
const {
  addStudent,
  getStudents,
  getStudentByPhone,
  editStudent,
  deleteStudent,
  assignLesson,
  getLessons,
} = require("../controllers/instructor.controller");
const {
  verifyToken,
  requireRole,
} = require("../middleware/auth.middleware");

// tat ca route instructor can JWT + role instructor
router.use(verifyToken, requireRole("instructor"));

router.post("/addStudent", addStudent);
router.get("/students", getStudents);
router.get("/lessons", getLessons);
router.get("/student/:phone", getStudentByPhone);
router.put("/editStudent/:phone", editStudent);
router.delete("/student/:phone", deleteStudent);
router.post("/assignLesson", assignLesson);

module.exports = router;
