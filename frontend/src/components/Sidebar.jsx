import { NavLink } from "react-router-dom";
import "../styles/dashboard.css";

function Sidebar({ items }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">C</div>
        <span className="sidebar-logo-text">Classroom</span>
      </div>
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
            <span className="nav-badge" key={item.badge}>
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </aside>
  );
}

export default Sidebar;
