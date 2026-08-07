import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";

function SetupAccount() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Thiếu token thiết lập trên link");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/student/setupAccount", {
        token,
        username: username.trim(),
        password,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Thiết lập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f5f5f4",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          border: "1px solid #e5e4e7",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: 22 }}>Thiết lập tài khoản</h1>
        <p style={{ color: "#666", fontSize: 14 }}>
          Tạo username và mật khẩu để hoàn tất tài khoản học viên.
        </p>

        {!token && (
          <div style={{ color: "#b91c1c", marginBottom: 12 }}>
            Link không hợp lệ (thiếu token).
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {done ? (
          <div>
            <p style={{ color: "#166534" }}>Thiết lập thành công. Bạn có thể đăng nhập bằng OTP email.</p>
            <Link to="/login">Về trang đăng nhập</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginBottom: 12 }}>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading || !token}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Password (tối thiểu 6 ký tự)
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !token}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Xác nhận password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading || !token}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <button
              type="submit"
              disabled={loading || !token}
              style={{
                width: "100%",
                padding: 11,
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {loading ? "Đang lưu..." : "Hoàn tất"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SetupAccount;
