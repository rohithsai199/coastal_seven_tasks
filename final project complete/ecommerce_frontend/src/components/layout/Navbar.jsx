import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  LogOut,
  Sparkles,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Shield,
} from "lucide-react";

import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { useAIAssistantStore } from "../../stores/aiAssistantStore";
import { useCategoryStore } from "../../stores/categoryStore";
import { CATEGORY_ITEMS } from "../common/CategoryNavRow";
import NotificationPanel from "../common/NotificationPanel";
import UserProfileMenu from "./UserProfileMenu";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../../services/orderService";

function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore(
    (state) => state.toggleTheme
  );
  const toggleAIAssistant = useAIAssistantStore((state) => state.toggleOpen);

  const activeCategory = useCategoryStore((state) => state.activeCategory);
  const setActiveCategory = useCategoryStore((state) => state.setActiveCategory);

  const navigate = useNavigate();
  const location = useLocation();

  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(event.target)
      ) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setAdminDropdownOpen(false);
  }, [location.pathname, location.search]);

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === "admin";

  const { data: userOrders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        const data = await getOrders();
        return Array.isArray(data) ? data : data.orders || [];
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated && !isAdmin,
    staleTime: 30 * 1000,
  });
  const orderCount = Array.isArray(userOrders) ? userOrders.length : 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat.id);
    if (cat.id === "home") {
      if (location.pathname !== "/") {
        navigate("/");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (
      cat.id === "boys" ||
      cat.id === "girls" ||
      cat.id === "kids" ||
      cat.id === "accessories" ||
      cat.id === "beauty"
    ) {
      if (location.pathname !== "/") {
        navigate("/");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (cat.id === "orders") {
      navigate("/orders");
    } else {
      navigate(`/products?category=${cat.id}&q=${encodeURIComponent(cat.query)}`);
    }
  };

  return (
    <>
      <header className="navbar-modern">
      {/* Main Navbar */}
      <div className="navbar-main-container container">
        {/* Brand Logo Symbol & Name (Casko Luxury Font) */}
        <Link
          to="/"
          onClick={() => setActiveCategory("home")}
          className="navbar-brand j2b-logo-brand"
          aria-label="Arise Home"
        >
          <img
            src="/images/j2b_logo.png"
            alt="Arise Monogram"
            className="navbar-brand-logo-img"
          />
          <span className="navbar-brand-arise-text">ARISE</span>
        </Link>

        {/* Center Category Icons Row (hidden on auth pages like /login, /register) */}
        {!location.pathname.startsWith("/login") && !location.pathname.startsWith("/register") && (
        <div
          className="navbar-category-row"
          role="navigation"
          aria-label="Category Navigation"
        >
          {CATEGORY_ITEMS.map((cat) => {
            // Hide Orders pill for admin users (visible for users only)
            if (cat.id === "orders" && isAdmin) {
              return null;
            }

            const isCatActive =
              (cat.id === "orders" && location.pathname.startsWith("/orders")) ||
              (activeCategory === cat.id && location.pathname === "/");
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`nav-cat-item-btn ${isCatActive ? "active" : ""}`}
                title={`Browse ${cat.label}`}
              >
                <span className="nav-cat-icon">{cat.icon}</span>
                <span className="nav-cat-text">{cat.label}</span>
                {cat.id === "orders" && orderCount > 0 && (
                  <span className="nav-orders-pill-count">{orderCount}</span>
                )}
                {isCatActive && <span className="nav-cat-active-dot" />}
              </button>
            );
          })}

          {/* Admin Dashboard Pill with Dropdown (matching boAt More style) */}
          {isAuthenticated && user?.role === "admin" && (
            <div className="admin-nav-dropdown-wrapper" ref={adminDropdownRef}>
              <button
                type="button"
                onClick={() => setAdminDropdownOpen((prev) => !prev)}
                className={`nav-cat-item-btn admin-cat-pill admin-dropdown-trigger ${
                  isActive("/admin") || adminDropdownOpen ? "active" : ""
                }`}
                title="Admin Management"
                aria-expanded={adminDropdownOpen}
                aria-haspopup="true"
              >
                <span className="nav-cat-text">Admin</span>
                <ChevronDown
                  size={12}
                  className={`admin-chevron-icon ${adminDropdownOpen ? "open" : ""}`}
                />
              </button>

              {adminDropdownOpen && (
                <div className="admin-nav-dropdown-menu animate-fadeIn">
                  <Link
                    to="/admin?tab=orders"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="admin-dropdown-item"
                  >
                    <span className="admin-item-icon">📦</span>
                    <div className="admin-item-text">
                      <strong>Orders</strong>
                      <small>Customer orders & chat</small>
                    </div>
                  </Link>

                  <Link
                    to="/admin?tab=products"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="admin-dropdown-item"
                  >
                    <span className="admin-item-icon">🏷️</span>
                    <div className="admin-item-text">
                      <strong>Products</strong>
                      <small>Catalog & AI descriptions</small>
                    </div>
                  </Link>

                  <Link
                    to="/admin?tab=ui-customizer"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="admin-dropdown-item"
                  >
                    <span className="admin-item-icon">🎨</span>
                    <div className="admin-item-text">
                      <strong>Storefront CMS</strong>
                      <small>Customize Home, Boys, Girls...</small>
                    </div>
                  </Link>

                  <Link
                    to="/admin?tab=bulk-csv"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="admin-dropdown-item"
                  >
                    <span className="admin-item-icon">📄</span>
                    <div className="admin-item-text">
                      <strong>Bulk CSV</strong>
                      <small>Import catalog via CSV</small>
                    </div>
                  </Link>

                  <Link
                    to="/admin?tab=tasks"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="admin-dropdown-item"
                  >
                    <span className="admin-item-icon">⚡</span>
                    <div className="admin-item-text">
                      <strong>Background Tasks</strong>
                      <small>Celery workers & audit</small>
                    </div>
                  </Link>

                  <div className="admin-dropdown-divider" />

                  <Link
                    to="/admin?tab=all"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="admin-dropdown-item admin-dropdown-all"
                  >
                    <span className="admin-item-icon">📊</span>
                    <div className="admin-item-text">
                      <strong>Dashboard Overview</strong>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Right Actions - Compact Size & Black & White */}
        <div className="navbar-actions">
          {/* Ask AI Button - Monochrome Black & White */}
          <button
            type="button"
            onClick={toggleAIAssistant}
            className="nav-action-btn nav-ask-ai-btn"
            title="Ask Aura AI Shopping Concierge"
          >
            <Sparkles size={13} />
            <span>Ask AI</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="nav-action-btn nav-theme-toggle-btn"
            title="Toggle theme"
          >
            {theme === "light" ? (
              <Moon size={15} />
            ) : (
              <Sun size={15} />
            )}
          </button>

          {/* Search */}
          <Link
            to="/products"
            className="nav-action-btn"
            title="Search catalog"
          >
            <Search size={15} />
          </Link>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <NotificationPanel />

              {/* Cart - Symbol Only */}
              <Link
                to="/cart"
                className="nav-action-btn cart-btn-icon"
                title="Your Cart"
              >
                <ShoppingBag size={16} />
              </Link>

              {/* Interactive Luxury Profile Flyout & Account Menu */}
              <UserProfileMenu />

              {/* Logout - Quick Exit */}
              <button
                type="button"
                onClick={handleLogout}
                className="nav-action-btn btn-logout-icon"
                title="Log out"
              >
                <LogOut size={15} />
              </button>
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

      {/* Mobile Bottom Navigation Bar (Hidden on desktop, active on mobile <= 768px) */}
      {!location.pathname.startsWith("/login") && !location.pathname.startsWith("/register") && (
        <nav className="mobile-bottom-nav" aria-label="Mobile Category Navigation">
          {CATEGORY_ITEMS.map((cat) => {
            if (cat.id === "orders" && isAdmin) return null;
            const isCatActive =
              (cat.id === "orders" && location.pathname.startsWith("/orders")) ||
              (activeCategory === cat.id && location.pathname === "/");
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`mobile-bottom-nav-item ${isCatActive ? "active" : ""}`}
                title={`Browse ${cat.label}`}
              >
                <div className="mobile-bottom-nav-icon">{cat.icon}</div>
                <span className="mobile-bottom-nav-label">{cat.label}</span>
                {isCatActive && <span className="mobile-bottom-nav-dot" />}
              </button>
            );
          })}

          {/* Admin Tab for Mobile */}
          {isAuthenticated && isAdmin && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className={`mobile-bottom-nav-item admin-item ${
                location.pathname.startsWith("/admin") ? "active" : ""
              }`}
              title="Admin Dashboard"
            >
              <div className="mobile-bottom-nav-icon">
                <Shield size={19} />
              </div>
              <span className="mobile-bottom-nav-label">Admin</span>
              {location.pathname.startsWith("/admin") && (
                <span className="mobile-bottom-nav-dot" />
              )}
            </button>
          )}
        </nav>
      )}
    </>
  );
}

export default Navbar;
