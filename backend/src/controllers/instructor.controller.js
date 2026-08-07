const { db } = require("../config/firebase");
const { sendEmail } = require("../services/email.service");
const { generateSetupToken } = require("../services/jwt.service");

function isValidEmail(email) {
  if (!email || String(email).trim() === "") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function sanitizeStudent(id, data) {
  const {
    passwordHash,
    accessCode,
    accessCodeExpiry,
    ...rest
  } = data || {};
  return { id, ...rest };
}

async function findStudentByPhone(phone) {
  const snapshot = await db
    .collection("students")
    .where("phone", "==", normalizePhone(phone))
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0];
}

async function addStudent(req, res) {
  try {
    const { name, phone, email } = req.body;

    if (!name || String(name).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Tên không được để trống",
      });
    }

    if (!phone || normalizePhone(phone) === "") {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không được để trống",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const phoneNorm = normalizePhone(phone);
    const studentsRef = db.collection("students");

    const existingEmail = await studentsRef
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingEmail.empty) {
      return res.status(409).json({
        success: false,
        message: "Email đã tồn tại",
      });
    }

    const existingPhone = await studentsRef
      .where("phone", "==", phoneNorm)
      .limit(1)
      .get();

    if (!existingPhone.empty) {
      return res.status(409).json({
        success: false,
        message: "Số điện thoại đã tồn tại",
      });
    }

    const setupToken = generateSetupToken(normalizedEmail);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const setupLink = `${frontendUrl}/setup-account?token=${setupToken}`;

    const docRef = await studentsRef.add({
      name: String(name).trim(),
      phone: phoneNorm,
      email: normalizedEmail,
      role: "student",
      isAccountSetup: false,
      passwordHash: null,
      username: null,
      accessCode: "",
      createdAt: new Date(),
    });

    await sendEmail(
      normalizedEmail,
      "Thiết lập tài khoản Classroom App",
      `<p>Xin chào <b>${String(name).trim()}</b>,</p>
       <p>Bạn đã được thêm vào Classroom App. Nhấn link sau để tạo mật khẩu (hạn 24 giờ):</p>
       <p><a href="${setupLink}">Thiết lập tài khoản</a></p>
       <p>Hoặc copy link: ${setupLink}</p>`
    );

    return res.status(201).json({
      success: true,
      message: "Đã thêm học viên và gửi email thiết lập",
      studentId: docRef.id,
    });
  } catch (error) {
    console.log("addStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function getStudents(req, res) {
  try {
    const snapshot = await db.collection("students").get();
    const students = snapshot.docs.map((doc) =>
      sanitizeStudent(doc.id, doc.data())
    );

    return res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    console.log("getStudents error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function getStudentByPhone(req, res) {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    const studentDoc = await findStudentByPhone(phone);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    const lessonsSnap = await db
      .collection("lessons")
      .where("assignedTo", "==", phone)
      .get();

    const lessons = lessonsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      student: sanitizeStudent(studentDoc.id, studentDoc.data()),
      lessons,
    });
  } catch (error) {
    console.log("getStudentByPhone error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function editStudent(req, res) {
  try {
    const phone = normalizePhone(req.params.phone);
    const { name, email } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    const updates = {};
    if (name !== undefined && name !== null && String(name).trim() !== "") {
      updates.name = String(name).trim();
    }
    if (email !== undefined && email !== null && String(email).trim() !== "") {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Email không hợp lệ",
        });
      }
      updates.email = normalizeEmail(email);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có thông tin cần cập nhật",
      });
    }

    const studentDoc = await findStudentByPhone(phone);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    if (updates.email) {
      const emailSnap = await db
        .collection("students")
        .where("email", "==", updates.email)
        .limit(1)
        .get();
      if (!emailSnap.empty && emailSnap.docs[0].id !== studentDoc.id) {
        return res.status(409).json({
          success: false,
          message: "Email đã tồn tại",
        });
      }
    }

    await studentDoc.ref.update(updates);

    return res.status(200).json({
      success: true,
      message: "Đã cập nhật",
    });
  } catch (error) {
    console.log("editStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function deleteStudent(req, res) {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    const studentDoc = await findStudentByPhone(phone);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    const lessonsSnap = await db
      .collection("lessons")
      .where("assignedTo", "==", phone)
      .get();

    const batch = db.batch();
    lessonsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.delete(studentDoc.ref);
    await batch.commit();

    return res.status(200).json({
      success: true,
      message: "Đã xoá học viên",
    });
  } catch (error) {
    console.log("deleteStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function assignLesson(req, res) {
  try {
    const { studentPhone, title, description } = req.body;

    if (!studentPhone || normalizePhone(studentPhone) === "") {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại học viên không được để trống",
      });
    }

    if (!title || String(title).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề lesson không được để trống",
      });
    }

    const phone = normalizePhone(studentPhone);
    const studentDoc = await findStudentByPhone(phone);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    const lessonRef = await db.collection("lessons").add({
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      assignedTo: phone,
      studentId: studentDoc.id,
      status: "pending",
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Đã gán lesson",
      lessonId: lessonRef.id,
    });
  } catch (error) {
    console.log("assignLesson error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

module.exports = {
  addStudent,
  getStudents,
  getStudentByPhone,
  editStudent,
  deleteStudent,
  assignLesson,
};
