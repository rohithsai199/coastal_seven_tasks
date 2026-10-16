import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { Sparkles, Eye, EyeOff, Lock } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      const detail = err.response?.data?.detail;
      let message = "Login failed. Please check your credentials.";
      if (err.code === "ECONNABORTED" || err.message?.toLowerCase().includes("timeout")) {
        message = "Connection timed out. Please ensure Docker Desktop and backend service are running.";
      } else if (err.message === "Network Error" || !err.response) {
        message = "Cannot connect to server. Please ensure backend service and Docker Desktop are running.";
      } else if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((i) => i.msg).filter(Boolean).join(", ");
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-badge">
              <Sparkles size={12} className="inline mr-1" /> Welcome Back
            </span>
            <h1 className="auth-title">Sign In to ARISE</h1>
            <p className="auth-sub">
              Access your personalized cart, express checkout, and tracked orders.
            </p>
          </div>

          {error && (
            <div className="details-alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input auth-password-input"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-auth-submit"
            >
              {loading ? "Signing in..." : "Sign In to Account"}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account yet?{" "}
            <Link to="/register" className="auth-link">
              Create account
            </Link>
          </p>

          <div className="auth-trust-badge">
            <Lock size={12} />
            <span>256-bit Encrypted & Secure Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;