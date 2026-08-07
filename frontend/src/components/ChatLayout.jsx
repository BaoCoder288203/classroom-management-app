import { useEffect, useRef, useState } from "react";
import socket, { getRoomId } from "../socket";
import "../styles/chat.css";

function ChatLayout({
  myId,
  myRole,
  conversations = [],
  title = "All Message",
  showSearch = true,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    if (!myId || !selectedId) {
      setMessages([]);
      return;
    }

    const roomId = getRoomId(myId, selectedId);
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
  }, [selectedId, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selectedId || !myId) return;
    const roomId = getRoomId(myId, selectedId);
    socket.emit("send_message", {
      roomId,
      senderId: myId,
      senderRole: myRole,
      text: text.trim(),
    });
    setText("");
  }

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    return (c.name || "").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="chat-layout">
      <div className="chat-sidebar">
        <div className="chat-sidebar-title">
          {title}
          {showSearch && conversations.length > 1 && (
            <input
              className="chat-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>
        <div className="conversation-list">
          {filteredConversations.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, padding: "0 8px" }}>
              No conversations
            </p>
          ) : (
            filteredConversations.map((c) => (
              <div
                key={c.id}
                className={`conversation-item ${
                  selectedId === c.id ? "active" : ""
                }`}
                onClick={() => setSelectedId(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedId(c.id);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="conversation-avatar" />
                <div>
                  <p className="conversation-name">{c.name}</p>
                  <p className="conversation-preview">
                    {c.lastMessage || "..."}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-panel">
        {selectedId ? (
          <>
            <div className="chat-messages">
              {messages.length === 0 && (
                <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                  No messages yet
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={m.id || `${m.timestamp}-${i}`}
                  className={`chat-bubble ${
                    m.senderId === myId ? "mine" : "theirs"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form className="chat-input-bar" onSubmit={handleSend}>
              <input
                placeholder="Reply message"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="chat-empty">Select a conversation to start</div>
        )}
      </div>
    </div>
  );
}

export default ChatLayout;
