import { NavLink } from "react-router-dom";
import "../styles/dashboard.css";

function Sidebar({ items }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">Classroom</div>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span>{item.label}</span>
          {item.badge > 0 && (
            <span className="nav-badge">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export default Sidebar;
