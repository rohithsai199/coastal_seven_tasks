import { create } from "zustand";

const INITIAL_WISHLIST = [
  {
    id: 21,
    name: "Restorative Botanical Night Repair Cream",
    price: 155.0,
    image_url: "/images/beauty_model1.jpg",
    category: "beauty",
    tagline: "Whipped regenerating restorative balm housed in heavy frosted glass",
    in_stock: true,
  },
  {
    id: 1,
    name: "Chocolate Melton Wool Trench Coat",
    price: 320.0,
    image_url: "/images/boys_arch1.jpg",
    category: "boys",
    tagline: "Double-breasted trench in heavy 650gsm Italian Melton wool",
    in_stock: true,
  },
  {
    id: 16,
    name: "Titanium Sculpted Aviator Sunglasses",
    price: 245.0,
    image_url: "/images/acc_arch1.jpg",
    category: "accessories",
    tagline: "Precision-milled aerospace grade Japanese titanium frames",
    in_stock: true,
  },
];

const getInitialWishlist = () => {
  if (typeof window === "undefined") return INITIAL_WISHLIST;
  try {
    const saved = localStorage.getItem("zevana_wishlist");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load wishlist from storage:", err);
  }
  return INITIAL_WISHLIST;
};

export const useWishlistStore = create((set, get) => ({
  wishlist: getInitialWishlist(),

  addToWishlist: (product) => {
    if (!product || !product.id) return;
    const current = get().wishlist;
    if (current.some((item) => String(item.id) === String(product.id))) return;

    const itemToAdd = {
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image_url: product.image_url || "/images/beauty_model1.jpg",
      category: product.category || "luxury",
      tagline: product.tagline || product.description || "Curated Haute Edition",
      in_stock: product.stock !== undefined ? product.stock > 0 : true,
    };

    const updated = [itemToAdd, ...current];
    try {
      localStorage.setItem("zevana_wishlist", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
    set({ wishlist: updated });
  },

  removeFromWishlist: (productId) => {
    const updated = get().wishlist.filter((item) => String(item.id) !== String(productId));
    try {
      localStorage.setItem("zevana_wishlist", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage update failed", e);
    }
    set({ wishlist: updated });
  },

  toggleWishlist: (product) => {
    if (!product || !product.id) return false;
    const exists = get().isInWishlist(product.id);
    if (exists) {
      get().removeFromWishlist(product.id);
      return false;
    } else {
      get().addToWishlist(product);
      return true;
    }
  },

  isInWishlist: (productId) => {
    return get().wishlist.some((item) => String(item.id) === String(productId));
  },

  clearWishlist: () => {
    try {
      localStorage.removeItem("zevana_wishlist");
    } catch (e) {}
    set({ wishlist: [] });
  },
}));
