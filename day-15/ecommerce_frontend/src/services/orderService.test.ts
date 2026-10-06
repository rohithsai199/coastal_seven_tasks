import { describe, expect, it } from "vitest";
import { getOrders, getOrder, checkout, cancelOrder } from "./orderService";
import type { CheckoutData } from "../types/order";

const mockCheckoutData: CheckoutData = {
  shipping_name: "John Doe",
  shipping_phone: "9876543210",
  shipping_address: "123 Main St",
  shipping_city: "Hyderabad",
  shipping_state: "Telangana",
  shipping_postal_code: "500001",
};

describe("orderService", () => {
  it("fetches a list of orders", async () => {
    const orders = await getOrders();

    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe(101);
    expect(orders[0].status).toBe("pending");
    expect(orders[0].total_amount).toBe(60000);
  });

  it("fetches a single order by id", async () => {
    const order = await getOrder(101);

    expect(order.id).toBe(101);
    expect(order.total_amount).toBe(60000);
  });

  it("places a checkout order and returns the created order", async () => {
    const order = await checkout(mockCheckoutData);

    expect(order.id).toBe(101);
    expect(order.status).toBe("pending");
    expect(order.total_amount).toBe(60000);
  });

  it("cancels an order and returns updated status", async () => {
    const order = await cancelOrder(101);

    expect(order.id).toBe(101);
    expect(order.status).toBe("cancelled");
  });
});
