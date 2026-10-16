import { describe, expect, it, beforeEach } from "vitest";
import { useCartStore } from "./cartStore";

describe("cartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clearStore();
  });

  it("sets cart data", () => {
    useCartStore.getState().setCart({
      cart: [
        {
          product_id: 1,
          name: "Laptop",
          price: 1000,
          image_url: "",
          quantity: 2,
          total: 2000,
        },
      ],
      item_count: 2,
      grand_total: 2000,
    });

    const state = useCartStore.getState();

    expect(state.itemCount).toBe(2);
    expect(state.grandTotal).toBe(2000);
  });

  it("updates local quantity", () => {
    useCartStore.getState().setCart({
      cart: [
        {
          product_id: 1,
          name: "Laptop",
          price: 1000,
          image_url: "",
          quantity: 1,
          total: 1000,
        },
      ],
      item_count: 1,
      grand_total: 1000,
    });

    useCartStore
      .getState()
      .updateLocalQuantity(1, 3);

    const state = useCartStore.getState();

    expect(state.cart[0].quantity).toBe(3);
    expect(state.itemCount).toBe(3);
    expect(state.grandTotal).toBe(3000);
  });

  it("clears the cart", () => {
    useCartStore.getState().setCart({
      cart: [],
      item_count: 0,
      grand_total: 0,
    });

    useCartStore.getState().clearStore();

    const state = useCartStore.getState();

    expect(state.cart).toEqual([]);
    expect(state.itemCount).toBe(0);
    expect(state.grandTotal).toBe(0);
  });
});