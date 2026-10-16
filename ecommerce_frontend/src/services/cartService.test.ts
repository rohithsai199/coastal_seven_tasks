import { describe, expect, it } from "vitest";
import { getCart, addToCart, removeFromCart, clearCart } from "./cartService";

describe("cartService", () => {
  it("fetches the cart with items and totals", async () => {
    const cart = await getCart();

    expect(cart.item_count).toBe(2);
    expect(cart.grand_total).toBe(60000);
    expect(cart.cart).toHaveLength(1);
    expect(cart.cart[0].name).toBe("Test Laptop");
    expect(cart.cart[0].quantity).toBe(2);
    expect(cart.cart[0].total).toBe(60000);
  });

  it("adds an item to the cart", async () => {
    const result = await addToCart(1, 2);

    expect(result).toMatchObject({ message: "Item added to cart" });
  });

  it("removes an item from the cart", async () => {
    const result = await removeFromCart(1);

    expect(result).toMatchObject({ message: "Item removed" });
  });

  it("clears the entire cart", async () => {
    const result = await clearCart();

    expect(result).toMatchObject({ message: "Cart cleared" });
  });
});
