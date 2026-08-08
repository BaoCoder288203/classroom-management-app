import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import socket, { normalizeId } from "../../socket";
import { getInitials } from "../../utils/initials";
import "../../styles/dashboard.css";

function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  const myId = normalizeId(user?.identifier);
  const onMessages = location.pathname.includes("/student/messages");
  const label = user?.identifier || "Student";

  useEffect(() => {
    if (!myId) return;

    socket.emit("join_user", { userId: myId });

    function onReceive(msg) {
      if (!msg) return;
      if (normalizeId(msg.senderId) === myId) return;

      if (window.location.pathname.includes("/student/messages")) {
        setUnread(0);
        return;
      }

      setUnread((n) => n + 1);
    }

    socket.on("receive_message", onReceive);
    return () => socket.off("receive_message", onReceive);
  }, [myId]);

  useEffect(() => {
    if (!onMessages || !myId) return;
    setUnread(0);
  }, [onMessages, myId]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const sidebarItems = [
    { label: "My Lessons", path: "/student/lessons" },
    { label: "Message", path: "/student/messages", badge: unread },
    { label: "Profile", path: "/student/profile" },
  ];

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

export default StudentLayout;
