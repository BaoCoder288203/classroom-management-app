import { useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api/client";
import "../../styles/dashboard.css";

function CreateStudentModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  function clearField(key) {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "Vui lòng nhập tên học viên";
    if (!phone.trim()) next.phone = "Vui lòng nhập số điện thoại";
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
      await api.post("/api/instructor/addStudent", {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Tạo thất bại");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create Student</h2>
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
              <label>Phone Number</label>
              <input
                className={errors.phone ? "input-error" : ""}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearField("phone");
                }}
                disabled={loading}
              />
              {errors.phone && <p className="field-error">{errors.phone}</p>}
            </div>
            <div className="modal-field full">
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
            <div className="modal-field full">
              <label>Role</label>
              <input value="Student" disabled />
              <p className="field-hint">
                Học viên mới luôn được tạo với role <b>student</b>.
              </p>
            </div>
          </div>
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
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default CreateStudentModal;
