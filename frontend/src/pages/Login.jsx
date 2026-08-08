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
                setView("instructor");
              }}
            >
              <strong>Instructor</strong>
              <span>Phone OTP · manage students & lessons</span>
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
              <span>Email OTP · lessons, chat & profile</span>
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
        onBack={() => {
          setIdentifier("");
          setView("choose");
        }}
        onSubmitIdentifier={async (phoneNumber) => {
          setIdentifier(phoneNumber);
          await api.post("/api/auth/createAccessCode", {
            phoneNumber,
          });
        }}
        onSubmitOtp={async (accessCode) => {
          const res = await api.post("/api/auth/validateAccessCode", {
            phoneNumber: identifier,
            accessCode,
          });
          const { token, role, phone } = res.data;
          const finalRole = role || "instructor";
          login(token, finalRole, phone || identifier);
          navigate(
            finalRole === "instructor"
              ? "/instructor/students"
              : "/student/lessons"
          );
        }}
        onResend={async () => {
          await api.post("/api/auth/createAccessCode", {
            phoneNumber: identifier,
          });
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
        await api.post("/api/student/loginEmail", { email });
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
        await api.post("/api/student/loginEmail", {
          email: identifier,
        });
      }}
    />
  );
}

export default Login;
