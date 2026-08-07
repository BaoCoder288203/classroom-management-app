import { useState } from "react";
import "../styles/auth.css";

function AuthForm({
  mode,
  onBack,
  onSubmitIdentifier,
  onSubmitOtp,
  onResend,
}) {
  const [step, setStep] = useState("identifier");
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPhone = mode === "phone";

  async function handleSubmitIdentifier(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmitIdentifier(value.trim());
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

  if (step === "identifier") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <button className="auth-back" onClick={onBack} type="button">
            ← Back
          </button>
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">
            Please enter your {isPhone ? "phone" : "email"} to sign in
          </p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmitIdentifier}>
            <input
              className="auth-input"
              type={isPhone ? "tel" : "email"}
              placeholder={
                isPhone ? "Your Phone Number" : "Your Email Address"
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
              required
            />
            <button className="auth-button" disabled={loading} type="submit">
              {loading ? "Sending..." : "Next"}
            </button>
          </form>
          <p className="auth-hint">passwordless authentication methods.</p>
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
          }}
          type="button"
        >
          ← Back
        </button>
        <h1 className="auth-title">
          {isPhone ? "Phone verification" : "Email verification"}
        </h1>
        <p className="auth-subtitle">
          Please enter your code that send to your{" "}
          {isPhone ? "phone" : "email address"}
        </p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmitOtp}>
          <input
            className="auth-input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter Your code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={loading}
            required
          />
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
