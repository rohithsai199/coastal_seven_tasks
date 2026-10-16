import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../stores/authStore";
import {
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(70, "Full name cannot exceed 70 characters")
      .regex(
        /^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/,
        "Name can only contain letters, spaces, hyphens, and apostrophes"
      ),

    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/.test(val),
        "Please enter a valid phone number (e.g. +1 555-0199 or +91 9876543210)"
      ),

    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Please enter a valid email address (e.g. name@example.com)"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters")
      .regex(/[A-Za-z]/, "Password must include at least one letter")
      .regex(/[0-9]/, "Password must include at least one number"),

    confirmPassword: z
      .string()
      .min(1, "Please re-enter your password"),

    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, "You must agree to the Terms of Service to create an account"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);

  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: true,
    },
  });

  const passwordValue = watch("password") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";
  const passwordsMatch =
    confirmPasswordValue.length > 0 &&
    passwordValue === confirmPasswordValue &&
    !errors.confirmPassword;

  const onSubmit = async (data) => {
    setServerError("");
    setSuccess("");

    try {
      await register({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      // Save user profile details locally for instant personalization across the app
      if (typeof window !== "undefined") {
        localStorage.setItem("user_full_name", data.fullName.trim());
        if (data.phone && data.phone.trim()) {
          localStorage.setItem("user_phone", data.phone.trim());
        }
      }

      setSuccess("Account created successfully! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      const detail = err.response?.data?.detail;
      let message = "Registration failed. Please try again.";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((i) => i.msg).filter(Boolean).join(", ");
      } else if (err.message) {
        message = err.message;
      }
      setServerError(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <span className="auth-badge">
              <Sparkles size={12} className="inline mr-1" /> Get Started
            </span>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-sub">
              Join ARISE and unlock exclusive member benefits, express checkout, and order tracking.
            </p>
          </div>

          {serverError && (
            <div className="details-alert alert-error">
              {serverError}
            </div>
          )}

          {success && (
            <div className="details-alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  className={`form-input ${errors.fullName ? "input-error" : ""}`}
                  autoComplete="name"
                  {...formRegister("fullName")}
                />
                {errors.fullName && (
                  <p className="form-field-error">
                    <AlertCircle size={12} className="inline mr-1" />
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Mobile Number <span style={{ textTransform: "none", fontWeight: 400, color: "#71717A" }}>(Optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className={`form-input ${errors.phone ? "input-error" : ""}`}
                  autoComplete="tel"
                  {...formRegister("phone")}
                />
                {errors.phone && (
                  <p className="form-field-error">
                    <AlertCircle size={12} className="inline mr-1" />
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className={`form-input ${errors.email ? "input-error" : ""}`}
                autoComplete="email"
                {...formRegister("email")}
              />
              {errors.email && (
                <p className="form-field-error">
                  <AlertCircle size={12} className="inline mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password *
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className={`form-input auth-password-input ${errors.password ? "input-error" : ""}`}
                    autoComplete="new-password"
                    {...formRegister("password")}
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
                {errors.password ? (
                  <p className="form-field-error">
                    <AlertCircle size={12} className="inline mr-1" />
                    {errors.password.message}
                  </p>
                ) : (
                  <p className="form-hint">At least 8 chars with 1 letter & 1 number</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password *
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    className={`form-input auth-password-input ${errors.confirmPassword ? "input-error" : ""}`}
                    autoComplete="new-password"
                    {...formRegister("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p className="form-field-error">
                    <AlertCircle size={12} className="inline mr-1" />
                    {errors.confirmPassword.message}
                  </p>
                ) : (
                  confirmPasswordValue && (
                    <div className="form-hint form-hint-success">
                      <CheckCircle2 size={12} className="inline mr-1" /> Passwords match
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-checkbox-group">
                <input
                  type="checkbox"
                  className="form-checkbox-input"
                  {...formRegister("agreeToTerms")}
                />
                <span className="form-checkbox-label">
                  I agree to ARISE's <strong>Terms of Service</strong> & <strong>Privacy Policy</strong> and would like to receive private member drops and alerts.
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="form-field-error">
                  <AlertCircle size={12} className="inline mr-1" />
                  {errors.agreeToTerms.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-auth-submit"
            >
              {isSubmitting ? "Creating account..." : "Create Free Account"}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
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

export default Register;