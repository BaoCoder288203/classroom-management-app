const bcrypt = require("bcrypt");
const { db } = require("../config/firebase");
const { sendEmail } = require("../services/email.service");
const {
  generateToken,
  verifySetupToken,
} = require("../services/jwt.service");

function isValidEmail(email) {
  if (!email || String(email).trim() === "") {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

async function loginEmail(req, res) {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const studentsRef = db.collection("students");
    const snapshot = await studentsRef
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    const studentDoc = snapshot.docs[0];
    await studentDoc.ref.update({
      accessCode: code,
      accessCodeExpiry: Date.now() + 10 * 60 * 1000,
    });

    await sendEmail(
      normalizedEmail,
      "Mã đăng nhập của bạn",
      `<p>Mã đăng nhập Classroom App của bạn là: <b>${code}</b></p>
       <p>Mã có hiệu lực trong 10 phút.</p>`
    );

    return res.status(200).json({
      success: true,
      message: "Đã gửi mã truy cập qua email",
    });
  } catch (error) {
    console.log("loginEmail error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function validateAccessCode(req, res) {
  try {
    const { email, accessCode } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }

    if (!accessCode || String(accessCode).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Mã truy cập không được để trống",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const studentsRef = db.collection("students");
    const snapshot = await studentsRef
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    const studentDoc = snapshot.docs[0];
    const studentData = studentDoc.data();
    const savedCode = studentData.accessCode
      ? String(studentData.accessCode)
      : "";
    const expiry = studentData.accessCodeExpiry || 0;

    if (!savedCode || savedCode !== String(accessCode).trim()) {
      return res.status(400).json({
        success: false,
        message: "Mã không đúng",
      });
    }

    if (expiry && Date.now() > expiry) {
      return res.status(400).json({
        success: false,
        message: "Mã đã hết hạn",
      });
    }

    await studentDoc.ref.update({
      accessCode: "",
      accessCodeExpiry: 0,
    });

    const token = generateToken({
      email: normalizedEmail,
      role: "student",
    });

    return res.status(200).json({
      success: true,
      token: token,
      role: "student",
    });
  } catch (error) {
    console.log("student validateAccessCode error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function setupAccount(req, res) {
  try {
    const { token, username, password } = req.body;

    if (!token || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Thiếu token, username hoặc password",
      });
    }

    if (String(username).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username phải có ít nhất 3 ký tự",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password phải có ít nhất 6 ký tự",
      });
    }

    let decoded;
    try {
      decoded = verifySetupToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Link thiết lập đã hết hạn",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Token thiết lập không hợp lệ",
      });
    }

    const email = normalizeEmail(decoded.email);
    const studentsRef = db.collection("students");
    const snapshot = await studentsRef
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    const studentDoc = snapshot.docs[0];
    const studentData = studentDoc.data();

    if (studentData.isAccountSetup) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản đã được thiết lập",
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    await studentDoc.ref.update({
      username: String(username).trim(),
      passwordHash: passwordHash,
      isAccountSetup: true,
    });

    return res.status(200).json({
      success: true,
      message: "Thiết lập tài khoản thành công",
    });
  } catch (error) {
    console.log("setupAccount error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

module.exports = { loginEmail, validateAccessCode, setupAccount };
