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

async function addStudent(req, res) {
  try {
    const { name, phone, email } = req.body;

    if (!name || String(name).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Tên không được để trống",
      });
    }

    if (!phone || String(phone).trim() === "") {
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
    const studentsRef = db.collection("students");

    const existing = await studentsRef
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({
        success: false,
        message: "Email đã tồn tại",
      });
    }

    const setupToken = generateSetupToken(normalizedEmail);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const setupLink = `${frontendUrl}/setup-account?token=${setupToken}`;

    const docRef = await studentsRef.add({
      name: String(name).trim(),
      phone: String(phone).trim(),
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

module.exports = { addStudent };
