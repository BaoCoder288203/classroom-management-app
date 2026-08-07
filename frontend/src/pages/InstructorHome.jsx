import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import ChatBox from "../components/ChatBox";

function InstructorHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [students, setStudents] = useState([]);
  const [chatEmail, setChatEmail] = useState("");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function loadStudents() {
    try {
      const res = await api.get("/api/instructor/students");
      setStudents(res.data.students || []);
    } catch {
      setStudents([]);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function handleAddStudent(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/api/instructor/addStudent", {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      setMessage(res.data.message || "Đã thêm học viên");
      setName("");
      setPhone("");
      setEmail("");
      await loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Thêm học viên thất bại");
    } finally {
      setLoading(false);
    }
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
        <h1 style={{ margin: 0 }}>Instructor Home</h1>
        <button type="button" onClick={handleLogout} style={{ padding: "8px 16px" }}>
          Đăng xuất
        </button>
      </div>
      <p style={{ color: "#666" }}>
        Role: <b>{user?.role}</b>
        {user?.identifier ? ` · ${user.identifier}` : ""}
      </p>

      <h2 style={{ marginTop: 32, fontSize: 18 }}>Thêm học viên</h2>
      <p style={{ color: "#666", fontSize: 14, marginTop: 0 }}>
        Hệ thống sẽ gửi email link thiết lập mật khẩu.
      </p>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          style={{
            background: "#f0fdf4",
            color: "#166534",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleAddStudent}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Tên
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          SĐT
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {loading ? "Đang gửi..." : "Thêm + gửi email"}
        </button>
      </form>

      <h2 style={{ marginTop: 40, fontSize: 18 }}>Chat với học viên</h2>
      <p style={{ color: "#666", fontSize: 14, marginTop: 0 }}>
        Room = instructor SĐT + student email (đã sort).
      </p>
      <label style={{ display: "block", marginBottom: 12 }}>
        Chọn học viên
        <select
          value={chatEmail}
          onChange={(e) => setChatEmail(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
        >
          <option value="">-- Chọn --</option>
          {students.map((s) => (
            <option key={s.id} value={s.email}>
              {s.name || s.email} ({s.email})
            </option>
          ))}
        </select>
      </label>
      <ChatBox
        myId={user?.identifier}
        myRole="instructor"
        otherId={chatEmail}
      />
    </div>
  );
}

export default InstructorHome;
