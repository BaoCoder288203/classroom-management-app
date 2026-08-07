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
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export default Sidebar;
