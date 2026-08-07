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
      navigate("/instructor", { replace: true });
    } else if (user.role === "student") {
      navigate("/student", { replace: true });
    }
  }, [user, navigate]);

  if (view === "choose") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Classroom App</h1>
          <p className="auth-subtitle">Choose how you want to sign in</p>
          <button
            type="button"
            className="auth-button"
            style={{ marginBottom: 12 }}
            onClick={() => {
              setIdentifier("");
              setView("instructor");
            }}
          >
            Sign in as Instructor
          </button>
          <button
            type="button"
            className="auth-button secondary"
            onClick={() => {
              setIdentifier("");
              setView("student");
            }}
          >
            Sign in as Student
          </button>
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
          const { token, role } = res.data;
          const finalRole = role || "instructor";
          login(token, finalRole, identifier);
          navigate(finalRole === "instructor" ? "/instructor" : "/student");
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
        navigate(finalRole === "student" ? "/student" : "/instructor");
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
