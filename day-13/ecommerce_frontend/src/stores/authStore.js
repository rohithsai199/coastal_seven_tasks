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
    const token = localStorage.getItem("access_token");

    if (!token) {
      set({
        user: null,
        loading: false,
      });
      return;
    }

    try {
      const currentUser = await getCurrentUser();

      set({
        user: currentUser,
        loading: false,
      });
    } catch {
      localStorage.removeItem("access_token");

      set({
        user: null,
        loading: false,
      });
    }
  },

  login: async (email, password) => {
    const data = await loginRequest(email, password);

    if (!data?.access_token) {
      throw new Error("Login response did not contain access_token");
    }

    localStorage.setItem("access_token", data.access_token);

    const currentUser = await getCurrentUser();

    set({
      user: currentUser,
      loading: false,
    });

    return currentUser;
  },

  register: async (userData) => {
    return await signupRequest(userData);
  },

  logout: () => {
    localStorage.removeItem("access_token");

    set({
      user: null,
      loading: false,
    });
  },
}));