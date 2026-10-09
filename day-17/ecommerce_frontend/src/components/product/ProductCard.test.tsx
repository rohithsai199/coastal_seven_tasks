import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProductCard from "./ProductCard";
import type { Product } from "../../types/product";

const baseProduct: Product = {
  id: 1,
  name: "Laptop",
  price: 30000,
  stock: 10,
  image_url: "/laptop.jpg",
  description: "A powerful laptop",
};

const renderCard = (product: Product, onAddToCart = vi.fn()) =>
  render(
    <MemoryRouter>
      <ProductCard product={product} onAddToCart={onAddToCart} />
    </MemoryRouter>
  );

describe("ProductCard", () => {
  it("displays product name, price, and description", () => {
    renderCard(baseProduct);

    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("$30000.00")).toBeInTheDocument();
    expect(screen.getByText("A powerful laptop")).toBeInTheDocument();
  });

  it("renders Add to Cart button when product is in stock", () => {
    renderCard(baseProduct);

    expect(
      screen.getByRole("button", { name: /add laptop to cart/i })
    ).toBeInTheDocument();
  });

  it("calls onAddToCart with the product when button clicked", async () => {
    const user = userEvent.setup();
    const onAddToCart = vi.fn();
    renderCard(baseProduct, onAddToCart);

    await user.click(
      screen.getByRole("button", { name: /add laptop to cart/i })
    );

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onAddToCart).toHaveBeenCalledWith(baseProduct);
  });

  it("shows Sold Out pill and hides add-to-cart when stock is 0", () => {
    renderCard({ ...baseProduct, stock: 0 });

    expect(screen.getByText(/sold out/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add laptop to cart/i })
    ).toBeNull();
  });

  it("shows low stock warning when stock is 1–5", () => {
    renderCard({ ...baseProduct, stock: 3 });

    expect(screen.getByText(/only 3 left/i)).toBeInTheDocument();
  });

  it("does not show description when omitted", () => {
    const { description: _removed, ...noDesc } = baseProduct;
    renderCard(noDesc as Product);

    expect(screen.queryByText("A powerful laptop")).toBeNull();
  });

  it("renders Quick View link pointing to product detail page", () => {
    renderCard(baseProduct);

    const quickViewLink = screen.getByTitle(/view details/i);
    expect(quickViewLink).toHaveAttribute("href", "/products/1");
  });

  it("renders product image with correct alt text", () => {
    renderCard(baseProduct);

    const img = screen.getByAltText("Laptop");
    expect(img).toBeInTheDocument();
  });
});