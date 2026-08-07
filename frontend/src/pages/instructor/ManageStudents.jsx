import { useEffect, useState } from "react";
import api from "../../api/client";
import CreateStudentModal from "./CreateStudentModal";
import EditStudentModal from "./EditStudentModal";
import "../../styles/dashboard.css";

function ManageStudents() {
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

  const filteredStudents = students.filter((s) => {
    const q = filter.toLowerCase();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q)
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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "#9ca3af" }}>
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id || s.phone}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
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
