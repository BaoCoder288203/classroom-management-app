import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import { getInitials } from "../../utils/initials";
import "../../styles/dashboard.css";

const sidebarItems = [
  { label: "Manage Students", path: "/instructor/students" },
  { label: "Manage Lessons", path: "/instructor/lessons" },
  { label: "Message", path: "/instructor/messages" },
];

function InstructorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const label = user?.identifier || "Instructor";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard-layout">
      <Sidebar items={sidebarItems} />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-user">{label}</span>
          <div className="topbar-avatar" title={label}>
            {getInitials(label)}
          </div>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="page-enter" key={location.pathname}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default InstructorLayout;
