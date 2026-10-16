import { create } from "zustand";

const INITIAL_NOTIFICATIONS = [
  {
    id: 101,
    type: "order",
    title: "Order #ORD-0008 Dispatched",
    message: "Your Tailored Terracotta Clay Blazer is on its way via White-Glove VIP Courier. Signature required.",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18m ago
    read: false,
    link: "/orders",
    actionLabel: "Track Delivery",
  },
  {
    id: 102,
    type: "drop",
    title: "Exclusive Release: Swiss Atelier Collection",
    message: "Handcrafted titanium aviators, Swiss chronographs, and Italian calfskin leather drops are now available.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    read: false,
    link: "/products?category=accessories",
    actionLabel: "Explore Drop",
  },
  {
    id: 103,
    type: "security",
    title: "Authorized Security Session Verified",
    message: "Signed in from Windows Desktop (Chrome • 127.0.0.1) with 256-Bit SSL End-to-End Encryption active.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
    read: true,
    link: null,
    actionLabel: null,
  },
  {
    id: 104,
    type: "wishlist",
    title: "Low Inventory Alert",
    message: "Restorative Botanical Night Repair Cream in your curated collection has only 8 items remaining.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
    read: true,
    link: "/products/21",
    actionLabel: "View Piece",
  },
];

const loadPersistedNotifications = () => {
  if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem("zevana_notifications");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load notifications from storage:", err);
  }
  return INITIAL_NOTIFICATIONS;
};

const saveNotifications = (notifications) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("zevana_notifications", JSON.stringify(notifications));
  } catch (err) {
    console.warn("Storage update error:", err);
  }
};

export const useNotificationStore = create((set, get) => ({
  notifications: loadPersistedNotifications(),

  addNotification: (notification) => {
    const current = get().notifications;
    const newItem = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    };
    const updated = [newItem, ...current].slice(0, 50);
    saveNotifications(updated);
    set({ notifications: updated });
  },

  markAsRead: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
    set({ notifications: updated });
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
    set({ notifications: updated });
  },

  removeNotification: (id) => {
    const updated = get().notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
    set({ notifications: updated });
  },

  clearNotifications: () => {
    try {
      localStorage.removeItem("zevana_notifications");
    } catch {}
    set({ notifications: [] });
  },
}));