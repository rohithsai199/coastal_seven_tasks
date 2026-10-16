import api from "./api";
import type { CartResponse } from "../types/cart";

export const getCart = async (): Promise<CartResponse> => {
  const response = await api.get<CartResponse>("/cart");
  return response.data;
};

export const addToCart = async (
  productId: number,
  quantity: number = 1,
  size: string = "M"
) => {
  const response = await api.post("/cart/add", null, {
    params: {
      product_id: productId,
      quantity,
      size,
    },
  });

  return response.data;
};

export const updateCartItem = async (
  productId: number,
  quantity: number,
  size: string = "M"
) => {
  const response = await api.patch(`/cart/${productId}`, {
    quantity,
    size,
  }, {
    params: { size },
  });

  return response.data;
};

export const removeFromCart = async (
  productId: number,
  size?: string
) => {
  const response = await api.delete(`/cart/remove/${productId}`, {
    params: size ? { size } : undefined,
  });

  return response.data;
};

export const clearCart = async () => {
  const response = await api.delete("/cart");

  return response.data;
};