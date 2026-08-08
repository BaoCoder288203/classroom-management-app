const { db } = require("../config/firebase");
const { sendSMS } = require("../services/infobip.service");
const { generateToken } = require("../services/jwt.service");

function toE164(phoneNumber) {
  let phone = phoneNumber.trim().replace(/\s+/g, "");

  if (phone.startsWith("+")) {
    return phone;
  }

  if (phone.startsWith("0")) {
    return "+84" + phone.slice(1);
  }

  if (phone.startsWith("84")) {
    return "+" + phone;
  }

  return "+" + phone;
}

function isValidPhone(phoneNumber) {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return false;
  }

  const phone = phoneNumber.trim().replace(/\s+/g, "");
  const cleaned = phone.replace(/^\+/, "");
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }
  if (cleaned.length < 9 || cleaned.length > 15) {
    return false;
  }

  return true;
}

async function findUserByPhone(formattedPhone) {
  const snapshot = await db
    .collection("users")
    .where("phoneNumber", "==", formattedPhone)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0];
}

async function sendAndStoreCode(userDoc, formattedPhone, createPayload) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  if (!userDoc) {
    await db.collection("users").add({
      ...createPayload,
      phoneNumber: formattedPhone,
      accessCode: code,
      createdAt: new Date(),
    });
  } else {
    await userDoc.ref.update({
      accessCode: code,
      ...createPayload,
    });
  }

  await sendSMS(formattedPhone, `Your access code is: ${code}`);
}

// Instructor Sign In — chỉ gửi OTP nếu đã có account role instructor
async function createAccessCode(req, res) {
  try {
    const { phoneNumber } = req.body;

    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    const formattedPhone = toE164(phoneNumber);
    const userDoc = await findUserByPhone(formattedPhone);

    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: "Chưa có tài khoản instructor. Hãy Sign up trước.",
      });
    }

    const role = userDoc.data().role || "student";
    if (role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Số này không phải tài khoản instructor",
      });
    }

    await sendAndStoreCode(userDoc, formattedPhone, {});

    return res.status(200).json({
      success: true,
      message: "Đã gửi mã truy cập",
    });
  } catch (error) {
    console.log("createAccessCode error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

// Instructor Sign Up — tạo role instructor + gửi OTP
async function instructorSignup(req, res) {
  try {
    const { phoneNumber, name } = req.body;

    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    const formattedPhone = toE164(phoneNumber);
    const userDoc = await findUserByPhone(formattedPhone);

    if (userDoc) {
      const role = userDoc.data().role || "student";
      if (role === "instructor") {
        return res.status(409).json({
          success: false,
          message: "Instructor đã tồn tại. Hãy Sign in.",
        });
      }
      return res.status(409).json({
        success: false,
        message: "Số điện thoại đã được dùng cho role khác",
      });
    }

    const createPayload = {
      role: "instructor",
      name: name ? String(name).trim() : "",
    };

    await sendAndStoreCode(null, formattedPhone, createPayload);

    return res.status(201).json({
      success: true,
      message: "Đã tạo instructor và gửi mã OTP",
    });
  } catch (error) {
    console.log("instructorSignup error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

async function validateAccessCode(req, res) {
  try {
    const { phoneNumber, accessCode } = req.body;

    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    if (!accessCode || String(accessCode).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Mã truy cập không được để trống",
      });
    }

    const formattedPhone = toE164(phoneNumber);
    const userDoc = await findUserByPhone(formattedPhone);

    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const userData = userDoc.data();
    const savedCode = userData.accessCode ? String(userData.accessCode) : "";

    if (!savedCode || savedCode !== String(accessCode).trim()) {
      return res.status(400).json({
        success: false,
        message: "Mã không đúng",
      });
    }

    await userDoc.ref.update({
      accessCode: "",
    });

    const role = userData.role || "student";

    const token = generateToken({
      phone: formattedPhone,
      role: role,
    });

    return res.status(200).json({
      success: true,
      token: token,
      role: role,
      phone: formattedPhone,
    });
  } catch (error) {
    console.log("validateAccessCode error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

module.exports = {
  createAccessCode,
  instructorSignup,
  validateAccessCode,
};
