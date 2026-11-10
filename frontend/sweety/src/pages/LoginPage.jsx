import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, HeartPulse, ShieldCheck } from "lucide-react";

import consultationImage from "@/assets/care-consultation.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  function switchMode(registerMode) {
    setIsRegister(registerMode);
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          role: "patient",
        });
      } else {
        await login(email.trim(), password);
      }
      navigate("/home", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (!err?.response || err?.code === "ECONNABORTED"
          ? "Could not connect to the server. Make sure the backend is running on http://localhost:5000."
          : "Invalid email or password. Please try again.");
      setNotice(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-label="A doctor talking with a patient">
        <img
          className="auth-visual__image"
          src={consultationImage}
          alt="A doctor listening to her patient during a consultation"
          width={1600}
          height={1200}
          fetchPriority="high"
        />
        <div className="auth-visual__brand" aria-label="Patient portal">
          <span className="auth-visual__brand-mark" aria-hidden="true">
            <HeartPulse size={20} strokeWidth={1.8} />
          </span>
          <span className="auth-visual__brand-name">Patient portal</span>
        </div>
        <div className="auth-visual__copy">
          <p className="auth-visual__eyebrow">Your health, in good hands</p>
          <h2 className="auth-visual__headline">A little closer to better care.</h2>
          <p className="auth-visual__support">
            A simple place to stay connected with your care, whenever you need it.
          </p>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel__inner">
          <div className="auth-panel__mobile-brand">
            <span className="auth-panel__mobile-brand-mark" aria-hidden="true">
              <HeartPulse size={18} strokeWidth={1.8} />
            </span>
            <span>Patient portal</span>
          </div>

          <h1 className="auth-form-title" id="auth-title">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="auth-form-description">
            {isRegister
              ? "Enter your details to get started."
              : "Sign in to continue to your patient portal."}
          </p>

          <div className="auth-mode-switch" role="tablist" aria-label="Account access">
            <button
              className="auth-mode-button"
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => switchMode(false)}
            >
              Sign in
            </button>
            <button
              className="auth-mode-button"
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => switchMode(true)}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="first-name">
                    First name
                  </label>
                  <Input
                    className="auth-input"
                    id="first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="last-name">
                    Last name
                  </label>
                  <Input
                    className="auth-input"
                    id="last-name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email address
              </label>
              <Input
                className="auth-input"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <div className="auth-input-wrap">
                <Input
                  className="auth-input auth-input--password"
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder="Enter your password"
                  minLength={isRegister ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  className="auth-password-toggle"
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {isRegister && (
                <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
              )}
            </div>

            {notice && (
              <p className="auth-feedback" role="status">
                {notice}
              </p>
            )}

            <Button className="auth-submit" type="submit" size="lg" disabled={submitting}>
              {submitting
                ? isRegister
                  ? "Creating account..."
                  : "Signing in..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="auth-switch-copy">
            {isRegister ? "Already have an account? " : "New to the patient portal? "}
            <button
              className="auth-text-button"
              type="button"
              onClick={() => switchMode(!isRegister)}
            >
              {isRegister ? "Sign in" : "Create account"}
            </button>
          </p>

          <p className="auth-form-footer">
            <ShieldCheck className="mr-1 inline-block size-4 align-text-bottom" aria-hidden="true" />
            Your health information deserves care and privacy.
          </p>
        </div>
      </section>
    </main>
  );
}
