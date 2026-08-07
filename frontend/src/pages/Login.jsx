import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("instructor");
  const [step, setStep] = useState("input");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function switchMode(nextMode) {
    setMode(nextMode);
    setStep("input");
    setOtp("");
    setError("");
    setMessage("");
  }

  function backToInput() {
    setStep("input");
    setOtp("");
    setError("");
    setMessage("");
  }

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "instructor") {
        if (!phoneNumber.trim()) {
          setError("Vui lòng nhập số điện thoại");
          return;
        }
        const res = await api.post("/api/auth/createAccessCode", {
          phoneNumber: phoneNumber.trim(),
        });
        setMessage(res.data.message || "Đã gửi mã truy cập");
      } else {
        if (!email.trim()) {
          setError("Vui lòng nhập email");
          return;
        }
        const res = await api.post("/api/student/loginEmail", {
          email: email.trim(),
        });
        setMessage(res.data.message || "Đã gửi mã qua email");
      }
      setStep("otp");
    } catch (err) {
      setError(
        err.response?.data?.message || "Không gửi được mã. Thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!otp.trim()) {
        setError("Vui lòng nhập mã OTP");
        return;
      }

      let res;
      if (mode === "instructor") {
        res = await api.post("/api/auth/validateAccessCode", {
          phoneNumber: phoneNumber.trim(),
          accessCode: otp.trim(),
        });
      } else {
        res = await api.post("/api/student/validateAccessCode", {
          email: email.trim(),
          accessCode: otp.trim(),
        });
      }

      const { token, role } = res.data;
      const finalRole = role || (mode === "instructor" ? "instructor" : "student");

      localStorage.setItem("token", token);
      localStorage.setItem("role", finalRole);

      if (finalRole === "instructor") {
        navigate("/instructor");
      } else {
        navigate("/student");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Mã không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Classroom App</h1>
        <p className="login-sub">Đăng nhập bằng mã OTP</p>

        <div className="tabs">
          <button
            type="button"
            className={mode === "instructor" ? "tab active" : "tab"}
            onClick={() => switchMode("instructor")}
          >
            Instructor
          </button>
          <button
            type="button"
            className={mode === "student" ? "tab active" : "tab"}
            onClick={() => switchMode("student")}
          >
            Student
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert ok">{message}</div>}

        {step === "input" ? (
          <form onSubmit={handleSendCode}>
            {mode === "instructor" ? (
              <label>
                Số điện thoại
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0901234567"
                  disabled={loading}
                />
              </label>
            ) : (
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  disabled={loading}
                />
              </label>
            )}
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi mã"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p className="hint">
              {mode === "instructor"
                ? `Mã đã gửi tới SĐT ${phoneNumber}`
                : `Mã đã gửi tới email ${email}`}
            </p>
            <label>
              Mã OTP (6 số)
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                disabled={loading}
              />
            </label>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Đang xác nhận..." : "Xác nhận"}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={backToInput}
              disabled={loading}
            >
              Quay lại
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
