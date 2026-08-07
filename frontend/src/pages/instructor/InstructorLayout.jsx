import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import "../../styles/dashboard.css";

const sidebarItems = [
  { label: "Manage Students", path: "/instructor/students" },
  { label: "Manage Lessons", path: "/instructor/lessons" },
  { label: "Message", path: "/instructor/messages" },
];

function InstructorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard-layout">
      <Sidebar items={sidebarItems} />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-user">
            {user?.identifier || "Instructor"}
          </span>
          <div className="topbar-avatar" />
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default InstructorLayout;
