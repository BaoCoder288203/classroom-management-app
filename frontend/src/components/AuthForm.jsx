import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import "../styles/auth.css";

const OTP_LEN = 6;

function emptyDigits() {
  return Array(OTP_LEN).fill("");
}

function showDebugOtpToast(debugOtp) {
  if (!debugOtp) return;
  toast.success(`Mã OTP (demo): ${debugOtp}`, {
    duration: 20000,
    position: "top-right",
    id: `otp-${debugOtp}`,
  });
}

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
  const [digits, setDigits] = useState(emptyDigits);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [nameError, setNameError] = useState("");
  const inputsRef = useRef([]);
  const submittingRef = useRef(false);

  const isPhone = mode === "phone";
  const isSignup = authMode === "signup" && isPhone;

  useEffect(() => {
    if (step !== "otp") return;
    const t = setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [step]);

  function focusBox(i) {
    const el = inputsRef.current[i];
    if (!el) return;
    el.focus();
    el.select();
  }

  function resetOtpBoxes() {
    setDigits(emptyDigits());
    setTimeout(() => focusBox(0), 0);
  }

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
      const result = await onSubmitIdentifier(value.trim(), {
        name: name.trim(),
        authMode,
      });
      showDebugOtpToast(result?.debugOtp);
      setDigits(emptyDigits());
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(code) {
    if (submittingRef.current || loading) return;

    const cleaned = String(code || "").replace(/\D/g, "");
    if (cleaned.length !== OTP_LEN) {
      setFieldError("Vui lòng nhập đủ 6 số");
      return;
    }

    setError("");
    setFieldError("");
    submittingRef.current = true;
    setLoading(true);
    try {
      await onSubmitOtp(cleaned);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Mã không đúng");
      resetOtpBoxes();
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  function handleSubmitOtp(e) {
    e.preventDefault();
    verifyCode(digits.join(""));
  }

  function handleDigitChange(index, raw) {
    if (fieldError) setFieldError("");
    if (error) setError("");

    const only = String(raw || "").replace(/\D/g, "");
    if (!only) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    const chars = only.slice(0, OTP_LEN - index).split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((ch, k) => {
        next[index + k] = ch;
      });
      const code = next.join("");
      if (code.length === OTP_LEN && /^\d{6}$/.test(code)) {
        queueMicrotask(() => verifyCode(code));
      }
      return next;
    });

    focusBox(Math.min(index + chars.length, OTP_LEN - 1));
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      } else if (index > 0) {
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
        focusBox(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusBox(index - 1);
    }
    if (e.key === "ArrowRight" && index < OTP_LEN - 1) {
      e.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    if (loading) return;
    const text = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, OTP_LEN);
    if (!text) return;

    const next = emptyDigits();
    text.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    setFieldError("");
    setError("");
    focusBox(Math.min(text.length, OTP_LEN) - 1);

    if (text.length === OTP_LEN) {
      queueMicrotask(() => verifyCode(text));
    }
  }

  async function handleResend(e) {
    e.preventDefault();
    setError("");
    try {
      const result = await onResend();
      showDebugOtpToast(result?.debugOtp);
      resetOtpBoxes();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Gửi lại thất bại");
    }
  }

  function switchAuthMode(next) {
    if (onAuthModeChange) onAuthModeChange(next);
    setStep("identifier");
    setDigits(emptyDigits());
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
            setDigits(emptyDigits());
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
            <div className="otp-boxes" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  className={`otp-box ${fieldError || error ? "input-error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={d}
                  disabled={loading}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>
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
