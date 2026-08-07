import { useState } from "react";
import api from "../../api/client";
import "../../styles/dashboard.css";

function CreateStudentModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create Student</h2>
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
              <label>Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="modal-field full">
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
    </div>
  );
}

export default CreateStudentModal;
