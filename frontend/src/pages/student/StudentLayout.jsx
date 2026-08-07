import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import "../../styles/dashboard.css";

const sidebarItems = [
  { label: "Manage Lessons", path: "/student/lessons" },
  { label: "Message", path: "/student/messages" },
];

function StudentLayout() {
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
            {user?.identifier || "Student"}
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

export default StudentLayout;
