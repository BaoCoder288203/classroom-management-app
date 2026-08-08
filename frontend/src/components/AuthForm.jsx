import { useState } from "react";
import "../styles/auth.css";

function AuthForm({
  mode,
  authMode = "signin",
  onAuthModeChange,
  onBack,
  onSubmitIdentifier,
  onSubmitOtp,
  onResend,
}) {
  const [step, setStep] = useState("identifier");
  const [value, setValue] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [nameError, setNameError] = useState("");

  const isPhone = mode === "phone";
  const isSignup = authMode === "signup" && isPhone;

  async function handleSubmitIdentifier(e) {
    e.preventDefault();
    setError("");
    setFieldError("");
    setNameError("");

    if (isSignup && !name.trim()) {
      setNameError("Vui lòng nhập tên");
      return;
    }

    if (!value.trim()) {
      setFieldError(
        isPhone ? "Vui lòng nhập số điện thoại" : "Vui lòng nhập email"
      );
      return;
    }
    if (!isPhone && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setFieldError("Email không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      await onSubmitIdentifier(value.trim(), {
        name: name.trim(),
        authMode,
      });
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitOtp(e) {
    e.preventDefault();
    setError("");
    setFieldError("");

    if (!otp.trim()) {
      setFieldError("Vui lòng nhập mã xác thực");
      return;
    }
    if (otp.trim().length < 4) {
      setFieldError("Mã xác thực không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      await onSubmitOtp(otp.trim());
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Mã không đúng");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(e) {
    e.preventDefault();
    setError("");
    try {
      await onResend();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Gửi lại thất bại");
    }
  }

  function switchAuthMode(next) {
    if (onAuthModeChange) onAuthModeChange(next);
    setStep("identifier");
    setOtp("");
    setError("");
    setFieldError("");
    setNameError("");
  }

  if (step === "identifier") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <button className="auth-back" onClick={onBack} type="button">
            ← Back
          </button>
          <h1 className="auth-title">
            {isSignup ? "Instructor Sign Up" : "Sign In"}
          </h1>
          <p className="auth-subtitle">
            {isSignup
              ? "Create an instructor account with your phone"
              : `Please enter your ${isPhone ? "phone" : "email"} to sign in`}
          </p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmitIdentifier} noValidate>
            {isSignup && (
              <div className="auth-field">
                <input
                  className={`auth-input ${nameError ? "input-error" : ""}`}
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  disabled={loading}
                />
                {nameError && <p className="field-error">{nameError}</p>}
              </div>
            )}
            <div className="auth-field">
              <input
                className={`auth-input ${fieldError ? "input-error" : ""}`}
                type={isPhone ? "tel" : "email"}
                placeholder={
                  isPhone ? "Your Phone Number" : "Your Email Address"
                }
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (fieldError) setFieldError("");
                }}
                disabled={loading}
              />
              {fieldError && <p className="field-error">{fieldError}</p>}
            </div>
            <button className="auth-button" disabled={loading} type="submit">
              {loading ? "Sending..." : isSignup ? "Sign up" : "Next"}
            </button>
          </form>

          {isPhone && onAuthModeChange && (
            <p className="auth-footer">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => switchAuthMode("signin")}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => switchAuthMode("signup")}
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          )}

          {!isPhone && (
            <p className="auth-hint">
              Student accounts are created by your instructor.
            </p>
          )}
          {isPhone && !isSignup && (
            <p className="auth-hint">passwordless authentication methods.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button
          className="auth-back"
          onClick={() => {
            setStep("identifier");
            setOtp("");
            setError("");
            setFieldError("");
          }}
          type="button"
        >
          ← Back
        </button>
        <h1 className="auth-title">
          {isPhone ? "Phone verification" : "Email verification"}
        </h1>
        <p className="auth-subtitle">
          Please enter your code that sent to your{" "}
          {isPhone ? "phone" : "email address"}
        </p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmitOtp} noValidate>
          <div className="auth-field">
            <input
              className={`auth-input ${fieldError ? "input-error" : ""}`}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter Your code"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (fieldError) setFieldError("");
              }}
              disabled={loading}
            />
            {fieldError && <p className="field-error">{fieldError}</p>}
          </div>
          <button className="auth-button" disabled={loading} type="submit">
            {loading ? "Verifying..." : "Submit"}
          </button>
        </form>
        <p className="auth-footer">
          Code not receive?{" "}
          <button type="button" className="auth-link" onClick={handleResend}>
            Send again
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthForm;
