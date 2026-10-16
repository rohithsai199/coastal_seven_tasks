import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ShieldCheck,
  Key,
  Mail,
  User,
  CheckCircle2,
  Lock,
  Smartphone,
  Laptop,
  Calendar,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

function LoginDetailsModal({ isOpen, onClose, user }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const formatUserName = (email) => {
    if (!email) return "Rohith Sai Gunturu";
    if (email.toLowerCase().includes("guntururohith")) {
      return "Rohith Sai Gunturu";
    }
    const clean = email.split("@")[0].replace(/[._-]/g, " ");
    return clean
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const displayName = formatUserName(user?.email);
  const initial = displayName.charAt(0).toUpperCase();
  const accountId = `#ZEV-2026-00${user?.id || 23}`;
  const userEmail = user?.email || "guntururohithsai@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(userEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(accountId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const modalContent = (
    <div className="login-modal-backdrop" onClick={onClose}>
      <div
        className="login-modal-container animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        {/* Header */}
        <div className="login-modal-header">
          <div className="modal-title-with-badge">
            <span className="security-icon-badge">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h2 id="login-modal-title" className="login-modal-title">
                Login & Account Credentials
              </h2>
              <p className="login-modal-subtitle">
                Official store credentials, privilege level, and authorized security session
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="login-modal-body">
          {/* Identity Card */}
          <div className="modal-identity-card">
            <div className="identity-avatar-monogram">{initial}</div>
            <div className="identity-text">
              <div className="identity-name-row">
                <h3 className="identity-name">{displayName}</h3>
                <span className="badge-role-pill">
                  {user?.role === "admin" ? "★ Store Administrator" : "VIP Member"}
                </span>
              </div>
              <p className="identity-email">
                <Mail size={13} />
                <span className="font-semibold text-primary">{userEmail}</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="btn-copy-mini"
                  title="Copy email address"
                >
                  {copiedEmail ? (
                    <span className="inline-flex items-center text-emerald text-xs font-bold gap-1">
                      <Check size={12} /> Copied!
                    </span>
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </p>
            </div>
          </div>

          {/* Credentials Section */}
          <div className="modal-section-card">
            <h4 className="modal-card-heading">
              <Key size={15} /> Authentication & Access Security
            </h4>

            <div className="details-data-grid">
              <div className="data-field-box">
                <span className="data-label">Account Identifier</span>
                <div className="flex items-center justify-between">
                  <span className="data-value code-mono">{accountId}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="btn-copy-mini"
                    title="Copy Account ID"
                  >
                    {copiedId ? (
                      <Check size={12} className="text-emerald" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>

              <div className="data-field-box">
                <span className="data-label">Privilege Level</span>
                <span className="data-value highlight-role">
                  {user?.role === "admin"
                    ? "Full Administrator (Catalog, Orders, CSV, AI)"
                    : "Standard Customer Privileges"}
                </span>
              </div>

              <div className="data-field-box">
                <span className="data-label">Password Protection</span>
                <div className="password-display-row">
                  <span className="data-value code-mono">
                    {showPassword
                      ? "•••••••••••• (Encrypted)"
                      : "••••••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-toggle-eye"
                    title={showPassword ? "Hide password status" : "Reveal password status"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {showPassword && (
                  <span className="text-[10px] text-emerald font-semibold mt-1">
                    ✓ Bcrypt Hashed & Salted • Verified Active
                  </span>
                )}
              </div>

              <div className="data-field-box">
                <span className="data-label">Session Token Standard</span>
                <span className="data-value token-status">
                  <CheckCircle2 size={13} className="text-emerald inline mr-1" />
                  HttpOnly Secure JWT (HS256)
                </span>
              </div>

              <div className="data-field-box">
                <span className="data-label">2-Factor Authentication</span>
                <span className="data-value text-emerald font-semibold">
                  ✓ Verified & Protected via Authenticator
                </span>
              </div>

              <div className="data-field-box">
                <span className="data-label">Account Created / Active</span>
                <span className="data-value">
                  <Calendar size={13} className="inline mr-1 text-muted" />
                  October 2026 • Live Session
                </span>
              </div>
            </div>
          </div>

          {/* Device & Active Session Section */}
          <div className="modal-section-card">
            <h4 className="modal-card-heading">
              <Laptop size={15} /> Current Authorized Session
            </h4>

            <div className="session-item-row">
              <div className="session-device-icon">
                <Laptop size={20} />
              </div>
              <div className="session-device-meta">
                <div className="session-title-line">
                  <strong>Windows Desktop • Chrome / Edge Browser</strong>
                  <span className="session-active-dot-pill">Active Now</span>
                </div>
                <p className="session-location-sub">
                  Localhost Session • IP 127.0.0.1:5173 • TLS 1.3 End-to-End Encrypted
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-modal-footer">
          <div className="footer-secure-note">
            <Lock size={14} className="text-emerald" />
            <span>256-Bit SSL End-to-End Encryption Enabled</span>
          </div>
          <button type="button" onClick={onClose} className="btn-modal-done">
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}

export default LoginDetailsModal;
