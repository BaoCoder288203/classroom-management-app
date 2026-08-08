import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import "../styles/auth.css";

function SetupAccount() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  function clearField(key) {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const next = {};
    if (!username.trim()) next.username = "Vui lòng nhập username";
    else if (username.trim().length < 3) {
      next.username = "Username phải có ít nhất 3 ký tự";
    }
    if (!password) next.password = "Vui lòng nhập mật khẩu";
    else if (password.length < 6) {
      next.password = "Mật khẩu tối thiểu 6 ký tự";
    }
    if (!confirm) next.confirm = "Vui lòng xác nhận mật khẩu";
    else if (password !== confirm) {
      next.confirm = "Mật khẩu xác nhận không khớp";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Thiếu token thiết lập trên link");
      return;
    }
    if (!validate()) return;

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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">C</div>
          <h1 className="auth-brand-name">Classroom</h1>
        </div>
        <h2 className="auth-title">Thiết lập tài khoản</h2>
        <p className="auth-subtitle">
          Tạo username và mật khẩu để hoàn tất tài khoản học viên.
        </p>

        {!token && (
          <div className="auth-error">Link không hợp lệ (thiếu token).</div>
        )}

        {error && <div className="auth-error">{error}</div>}

        {done ? (
          <div>
            <p style={{ color: "var(--success)", textAlign: "center" }}>
              Thiết lập thành công. Bạn có thể đăng nhập bằng OTP email.
            </p>
            <Link
              className="auth-link"
              to="/login"
              style={{ display: "block", textAlign: "center", marginTop: 16 }}
            >
              Về trang đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <input
                className={`auth-input ${errors.username ? "input-error" : ""}`}
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearField("username");
                }}
                disabled={loading || !token}
              />
              {errors.username && (
                <p className="field-error">{errors.username}</p>
              )}
            </div>
            <div className="auth-field">
              <input
                className={`auth-input ${errors.password ? "input-error" : ""}`}
                type="password"
                placeholder="Password (tối thiểu 6 ký tự)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearField("password");
                }}
                disabled={loading || !token}
              />
              {errors.password && (
                <p className="field-error">{errors.password}</p>
              )}
            </div>
            <div className="auth-field">
              <input
                className={`auth-input ${errors.confirm ? "input-error" : ""}`}
                type="password"
                placeholder="Xác nhận password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  clearField("confirm");
                }}
                disabled={loading || !token}
              />
              {errors.confirm && (
                <p className="field-error">{errors.confirm}</p>
              )}
            </div>
            <button
              className="auth-button"
              type="submit"
              disabled={loading || !token}
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
