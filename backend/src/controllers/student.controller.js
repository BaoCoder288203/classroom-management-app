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

async function findStudentByEmail(email) {
  const snapshot = await db
    .collection("students")
    .where("email", "==", normalizeEmail(email))
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0];
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

    console.log("[OTP]", normalizedEmail, code);

    await sendEmail(
      normalizedEmail,
      "Mã đăng nhập của bạn",
      `<p>Mã đăng nhập Classroom App của bạn là: <b>${code}</b></p>
       <p>Mã có hiệu lực trong 10 phút.</p>`
    );

    const debugOtp =
      process.env.OTP_DEBUG === "false" ? {} : { debugOtp: code };

    return res.status(200).json({
      success: true,
      message: "Đã gửi mã truy cập qua email",
      ...debugOtp,
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

async function getMyLessons(req, res) {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    const studentDoc = await findStudentByEmail(email);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    const phone = String(studentDoc.data().phone || "").trim();
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
      lessons,
    });
  } catch (error) {
    console.log("getMyLessons error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function markLessonDone(req, res) {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    const { lessonId } = req.body;
    if (!lessonId || String(lessonId).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Thiếu lessonId",
      });
    }

    const studentDoc = await findStudentByEmail(email);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    const phone = String(studentDoc.data().phone || "").trim();
    const lessonRef = db.collection("lessons").doc(String(lessonId).trim());
    const lessonSnap = await lessonRef.get();

    if (!lessonSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lesson",
      });
    }

    const lessonData = lessonSnap.data();
    if (String(lessonData.assignedTo || "").trim() !== phone) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền",
      });
    }

    await lessonRef.update({ status: "done" });

    return res.status(200).json({
      success: true,
      message: "Đã đánh dấu hoàn thành",
    });
  } catch (error) {
    console.log("markLessonDone error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function getProfile(req, res) {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    const studentDoc = await findStudentByEmail(email);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    const d = studentDoc.data();
    return res.status(200).json({
      success: true,
      student: {
        name: d.name || "",
        email: d.email || email,
        phone: d.phone || "",
        username: d.username || "",
      },
    });
  } catch (error) {
    console.log("getProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function editProfile(req, res) {
  try {
    const currentEmail = req.user?.email;
    if (!currentEmail) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    if (req.body.email !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Không được đổi email",
      });
    }

    const { name, username, phone } = req.body;
    const updates = {};

    if (name !== undefined && name !== null && String(name).trim() !== "") {
      updates.name = String(name).trim();
    }

    if (
      username !== undefined &&
      username !== null &&
      String(username).trim() !== ""
    ) {
      if (String(username).trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "Username phải có ít nhất 3 ký tự",
        });
      }
      updates.username = String(username).trim();
    }

    if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
      updates.phone = String(phone).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có thông tin cần cập nhật",
      });
    }

    const studentDoc = await findStudentByEmail(currentEmail);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học viên",
      });
    }

    await studentDoc.ref.update(updates);

    return res.status(200).json({
      success: true,
      message: "Đã cập nhật hồ sơ",
    });
  } catch (error) {
    console.log("editProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function getConversations(req, res) {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    const me = String(email).trim().toLowerCase();

    const snap = await db
      .collection("messages")
      .where("participants", "array-contains", me)
      .get();

    const map = {};
    snap.docs.forEach((doc) => {
      const m = doc.data();
      const parts = m.participants || [];
      const other = parts.find((p) => p !== me);
      if (!other) return;

      const ts = m.timestamp || 0;
      if (!map[other] || ts > (map[other].lastAt || 0)) {
        map[other] = {
          id: other,
          name: other,
          lastMessage: m.text || "",
          lastAt: ts,
          lastSenderId: m.senderId || "",
        };
      }
    });

    const conversations = Object.values(map).sort(
      (a, b) => (b.lastAt || 0) - (a.lastAt || 0)
    );

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.log("getConversations error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

module.exports = {
  loginEmail,
  validateAccessCode,
  setupAccount,
  getMyLessons,
  markLessonDone,
  getProfile,
  editProfile,
  getConversations,
};
