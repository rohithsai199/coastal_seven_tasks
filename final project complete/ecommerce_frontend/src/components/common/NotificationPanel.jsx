import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Package,
  Sparkles,
  ShieldCheck,
  Heart,
  MessageCircle,
  CheckCheck,
  Trash2,
  ArrowRight,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useNotificationStore } from "../../stores/notificationStore";
import "./notificationPanel.css";

function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Filtered Notifications based on selected tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === "ALL") return notifications;
    if (activeTab === "ORDERS") {
      return notifications.filter((n) => n.type === "order");
    }
    if (activeTab === "DROPS") {
      return notifications.filter((n) => n.type === "drop" || n.type === "wishlist");
    }
    if (activeTab === "SECURITY") {
      return notifications.filter((n) => n.type === "security" || n.type === "chat");
    }
    return notifications;
  }, [notifications, activeTab]);

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "Recently";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "Recently";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "order":
        return (
          <div className="notif-icon-badge badge-order">
            <Package size={17} />
          </div>
        );
      case "drop":
        return (
          <div className="notif-icon-badge badge-drop">
            <Sparkles size={17} />
          </div>
        );
      case "security":
        return (
          <div className="notif-icon-badge badge-security">
            <ShieldCheck size={17} />
          </div>
        );
      case "wishlist":
        return (
          <div className="notif-icon-badge badge-wishlist">
            <Heart size={17} />
          </div>
        );
      case "chat":
        return (
          <div className="notif-icon-badge badge-chat">
            <MessageCircle size={17} />
          </div>
        );
      default:
        return (
          <div className="notif-icon-badge badge-order">
            <Bell size={17} />
          </div>
        );
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setOpen(false);
      navigate(notification.link);
    }
  };

  return (
    <div className="notification-hub-container" ref={panelRef}>
      {/* Exact Bell Trigger Icon (Unchanged Icon per User Request) */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`nav-action-btn ${open ? "active" : ""}`}
        title="Notifications"
        aria-label="View notifications"
        aria-expanded={open}
      >
        <Bell size={15} />

        {unreadCount > 0 && (
          <>
            <span className="notification-bell-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            <span className="bell-pulse-ring" />
          </>
        )}
      </button>

      {/* Luxury Flyout Popover */}
      {open && (
        <div className="notification-popover-flyout animate-popoverIn" role="dialog" aria-label="Notifications">
          {/* Header */}
          <div className="notification-popover-header">
            <div className="notification-header-topline">
              <div className="notification-title-block">
                <h3 className="notification-title-main">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="unread-count-pill">
                    {unreadCount} New
                  </span>
                )}
              </div>

              <div className="notification-header-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="btn-notif-action"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={13} />
                    <span>Read all</span>
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="btn-notif-action"
                    title="Clear all notifications"
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="notification-filter-tabs">
              {[
                { id: "ALL", label: "All" },
                { id: "ORDERS", label: "Orders" },
                { id: "DROPS", label: "Atelier Drops" },
                { id: "SECURITY", label: "Security" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`notif-filter-tab ${activeTab === tab.id ? "active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Scroll Stream */}
          <div className="notification-items-scroll">
            {filteredNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon-wrap">
                  <Bell size={24} />
                </div>
                <h4 className="notif-empty-title">All Caught Up</h4>
                <p className="notif-empty-desc">
                  You're up to date! There are no new order dispatches, security notices, or drop alerts right now.
                </p>
                <Link
                  to="/products"
                  onClick={() => setOpen(false)}
                  className="btn-notif-explore"
                >
                  <span>Explore Collections</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item-card ${n.read ? "read" : "unread"}`}
                  onClick={() => handleItemClick(n)}
                >
                  {getNotificationIcon(n.type)}

                  <div className="notif-item-body">
                    <div className="notif-item-headline">
                      <h4 className="notif-item-title">{n.title}</h4>
                      <span className="notif-item-time">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="notif-item-desc">{n.message}</p>

                    <div className="notif-action-pill-row">
                      {n.link && (
                        <span className="notif-action-link-pill">
                          {n.actionLabel || "View Details"}
                          <ArrowRight size={11} />
                        </span>
                      )}

                      {!n.read && <span className="notif-unread-dot" title="Unread" />}
                    </div>
                  </div>

                  {/* Individual Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n.id);
                    }}
                    className="btn-remove-notif"
                    title="Dismiss notification"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="notification-popover-footer">
            <div className="footer-secure-tag">
              <ShieldCheck size={13} className="text-emerald" />
              <span>Real-time Storefront Telemetry</span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-notif-action"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;