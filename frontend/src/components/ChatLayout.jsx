import { useEffect, useRef, useState } from "react";
import api from "../api/client";
import socket, { getRoomId, normalizeId } from "../socket";
import { getInitials } from "../utils/initials";
import { QUICK_EMOJIS, STICKERS } from "../utils/chatStickers";
import "../styles/chat.css";

function MessageBody({ m }) {
  const type = m.type || "text";

  if (type === "image" || type === "gif") {
    return (
      <div className="chat-media">
        <a href={m.fileUrl} target="_blank" rel="noreferrer">
          <img src={m.fileUrl} alt={m.fileName || type} className="chat-img" />
        </a>
        {m.text ? <p className="chat-caption">{m.text}</p> : null}
      </div>
    );
  }

  if (type === "file") {
    return (
      <a
        className="chat-file-link"
        href={m.fileUrl}
        target="_blank"
        rel="noreferrer"
      >
        📎 {m.fileName || "Download file"}
      </a>
    );
  }

  if (type === "sticker") {
    return <span className="chat-sticker">{m.text}</span>;
  }

  return <>{m.text}</>;
}

function ChatLayout({
  myId,
  myRole,
  conversations = [],
  title = "All Message",
  showSearch = true,
  emptyHint = "No conversations",
  initialSelectedId = null,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState(null); // emoji | sticker | gif | null
  const [gifUrl, setGifUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(normalizeId(initialSelectedId));
    }
  }, [initialSelectedId]);

  useEffect(() => {
    if (initialSelectedId) return;
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId, initialSelectedId]);

  useEffect(() => {
    if (
      selectedId &&
      conversations.length > 0 &&
      !conversations.some((c) => c.id === selectedId)
    ) {
      if (initialSelectedId && normalizeId(initialSelectedId) === selectedId) {
        return;
      }
      setSelectedId(conversations[0]?.id || null);
    }
  }, [conversations, selectedId, initialSelectedId]);

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
      setMessages((prev) => {
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }

    socket.on("chat_history", onHistory);
    socket.on("receive_message", onReceive);

    return () => {
      socket.off("chat_history", onHistory);
      socket.off("receive_message", onReceive);
    };
  }, [selectedId, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function emitMessage(payload) {
    if (!selectedId || !myId) return;
    const roomId = getRoomId(myId, selectedId);
    socket.emit("send_message", {
      roomId,
      senderId: myId,
      senderRole: myRole,
      receiverId: selectedId,
      type: "text",
      text: "",
      fileUrl: "",
      fileName: "",
      mimeType: "",
      ...payload,
    });
  }

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selectedId || !myId) return;
    emitMessage({ type: "text", text: text.trim() });
    setText("");
  }

  function sendEmoji(emoji) {
    emitMessage({ type: "text", text: emoji });
    setPanel(null);
  }

  function sendSticker(sticker) {
    emitMessage({ type: "sticker", text: sticker });
    setPanel(null);
  }

  function sendGifUrl(e) {
    e.preventDefault();
    const url = gifUrl.trim();
    if (!url) return;
    emitMessage({ type: "gif", fileUrl: url, text: "" });
    setGifUrl("");
    setPanel(null);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedId) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/api/chat/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data;
      emitMessage({
        type: data.type || "file",
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        mimeType: data.mimeType,
        text: "",
      });
    } catch (err) {
      alert(err.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.id || "").toLowerCase().includes(q)
    );
  });

  const selected = conversations.find((c) => c.id === selectedId);

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
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                padding: "8px 10px",
              }}
            >
              {emptyHint}
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
                <div className="conversation-avatar">
                  {getInitials(c.name || c.id)}
                </div>
                <div>
                  <p className="conversation-name">{c.name}</p>
                  <p className="conversation-preview">
                    {c.lastMessage || c.id || "..."}
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
            <div className="chat-panel-header">
              {selected?.name || selectedId}
            </div>
            <div className="chat-messages">
              {messages.length === 0 && (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 13,
                    margin: 0,
                  }}
                >
                  No messages yet
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={m.id || `${m.timestamp}-${i}`}
                  className={`chat-bubble ${
                    normalizeId(m.senderId) === normalizeId(myId)
                      ? "mine"
                      : "theirs"
                  } ${m.type === "sticker" ? "bubble-sticker" : ""}`}
                >
                  <MessageBody m={m} />
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {panel === "emoji" && (
              <div className="chat-picker">
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="chat-picker-item"
                    onClick={() => sendEmoji(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
            {panel === "sticker" && (
              <div className="chat-picker">
                {STICKERS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className="chat-picker-item sticker"
                    onClick={() => sendSticker(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
            {panel === "gif" && (
              <form className="chat-gif-form" onSubmit={sendGifUrl}>
                <input
                  placeholder="Dán URL GIF (vd Giphy)"
                  value={gifUrl}
                  onChange={(e) => setGifUrl(e.target.value)}
                />
                <button type="submit" className="btn-primary">
                  Gửi GIF
                </button>
              </form>
            )}

            <form className="chat-input-bar" onSubmit={handleSend}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                hidden
                onChange={handleFileChange}
              />
              <div className="chat-tools">
                <button
                  type="button"
                  className="chat-tool-btn"
                  title="Emoji"
                  onClick={() =>
                    setPanel((p) => (p === "emoji" ? null : "emoji"))
                  }
                >
                  😀
                </button>
                <button
                  type="button"
                  className="chat-tool-btn"
                  title="Sticker"
                  onClick={() =>
                    setPanel((p) => (p === "sticker" ? null : "sticker"))
                  }
                >
                  ⭐
                </button>
                <button
                  type="button"
                  className="chat-tool-btn"
                  title="GIF URL"
                  onClick={() => setPanel((p) => (p === "gif" ? null : "gif"))}
                >
                  GIF
                </button>
                <button
                  type="button"
                  className="chat-tool-btn"
                  title="File / Ảnh"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? "…" : "📎"}
                </button>
              </div>
              <input
                placeholder="Reply message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <div className="chat-empty-icon">C</div>
            <span>
              {conversations.length === 0
                ? emptyHint
                : "Select a conversation to start"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatLayout;
