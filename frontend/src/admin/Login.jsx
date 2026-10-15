import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo, Field, ErrorMessage } from "../components/UI";
import { errorText } from "../services/api";
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  if (user) return <Navigate to="/admin/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (new TextEncoder().encode(form.password).length > 72) {
      setError("Password must not exceed 72 UTF-8 bytes.");
      return;
    }
    setBusy(true);
    try {
      await login(form);
      const from = location.state?.from;
      navigate(from?.startsWith("/admin/") ? from : "/admin/dashboard", {
        replace: true,
      });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login-page">
      <Link to="/" className="login-brand">
        <Logo />
      </Link>
      <div className="login-card">
        <span className="reason-icon">
          <LockKeyhole size={25} />
        </span>
        <div className="eyebrow">HONEYBEE ADMINISTRATION</div>
        <h1>Welcome back.</h1>
        <p>Sign in to take care of your collection.</p>
        <form onSubmit={submit}>
          <ErrorMessage message={error} />
          <Field label="Username or email">
            <input
              autoComplete="username"
              required
              maxLength={254}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </Field>
          <Field label="Password">
            <span className="password-input">
              <input
                autoComplete="current-password"
                type={show ? "text" : "password"}
                required
                maxLength={72}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </span>
          </Field>
          <button className="button button-gold button-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in securely"}
          </button>
        </form>
      </div>
      <Link className="text-link" to="/">
        <ArrowLeft size={15} />
        Back to the shop
      </Link>
    </main>
  );
}
