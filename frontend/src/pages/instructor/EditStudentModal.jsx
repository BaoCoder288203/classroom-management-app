import { useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api/client";
import "../../styles/dashboard.css";

function EditStudentModal({ student, onClose, onSaved }) {
  const [name, setName] = useState(student?.name || "");
  const [email, setEmail] = useState(student?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  function clearField(key) {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "Vui lòng nhập tên học viên";
    if (!email.trim()) next.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Email không hợp lệ";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await api.put(
        `/api/instructor/editStudent/${encodeURIComponent(student.phone)}`,
        {
          name: name.trim(),
          email: email.trim(),
        }
      );
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit Student</h2>
        {error && <div className="dashboard-error">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-grid">
            <div className="modal-field">
              <label>Student Name</label>
              <input
                className={errors.name ? "input-error" : ""}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearField("name");
                }}
                disabled={loading}
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
            <div className="modal-field">
              <label>Email Address</label>
              <input
                type="email"
                className={errors.email ? "input-error" : ""}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearField("email");
                }}
                disabled={loading}
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Phone: {student?.phone} (cannot change)
          </p>
          <div className="modal-footer">
            <button
              type="button"
              className="btn-logout"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default EditStudentModal;
