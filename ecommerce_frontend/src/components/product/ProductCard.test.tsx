import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProductCard from "./ProductCard";

describe("ProductCard", () => {
  const product = {
    id: 1,
    name: "Laptop",
    price: 30000,
    stock: 10,
    image_url: "/laptop.jpg",
    description: "A powerful laptop",
  };

  it("displays product information", () => {
    render(
      <MemoryRouter>
        <ProductCard
          product={product}
          onAddToCart={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("$30000.00")).toBeInTheDocument();
    expect(
      screen.getByText("A powerful laptop")
    ).toBeInTheDocument();
  });

  it("calls onAddToCart when Add to Cart is clicked", async () => {
    const user = userEvent.setup();
    const onAddToCart = vi.fn();

    render(
      <MemoryRouter>
        <ProductCard
          product={product}
          onAddToCart={onAddToCart}
        />
      </MemoryRouter>
    );

    const button = screen.getByRole("button", {
        name: /add laptop to cart/i,
    });

    await user.click(button);

    expect(onAddToCart).toHaveBeenCalledWith(product);
  });
});