import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import ChatLayout from "../../components/ChatLayout";
import socket, { normalizeId } from "../../socket";

function peerFromMsg(msg, myId) {
  const me = normalizeId(myId);
  if (msg.receiverId && normalizeId(msg.receiverId) === me) {
    return normalizeId(msg.senderId);
  }
  if (msg.senderId && normalizeId(msg.senderId) === me) {
    return normalizeId(msg.receiverId);
  }
  const parts = msg.participants || [];
  const other = parts.find((p) => normalizeId(p) !== me);
  return other ? normalizeId(other) : "";
}

function labelFor(id) {
  if (!id) return "Instructor";
  if (String(id).includes("@")) return id;
  return `Instructor · ${id}`;
}

function StudentMessages() {
  const { user } = useAuth();
  const myId = normalizeId(user?.identifier);
  const [conversations, setConversations] = useState([]);

  // load từ server (persist) + realtime khi instructor nhắn
  useEffect(() => {
    if (!myId) return;

    async function load() {
      try {
        const res = await api.get("/api/student/conversations");
        const list = (res.data.conversations || []).map((c) => ({
          id: normalizeId(c.id),
          name: labelFor(c.id),
          lastMessage: c.lastMessage || "",
        }));
        setConversations(list);
      } catch {
        setConversations([]);
      }
    }

    load();

    function onReceive(msg) {
      const peer = peerFromMsg(msg, myId);
      if (!peer) return;
      // chỉ hiện khi ai đó nhắn mình (hoặc mình reply sau khi đã có)
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === peer);
        const row = {
          id: peer,
          name: labelFor(peer),
          lastMessage: msg.text || "",
        };
        if (exists) {
          return [row, ...prev.filter((c) => c.id !== peer)];
        }
        // tin do mình gửi nhưng chưa có peer? không mở conversation mới
        if (normalizeId(msg.senderId) === myId) {
          return prev;
        }
        return [row, ...prev];
      });
    }

    socket.on("receive_message", onReceive);
    return () => socket.off("receive_message", onReceive);
  }, [myId]);

  return (
    <ChatLayout
      myId={myId}
      myRole="student"
      conversations={conversations}
      title="Message"
      showSearch={conversations.length > 1}
      emptyHint="Chưa có tin nhắn. Khi instructor nhắn, hội thoại sẽ hiện ở đây."
    />
  );
}

export default StudentMessages;
