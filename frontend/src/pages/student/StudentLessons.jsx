import { useEffect, useState } from "react";
import api from "../../api/client";
import "../../styles/dashboard.css";

function StudentLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/student/myLessons");
      setLessons(res.data.lessons || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được lessons");
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markDone(lessonId) {
    setBusyId(lessonId);
    try {
      await api.post("/api/student/markLessonDone", { lessonId });
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, status: "done" } : l))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Không cập nhật được");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h1 className="panel-title">My Lessons</h1>
      </div>

      {error && <div className="dashboard-error">{error}</div>}
      {loading && <p style={{ color: "#6b7280" }}>Loading...</p>}

      {!loading && lessons.length === 0 && (
        <p style={{ color: "#9ca3af", fontSize: 14 }}>
          No lessons assigned yet.
        </p>
      )}

      <div className="lesson-list">
        {lessons.map((l) => {
          const done = l.status === "done";
          return (
            <div
              key={l.id}
              className={`lesson-card ${done ? "lesson-card-done" : ""}`}
            >
              <div>
                <div className="lesson-card-head">
                  <b style={{ fontSize: 16 }}>{l.title}</b>
                  <span className={`status-badge ${done ? "" : "pending"}`}>
                    {done ? "Done" : "Pending"}
                  </span>
                </div>
                <p className="lesson-card-desc">
                  {l.description || "No description"}
                </p>
              </div>
              {!done && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busyId === l.id}
                  onClick={() => markDone(l.id)}
                >
                  {busyId === l.id ? "..." : "Done"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentLessons;
