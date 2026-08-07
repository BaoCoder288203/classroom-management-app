import { useState } from "react";
import api from "../../api/client";
import "../../styles/dashboard.css";

function EditStudentModal({ student, onClose, onSaved }) {
  const [name, setName] = useState(student?.name || "");
  const [email, setEmail] = useState(student?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit Student</h2>
        {error && <div className="dashboard-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="modal-grid">
            <div className="modal-field">
              <label>Student Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="modal-field">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
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
    </div>
  );
}

export default EditStudentModal;
