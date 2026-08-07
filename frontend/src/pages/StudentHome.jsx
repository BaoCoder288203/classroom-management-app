import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChatBox from "../components/ChatBox";

function StudentHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [instructorPhone, setInstructorPhone] = useState("");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div
      style={{
        padding: 32,
        textAlign: "left",
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>Student Home</h1>
        <button type="button" onClick={handleLogout} style={{ padding: "8px 16px" }}>
          Đăng xuất
        </button>
      </div>
      <p style={{ color: "#666" }}>
        Role: <b>{user?.role}</b>
        {user?.identifier ? ` · ${user.identifier}` : ""}
      </p>

      <h2 style={{ marginTop: 32, fontSize: 18 }}>Chat với instructor</h2>
      <p style={{ color: "#666", fontSize: 14, marginTop: 0 }}>
        Nhập SĐT instructor (đúng format đã login, vd +8490... hoặc 090...).
      </p>
      <label style={{ display: "block", marginBottom: 12 }}>
        SĐT instructor
        <input
          value={instructorPhone}
          onChange={(e) => setInstructorPhone(e.target.value)}
          placeholder="0901234567"
          style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
        />
      </label>
      <ChatBox
        myId={user?.identifier}
        myRole="student"
        otherId={instructorPhone.trim()}
      />
    </div>
  );
}

export default StudentHome;
