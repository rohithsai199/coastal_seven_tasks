import { create } from "zustand";

export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          id: Date.now(),
          createdAt: new Date().toISOString(),
          ...notification,
        },
        ...state.notifications,
      ].slice(0, 50),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id
      ),
    })),

  clearNotifications: () =>
    set({
      notifications: [],
    }),
}));