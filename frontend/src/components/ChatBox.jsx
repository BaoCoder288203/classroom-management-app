import { useEffect, useState, useRef } from "react";
import socket, { getRoomId } from "../socket";

function ChatBox({ myId, myRole, otherId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const roomId =
    myId && otherId ? getRoomId(myId, otherId) : null;

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    setMessages([]);
    socket.emit("join_room", { roomId });

    function onHistory(list) {
      setMessages(Array.isArray(list) ? list : []);
    }

    function onReceive(msg) {
      if (msg?.roomId !== roomId) return;
      setMessages((prev) => [...prev, msg]);
    }

    socket.on("chat_history", onHistory);
    socket.on("receive_message", onReceive);

    return () => {
      socket.emit("leave_room", { roomId });
      socket.off("chat_history", onHistory);
      socket.off("receive_message", onReceive);
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!roomId || !myId || !text.trim()) return;

    socket.emit("send_message", {
      roomId,
      senderId: myId,
      senderRole: myRole,
      text: text.trim(),
    });
    setText("");
  }

  if (!myId || !otherId) {
    return (
      <p style={{ color: "#666", fontSize: 14 }}>
        Chọn đối tượng chat để bắt đầu.
      </p>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #e5e4e7",
        borderRadius: 12,
        padding: 12,
        maxWidth: 480,
      }}
    >
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
        Chat với <b>{otherId}</b>
      </div>
      <div
        style={{
          height: 260,
          overflowY: "auto",
          background: "#fafafa",
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#999", fontSize: 13, margin: 0 }}>
            Chưa có tin nhắn.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.senderId === myId;
          return (
            <div
              key={m.id || `${m.timestamp}-${i}`}
              style={{
                display: "flex",
                justifyContent: mine ? "flex-end" : "flex-start",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: mine ? "#111" : "#e5e4e7",
                  color: mine ? "#fff" : "#111",
                  fontSize: 14,
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 14px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Gửi
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
