import { useEffect, useState } from "react";
import api from "../../api/client";
import "../../styles/dashboard.css";

function ManageLessons() {
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPhones, setSelectedPhones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  async function load() {
    try {
      const [sRes, lRes] = await Promise.all([
        api.get("/api/instructor/students"),
        api.get("/api/instructor/lessons"),
      ]);
      setStudents(sRes.data.students || []);
      setLessons(lRes.data.lessons || []);
      setError("");
    } catch {
      setError("Không tải được dữ liệu");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function togglePhone(phone) {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
    if (errors.students) setErrors((prev) => ({ ...prev, students: "" }));
  }

  function validate() {
    const next = {};
    if (!title.trim()) next.title = "Vui lòng nhập tiêu đề lesson";
    if (selectedPhones.length === 0) {
      next.students = "Chọn ít nhất 1 học viên";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleAssign(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!validate()) return;

    setLoading(true);
    try {
      await Promise.all(
        selectedPhones.map((studentPhone) =>
          api.post("/api/instructor/assignLesson", {
            studentPhone,
            title: title.trim(),
            description: description.trim(),
          })
        )
      );
      setMessage(`Đã gán lesson cho ${selectedPhones.length} học viên`);
      setTitle("");
      setDescription("");
      setSelectedPhones([]);
      setErrors({});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Gán lesson thất bại");
    } finally {
      setLoading(false);
    }
  }

  function studentName(phone) {
    const s = students.find((x) => x.phone === phone);
    return s?.name || phone;
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h1 className="panel-title">Manage Lessons</h1>
      </div>

      {error && <div className="dashboard-error">{error}</div>}
      {message && <div className="dashboard-success">{message}</div>}

      <form onSubmit={handleAssign} style={{ marginBottom: 32 }} noValidate>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Assign new lesson</h2>
        <div className="modal-field" style={{ marginBottom: 12 }}>
          <label>Title</label>
          <input
            className={errors.title ? "input-error" : ""}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
            }}
            disabled={loading}
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>
        <div className="modal-field" style={{ marginBottom: 12 }}>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={loading}
            className="form-textarea"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Assign to</label>
          <div
            className="checklist-box"
            style={
              errors.students
                ? { borderColor: "var(--danger)" }
                : undefined
            }
          >
            {students.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                No students
              </p>
            )}
            {students.map((s) => (
              <label key={s.phone || s.id} className="checklist-item">
                <input
                  type="checkbox"
                  checked={selectedPhones.includes(s.phone)}
                  onChange={() => togglePhone(s.phone)}
                  disabled={loading}
                />
                {s.name} · {s.phone}
              </label>
            ))}
          </div>
          {errors.students && (
            <p className="field-error">{errors.students}</p>
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Assigning..." : "Assign lesson"}
        </button>
      </form>

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Assigned lessons</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Student</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {lessons.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ color: "#9ca3af" }}>
                No lessons yet
              </td>
            </tr>
          ) : (
            lessons.map((l) => (
              <tr key={l.id}>
                <td>
                  <b>{l.title}</b>
                  {l.description ? (
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {l.description}
                    </div>
                  ) : null}
                </td>
                <td>{studentName(l.assignedTo)}</td>
                <td>
                  <span
                    className={`status-badge ${
                      l.status === "done" ? "" : "pending"
                    }`}
                  >
                    {l.status || "pending"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ManageLessons;
