const { db } = require("../config/firebase");

function getRoomId(idA, idB) {
  return [String(idA), String(idB)].sort().join("_");
}

module.exports = function initChatSocket(io) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

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
      async ({ roomId, senderId, senderRole, text }) => {
        try {
          if (!roomId || !senderId) return;
          if (!text || String(text).trim() === "") return;

          const message = {
            roomId,
            senderId: String(senderId),
            senderRole: senderRole || "",
            text: String(text).trim(),
            timestamp: Date.now(),
          };

          const docRef = await db.collection("messages").add(message);
          const payload = { id: docRef.id, ...message };

          io.to(roomId).emit("receive_message", payload);
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
