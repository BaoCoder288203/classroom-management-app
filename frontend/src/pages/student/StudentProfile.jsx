import { useEffect, useState } from "react";
import api from "../../api/client";
import "../../styles/dashboard.css";

function StudentProfile() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/api/student/profile");
        const s = res.data.student || {};
        setName(s.name || "");
        setUsername(s.username || "");
        setPhone(s.phone || "");
        setEmail(s.email || "");
      } catch (err) {
        setError(err.response?.data?.message || "Không tải profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await api.put("/api/student/editProfile", {
        name: name.trim(),
        username: username.trim(),
        phone: phone.trim(),
      });
      setMessage("Đã lưu hồ sơ");
    } catch (err) {
      setError(err.response?.data?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="panel">
        <p style={{ color: "#6b7280" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="panel" style={{ maxWidth: 480 }}>
      <div className="panel-header">
        <h1 className="panel-title">My Profile</h1>
      </div>
      {error && <div className="dashboard-error">{error}</div>}
      {message && <div className="dashboard-success">{message}</div>}
      <form onSubmit={handleSave}>
        <div className="modal-field" style={{ marginBottom: 12 }}>
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="modal-field" style={{ marginBottom: 12 }}>
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="modal-field" style={{ marginBottom: 12 }}>
          <label>Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="modal-field" style={{ marginBottom: 16 }}>
          <label>Email (read-only)</label>
          <input value={email} disabled />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}

export default StudentProfile;
