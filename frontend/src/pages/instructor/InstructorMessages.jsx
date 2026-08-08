import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import ChatLayout from "../../components/ChatLayout";
import { normalizeId } from "../../socket";

function InstructorMessages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);

  const studentParam = searchParams.get("student") || "";

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/api/instructor/students");
        const list = (res.data.students || []).map((s) => ({
          id: normalizeId(s.email),
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
      myId={normalizeId(user?.identifier)}
      myRole="instructor"
      conversations={conversations}
      title="All Message"
      showSearch
      initialSelectedId={studentParam ? normalizeId(studentParam) : null}
    />
  );
}

export default InstructorMessages;
