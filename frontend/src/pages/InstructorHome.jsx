import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function InstructorHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <h1>Instructor Home</h1>
      <p>
        Role: <b>{user?.role}</b>
        {user?.identifier ? (
          <>
            {" "}
            · <span style={{ color: "#666" }}>{user.identifier}</span>
          </>
        ) : null}
      </p>
      <p style={{ color: "#666" }}>
        Placeholder — CRUD students/lessons ở ngày sau.
      </p>
      <button
        type="button"
        onClick={handleLogout}
        style={{ marginTop: 16, padding: "8px 16px" }}
      >
        Đăng xuất
      </button>
    </div>
  );
}

export default InstructorHome;
