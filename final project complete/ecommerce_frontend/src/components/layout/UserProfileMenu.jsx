import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Heart,
  ShoppingBag,
  Package,
  ShieldCheck,
  Key,
  MapPin,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useWishlistStore } from "../../stores/wishlistStore";
import { useCartStore } from "../../stores/cartStore";
import { useThemeStore } from "../../stores/themeStore";
import LoginDetailsModal from "./LoginDetailsModal";
import WishlistDrawer from "./WishlistDrawer";
import SavedAddressesModal from "./SavedAddressesModal";
import "./userProfile.css";

function UserProfileMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const wishlist = useWishlistStore((state) => state.wishlist);
  const cart = useCartStore((state) => state.cart);

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/login");
  };

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const formatUserName = (email) => {
    if (!email) return "Gautam";
    if (email.toLowerCase().includes("guntururohith")) {
      return "Rohith Sai Gunturu";
    }
    const clean = email.split("@")[0].replace(/[._-]/g, " ");
    return clean
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "G";
  const capitalizedName = formatUserName(user?.email);

  const cartCount = Array.isArray(cart)
    ? cart.reduce((acc, item) => acc + (item.quantity || 1), 0)
    : 0;

  return (
    <div className="profile-menu-container" ref={menuRef}>
      {/* Avatar Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`nav-avatar-btn ${isOpen ? "active" : ""}`}
        aria-label="User Account Menu"
        aria-expanded={isOpen}
        title={`Profile: ${user?.email || "Account"}`}
      >
        <span className="avatar-monogram">{initial}</span>
        <span className="avatar-pulse-ring" />
      </button>

      {/* Luxury Profile Flyout Popover */}
      {isOpen && (
        <div className="profile-flyout-popover animate-popoverIn">
          {/* Header Identity Card */}
          <div className="profile-card-header">
            <div className="profile-header-top">
              <div className="profile-avatar-large">
                <span>{initial}</span>
              </div>
              <div className="profile-meta-block">
                <div className="profile-name-row">
                  <h3 className="profile-user-name">{capitalizedName}</h3>
                  <span className="profile-role-tag">
                    {user?.role === "admin" ? "Admin" : "VIP"}
                  </span>
                </div>
                <div className="profile-email-row" onClick={handleCopyEmail} title="Click to copy email">
                  <span className="profile-user-email">{user?.email || "user@zevana.luxury"}</span>
                  <span className="copy-icon-wrap">
                    {copiedEmail ? <Check size={11} className="text-emerald" /> : <Copy size={11} />}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Pill Row */}
            <div className="profile-stats-row">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowWishlistDrawer(true);
                }}
                className="profile-stat-pill"
                title="View your saved wishlist"
              >
                <Heart size={13} className="text-coral fill-current" />
                <span className="stat-count">{wishlist.length}</span>
                <span className="stat-label">Wishlist</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/orders");
                }}
                className="profile-stat-pill"
                title="View purchase history"
              >
                <Package size={13} className="text-purple" />
                <span className="stat-count">Orders</span>
                <span className="stat-label">History</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/cart");
                }}
                className="profile-stat-pill"
                title="View shopping bag"
              >
                <ShoppingBag size={13} className="text-emerald" />
                <span className="stat-count">{cartCount}</span>
                <span className="stat-label">Bag</span>
              </button>
            </div>
          </div>

          <div className="profile-menu-divider" />

          {/* Core Action Menu Items */}
          <div className="profile-menu-items-group">
            {/* 1. Login Details */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowLoginModal(true);
              }}
              className="profile-menu-item"
            >
              <div className="menu-item-icon-box bg-purple-soft">
                <Key size={16} className="text-purple" />
              </div>
              <div className="menu-item-text">
                <span className="item-main-title">Login Details & Security</span>
                <span className="item-sub-desc">Credentials, password status, active session</span>
              </div>
              <ChevronRight size={15} className="item-arrow-icon" />
            </button>

            {/* 2. My Wishlist */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowWishlistDrawer(true);
              }}
              className="profile-menu-item"
            >
              <div className="menu-item-icon-box bg-coral-soft">
                <Heart size={16} className="text-coral" />
              </div>
              <div className="menu-item-text">
                <div className="item-title-with-badge">
                  <span className="item-main-title">My Wishlist</span>
                  <span className="badge-count-pill">{wishlist.length}</span>
                </div>
                <span className="item-sub-desc">Saved items, quick move to cart</span>
              </div>
              <ChevronRight size={15} className="item-arrow-icon" />
            </button>

            {/* 3. My Orders */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/orders");
              }}
              className="profile-menu-item"
            >
              <div className="menu-item-icon-box bg-indigo-soft">
                <Package size={16} className="text-indigo" />
              </div>
              <div className="menu-item-text">
                <span className="item-main-title">My Orders & Tracking</span>
                <span className="item-sub-desc">Live delivery status & downloadable invoices</span>
              </div>
              <ChevronRight size={15} className="item-arrow-icon" />
            </button>

            {/* 4. Delivery Addresses */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowAddressModal(true);
              }}
              className="profile-menu-item"
            >
              <div className="menu-item-icon-box bg-emerald-soft">
                <MapPin size={16} className="text-emerald" />
              </div>
              <div className="menu-item-text">
                <span className="item-main-title">Addresses & Delivery</span>
                <span className="item-sub-desc">Primary residence, white-glove shipping</span>
              </div>
              <ChevronRight size={15} className="item-arrow-icon" />
            </button>

            {/* Admin Quick Jump (If user is admin) */}
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin");
                }}
                className="profile-menu-item"
              >
                <div className="menu-item-icon-box bg-yellow-soft">
                  <Layers size={16} className="text-yellow" />
                </div>
                <div className="menu-item-text">
                  <span className="item-main-title">Admin Management</span>
                  <span className="item-sub-desc">Manage catalog, orders, CSV pipelines</span>
                </div>
                <ChevronRight size={15} className="item-arrow-icon" />
              </button>
            )}

            {/* 5. Theme Toggle Inside Profile */}
            <button
              type="button"
              onClick={toggleTheme}
              className="profile-menu-item"
            >
              <div className="menu-item-icon-box bg-theme-soft">
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div className="menu-item-text">
                <span className="item-main-title">Store Theme</span>
                <span className="item-sub-desc">
                  Currently {theme === "light" ? "Light Mode" : "Dark Mode"}
                </span>
              </div>
              <span className="theme-toggle-pill-text">
                {theme === "light" ? "Switch to Dark" : "Switch to Light"}
              </span>
            </button>
          </div>

          <div className="profile-menu-divider" />

          {/* Footer Sign Out */}
          <div className="profile-menu-footer">
            <button
              type="button"
              onClick={handleLogout}
              className="btn-profile-logout"
            >
              <LogOut size={15} />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Login & Security Details Modal */}
      <LoginDetailsModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        user={user}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={showWishlistDrawer}
        onClose={() => setShowWishlistDrawer(false)}
      />

      {/* Saved Addresses Modal */}
      <SavedAddressesModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        user={user}
      />
    </div>
  );
}

export default UserProfileMenu;
