import { create } from "zustand";

export const useCategoryStore = create((set) => ({
  activeCategory: "home",
  setActiveCategory: (category) => set({ activeCategory: category }),
}));
