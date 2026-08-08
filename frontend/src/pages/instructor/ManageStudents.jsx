import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import CreateStudentModal from "./CreateStudentModal";
import EditStudentModal from "./EditStudentModal";
import { getInitials } from "../../utils/initials";
import "../../styles/dashboard.css";

function ManageStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/instructor/students");
      setStudents(res.data.students || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được danh sách");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(phone) {
    if (!window.confirm("Xóa học viên này?")) return;
    try {
      await api.delete(
        `/api/instructor/student/${encodeURIComponent(phone)}`
      );
      await loadStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Xóa thất bại");
    }
  }

  function openChat(student) {
    if (!student?.email) return;
    navigate(
      `/instructor/messages?student=${encodeURIComponent(student.email)}`
    );
  }

  const filteredStudents = students.filter((s) => {
    const q = filter.toLowerCase();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      (s.role || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <h1 className="panel-title">Manage Students</h1>
        </div>

        <div className="panel-header">
          <b>{students.length} Students</b>
          <div className="panel-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowCreate(true)}
            >
              + Add Student
            </button>
            <input
              className="filter-input"
              placeholder="Filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Account</th>
                <th>Lessons</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: "#9ca3af" }}>
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id || s.phone}>
                    <td>
                      <div className="cell-user">
                        <span className="cell-avatar">
                          {getInitials(s.name || s.email)}
                        </span>
                        {s.name}
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>
                      <span className="role-pill">{s.role || "student"}</span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          s.isAccountSetup ? "" : "pending"
                        }`}
                      >
                        {s.isAccountSetup ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          s.lessonStats?.pending > 0 ? "pending" : ""
                        }`}
                      >
                        {s.lessonStatus || "No lessons"}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button
                        type="button"
                        className="btn-icon-msg"
                        title="Message"
                        aria-label="Message student"
                        onClick={() => openChat(s)}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => setEditStudent(s)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => handleDelete(s.phone)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateStudentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadStudents();
          }}
        />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSaved={() => {
            setEditStudent(null);
            loadStudents();
          }}
        />
      )}
    </>
  );
}

export default ManageStudents;
