require("dotenv").config();

async function sendSMS(toPhoneNumber, message) {
  const phone = toPhoneNumber.replace(/^\+/, "");

  const url = `https://${process.env.INFOBIP_BASE_URL}/sms/3/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `App ${process.env.INFOBIP_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          destinations: [{ to: phone }],
          sender: process.env.INFOBIP_SENDER,
          content: { text: message },
        },
      ],
    }),
  });

  const data = await res.json();

  const status = data?.messages?.[0]?.status;
  if (!status || status.groupName !== "PENDING") {
    console.log("Infobip error:", JSON.stringify(data));
    throw new Error(status?.description || "Gui SMS that bai");
  }

  return data;
}

module.exports = { sendSMS };