import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import AuthForm from "../components/AuthForm";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [view, setView] = useState("choose");
  const [identifier, setIdentifier] = useState("");
  const [authMode, setAuthMode] = useState("signin");

  useEffect(() => {
    if (!user) return;
    if (user.role === "instructor") {
      navigate("/instructor/students", { replace: true });
    } else if (user.role === "student") {
      navigate("/student/lessons", { replace: true });
    }
  }, [user, navigate]);

  if (view === "choose") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-mark">C</div>
            <h1 className="auth-brand-name">Classroom</h1>
          </div>
          <p className="auth-subtitle">Choose how you want to sign in</p>
          <div className="auth-role-grid">
            <button
              type="button"
              className="auth-role-card"
              onClick={() => {
                setIdentifier("");
                setAuthMode("signin");
                setView("instructor");
              }}
            >
              <strong>Instructor</strong>
              <span>Phone OTP · sign in or sign up</span>
            </button>
            <button
              type="button"
              className="auth-role-card"
              onClick={() => {
                setIdentifier("");
                setView("student");
              }}
            >
              <strong>Student</strong>
              <span>Email OTP · invited by instructor</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "instructor") {
    return (
      <AuthForm
        mode="phone"
        authMode={authMode}
        onAuthModeChange={setAuthMode}
        onBack={() => {
          setIdentifier("");
          setAuthMode("signin");
          setView("choose");
        }}
        onSubmitIdentifier={async (phoneNumber, meta) => {
          setIdentifier(phoneNumber);
          if (meta?.authMode === "signup") {
            const res = await api.post("/api/auth/instructorSignup", {
              phoneNumber,
              name: meta.name || "",
            });
            return res.data;
          }
          const res = await api.post("/api/auth/createAccessCode", {
            phoneNumber,
          });
          return res.data;
        }}
        onSubmitOtp={async (accessCode) => {
          const res = await api.post("/api/auth/validateAccessCode", {
            phoneNumber: identifier,
            accessCode,
          });
          const { token, role, phone } = res.data;
          if (role !== "instructor") {
            throw new Error("Tài khoản không phải instructor");
          }
          login(token, role, phone || identifier);
          navigate("/instructor/students");
        }}
        onResend={async () => {
          const res = await api.post("/api/auth/createAccessCode", {
            phoneNumber: identifier,
          });
          return res.data;
        }}
      />
    );
  }

  return (
    <AuthForm
      mode="email"
      onBack={() => {
        setIdentifier("");
        setView("choose");
      }}
      onSubmitIdentifier={async (email) => {
        setIdentifier(email);
        const res = await api.post("/api/student/loginEmail", { email });
        return res.data;
      }}
      onSubmitOtp={async (accessCode) => {
        const res = await api.post("/api/student/validateAccessCode", {
          email: identifier,
          accessCode,
        });
        const { token, role } = res.data;
        const finalRole = role || "student";
        login(token, finalRole, identifier);
        navigate(
          finalRole === "student"
            ? "/student/lessons"
            : "/instructor/students"
        );
      }}
      onResend={async () => {
        const res = await api.post("/api/student/loginEmail", {
          email: identifier,
        });
        return res.data;
      }}
    />
  );
}

export default Login;
