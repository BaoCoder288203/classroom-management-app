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

async function createAccessCode(req, res) {
  try {
    const { phoneNumber } = req.body;

    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const formattedPhone = toE164(phoneNumber);

    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("phoneNumber", "==", formattedPhone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      await usersRef.add({
        phoneNumber: formattedPhone,
        accessCode: code,
        role: "student",
        createdAt: new Date(),
      });
    } else {
      const userDoc = snapshot.docs[0];
      await userDoc.ref.update({
        accessCode: code,
      });
    }

    await sendSMS(formattedPhone, `Your access code is: ${code}`);

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

    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("phoneNumber", "==", formattedPhone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const userDoc = snapshot.docs[0];
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
    });
  } catch (error) {
    console.log("validateAccessCode error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra",
    });
  }
}

module.exports = { createAccessCode, validateAccessCode };
