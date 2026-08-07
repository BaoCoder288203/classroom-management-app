import { useNavigate } from "react-router-dom";

function StudentHome() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  }

  return (
    <div style={{ padding: 32, textAlign: "left", maxWidth: 640, margin: "0 auto" }}>
      <h1>Student Home</h1>
      <p>Đăng nhập thành công với role: <b>{role || "student"}</b></p>
      <p style={{ color: "#666" }}>Placeholder — lessons/assignments ở ngày sau.</p>
      <button type="button" onClick={logout} style={{ marginTop: 16, padding: "8px 16px" }}>
        Đăng xuất
      </button>
    </div>
  );
}

export default StudentHome;
