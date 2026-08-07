import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import ChatLayout from "../../components/ChatLayout";

function InstructorMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/api/instructor/students");
        const list = (res.data.students || []).map((s) => ({
          id: s.email,
          name: s.name || s.email,
          lastMessage: s.email,
        }));
        setConversations(list);
      } catch {
        setConversations([]);
      }
    }
    load();
  }, []);

  return (
    <ChatLayout
      myId={user?.identifier}
      myRole="instructor"
      conversations={conversations}
      title="All Message"
      showSearch
    />
  );
}

export default InstructorMessages;
