import api from "./api";
import type { CartResponse } from "../types/cart";

export const getCart = async (): Promise<CartResponse> => {
  const response = await api.get<CartResponse>("/cart");
  return response.data;
};

export const addToCart = async (
  productId: number,
  quantity: number = 1
) => {
  const response = await api.post("/cart/add", null, {
    params: {
      product_id: productId,
      quantity,
    },
  });

  return response.data;
};

export const updateCartItem = async (
  productId: number,
  quantity: number
) => {
  const response = await api.patch(`/cart/${productId}`, {
    quantity,
  });

  return response.data;
};

export const removeFromCart = async (
  productId: number
) => {
  const response = await api.delete(`/cart/remove/${productId}`);

  return response.data;
};

export const clearCart = async () => {
  const response = await api.delete("/cart");

  return response.data;
};