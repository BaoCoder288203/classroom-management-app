const { db } = require("../config/firebase");

function normalizeId(id) {
  const s = String(id || "").trim();
  if (!s) return s;
  if (s.includes("@")) return s.toLowerCase();
  let p = s.replace(/\s+/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("0")) return "+84" + p.slice(1);
  if (p.startsWith("84")) return "+" + p;
  return "+" + p;
}

function getRoomId(idA, idB) {
  return [normalizeId(idA), normalizeId(idB)].sort().join("_");
}

module.exports = function initChatSocket(io) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_user", ({ userId }) => {
      const id = normalizeId(userId);
      if (!id) return;
      socket.join("user_" + id);
    });

    socket.on("join_room", async ({ roomId }) => {
      try {
        if (!roomId) return;
        socket.join(roomId);

        const snapshot = await db
          .collection("messages")
          .where("roomId", "==", roomId)
          .get();

        const messages = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        socket.emit("chat_history", messages);
      } catch (error) {
        console.log("join_room error:", error);
        socket.emit("chat_error", { message: "Không tải được lịch sử chat" });
      }
    });

    socket.on(
      "send_message",
      async ({
        roomId,
        senderId,
        senderRole,
        text,
        receiverId,
        type,
        fileUrl,
        fileName,
        mimeType,
      }) => {
        try {
          if (!roomId || !senderId) return;

          const from = normalizeId(senderId);
          const to = normalizeId(receiverId);
          if (!to) return;

          const msgType = type || "text";
          const body = text != null ? String(text).trim() : "";
          const url = fileUrl ? String(fileUrl).trim() : "";

          if (msgType === "text" && !body) return;
          if (
            (msgType === "image" ||
              msgType === "file" ||
              msgType === "gif") &&
            !url
          ) {
            return;
          }
          if (msgType === "sticker" && !body && !url) return;

          const message = {
            roomId,
            senderId: from,
            receiverId: to,
            participants: [from, to],
            senderRole: senderRole || "",
            type: msgType,
            text: body,
            fileUrl: url,
            fileName: fileName ? String(fileName) : "",
            mimeType: mimeType ? String(mimeType) : "",
            timestamp: Date.now(),
          };

          const docRef = await db.collection("messages").add(message);
          const payload = { id: docRef.id, ...message };

          io.to(roomId).emit("receive_message", payload);
          io.to("user_" + to).emit("receive_message", payload);
        } catch (error) {
          console.log("send_message error:", error);
          socket.emit("chat_error", { message: "Gửi tin nhắn thất bại" });
        }
      }
    );

    socket.on("leave_room", ({ roomId }) => {
      if (roomId) socket.leave(roomId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports.getRoomId = getRoomId;
