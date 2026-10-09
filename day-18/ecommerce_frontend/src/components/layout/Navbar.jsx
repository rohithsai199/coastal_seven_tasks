import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  LogOut,
  Sparkles,
  Search,
  Sun,
  Moon,
} from "lucide-react";

import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import NotificationPanel from "../common/NotificationPanel";

function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore(
    (state) => state.toggleTheme
  );

  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = Boolean(user);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-modern">
      {/* Announcement Bar */}
      <div className="navbar-announcement-bar">
        <div className="container announcement-content">
          <span>
            ✨ <strong>SUMMER DROP 2026</strong>: Get 20% OFF on all
            Wireless Tech with code{" "}
            <strong>AURORA20</strong>
          </span>

          <span className="announcement-right">
            ⚡ Free Global Express Shipping on $50+
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="navbar-main-container container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <span className="brand-badge-icon">
            <Sparkles size={18} />
          </span>

          <span className="brand-text">
            ShopStore
          </span>
        </Link>

        {/* Center Navigation */}
        <nav className="navbar-nav-links">
          <Link
            to="/"
            className={`nav-link ${
              isActive("/") ? "active" : ""
            }`}
          >
            Home
          </Link>

          <Link
            to="/products"
            className={`nav-link ${
              isActive("/products") ? "active" : ""
            }`}
          >
            Explore Catalog
          </Link>

          {isAuthenticated && (
            <Link
              to="/orders"
              className={`nav-link ${
                isActive("/orders") ? "active" : ""
              }`}
            >
              My Orders
            </Link>
          )}

          {isAuthenticated && user?.role === "admin" && (
            <Link
              to="/admin"
              className={`nav-link ${
                isActive("/admin") ? "active" : ""
              }`}
              style={{
                color: "#00B894",
                fontWeight: "bold",
              }}
            >
              Admin Dashboard
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="nav-action-btn"
            title="Toggle theme"
          >
            {theme === "light" ? (
              <Moon size={19} />
            ) : (
              <Sun size={19} />
            )}
          </button>

          {/* Search */}
          <Link
            to="/products"
            className="nav-action-btn"
            title="Search catalog"
          >
            <Search size={19} />
          </Link>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <NotificationPanel />

              {/* Cart */}
              <Link
                to="/cart"
                className="nav-action-btn cart-btn-badge"
                title="Your Cart"
              >
                <ShoppingBag size={20} />
                <span className="cart-label">
                  Cart
                </span>
              </Link>

              {/* User */}
              <div className="user-dropdown-wrapper">
                <div className="user-avatar-pill">
                  <div className="avatar-circle">
                    {user?.email
                      ? user.email
                          .charAt(0)
                          .toUpperCase()
                      : "U"}
                  </div>

                  <span className="user-email-text">
                    {user?.email?.split("@")[0]}
                  </span>
                </div>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-logout-pill"
                  title="Log out"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            /* Logged Out */
            <div className="auth-buttons-group">
              <Link
                to="/login"
                className="btn-nav-login"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="btn-nav-register"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
