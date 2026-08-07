import { useAuth } from "../../context/AuthContext";
import ChatLayout from "../../components/ChatLayout";

const INSTRUCTOR_PHONE =
  import.meta.env.VITE_INSTRUCTOR_PHONE || "";

function StudentMessages() {
  const { user } = useAuth();

  const conversations = INSTRUCTOR_PHONE
    ? [
        {
          id: INSTRUCTOR_PHONE,
          name: "Instructor",
          lastMessage: "Chat with instructor",
        },
      ]
    : [];

  if (!INSTRUCTOR_PHONE) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h1 className="panel-title">Message</h1>
        </div>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Set <code>VITE_INSTRUCTOR_PHONE</code> in frontend{" "}
          <code>.env</code> to the instructor phone used at login (same format
          as JWT identifier), then restart Vite.
        </p>
      </div>
    );
  }

  return (
    <ChatLayout
      myId={user?.identifier}
      myRole="student"
      conversations={conversations}
      title="Message"
      showSearch={false}
    />
  );
}

export default StudentMessages;
