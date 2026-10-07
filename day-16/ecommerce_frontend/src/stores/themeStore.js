import { create } from "zustand";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    return savedTheme;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
};

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () =>
    set((state) => {
      const newTheme =
        state.theme === "light"
          ? "dark"
          : "light";

      localStorage.setItem(
        "theme",
        newTheme
      );

      document.documentElement.dataset.theme =
        newTheme;

      return {
        theme: newTheme,
      };
    }),

  initializeTheme: () => {
    const theme = getInitialTheme();

    document.documentElement.dataset.theme =
      theme;

    set({ theme });
  },
}));