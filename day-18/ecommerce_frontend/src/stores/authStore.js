import { create } from "zustand";
import {
  login as loginRequest,
  signup as signupRequest,
  getCurrentUser,
} from "../services/authService";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  initializeAuth: async () => {
    try {
      const currentUser = await getCurrentUser({ skipAuthRedirect: true });

      set({
        user: currentUser,
        loading: false,
      });
    } catch (error) {
      console.error("Authentication initialization failed:", error);

      set({
        user: null,
        loading: false,
      });
    }
  },

  login: async (email, password) => {
    set({ loading: true });

    try {
      const data = await loginRequest(email, password);

      if (!data) {
        throw new Error("Login failed");
      }

      if (data.access_token && typeof window !== "undefined") {
        localStorage.setItem("access_token", data.access_token);
      }

      const currentUser = await getCurrentUser();

      set({
        user: currentUser,
        loading: false,
      });

      return currentUser;
    } catch (error) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }
      set({
        user: null,
        loading: false,
      });

      throw error;
    }
  },

  register: async (userData) => {
    return await signupRequest(userData);
  },

  logout: async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }
      const { default: api } = await import("../services/api");
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      set({
        user: null,
        loading: false,
      });
    }
  },
}));
