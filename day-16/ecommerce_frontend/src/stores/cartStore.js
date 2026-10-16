import { create } from "zustand";

export const useCartStore = create((set) => ({
  cart: [],
  itemCount: 0,
  grandTotal: 0,

  setCart: (cartData) =>
    set({
      cart: cartData.cart,
      itemCount: cartData.item_count,
      grandTotal: cartData.grand_total,
    }),

  clearStore: () =>
    set({
      cart: [],
      itemCount: 0,
      grandTotal: 0,
    }),

  updateLocalQuantity: (productId, quantity) =>
    set((state) => {
      const updatedCart = state.cart
        .map((item) =>
          item.product_id === productId
            ? {
                ...item,
                quantity,
                total: Number(item.price) * quantity,
              }
            : item
        )
        .filter((item) => item.quantity > 0);

      return {
        cart: updatedCart,
        itemCount: updatedCart.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        grandTotal: updatedCart.reduce(
          (sum, item) => sum + Number(item.total),
          0
        ),
      };
    }),
}));

