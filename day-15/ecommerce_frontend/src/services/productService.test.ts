import { describe, expect, it } from "vitest";
import { getProducts } from "./productService";

describe("productService", () => {
  it("fetches products from the API", async () => {
    const products = await getProducts();

    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Test Laptop");
    expect(products[0].price).toBe(30000);
  });
});