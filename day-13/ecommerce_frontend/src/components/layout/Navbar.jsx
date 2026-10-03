import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  User,
  LogOut,
  Package,
  Sparkles,
  Search,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-modern">
      <div className="navbar-announcement-bar">
        <div className="container announcement-content">
          <span>✨ <strong>SUMMER DROP 2026</strong>: Get 20% OFF on all Wireless Tech with code <strong>AURORA20</strong></span>
          <span className="announcement-right">⚡ Free Global Express Shipping on $50+</span>
        </div>
      </div>

      <div className="navbar-main-container container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <span className="brand-badge-icon">
            <Sparkles size={18} />
          </span>
          <span className="brand-text">ShopStore</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="navbar-nav-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            Home
          </Link>
          <Link
            to="/products"
            className={`nav-link ${isActive("/products") ? "active" : ""}`}
          >
            Explore Catalog
          </Link>
          {isAuthenticated && (
            <Link
              to="/orders"
              className={`nav-link ${isActive("/orders") ? "active" : ""}`}
            >
              My Orders
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          <Link to="/products" className="nav-action-btn" title="Search catalog">
            <Search size={19} />
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/cart"
                className="nav-action-btn cart-btn-badge"
                title="Your Cart"
              >
                <ShoppingBag size={20} />
                <span className="cart-label">Cart</span>
              </Link>

              <div className="user-dropdown-wrapper">
                <div className="user-avatar-pill">
                  <div className="avatar-circle">
                    {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="user-email-text">{user?.email?.split("@")[0]}</span>
                </div>

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
            <div className="auth-buttons-group">
              <Link to="/login" className="btn-nav-login">
                Sign In
              </Link>
              <Link to="/register" className="btn-nav-register">
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