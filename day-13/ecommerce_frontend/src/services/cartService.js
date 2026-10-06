import api from "./api";

export const getCart = async () => {
  const response = await api.get("/cart");
  return response.data;
};

export const addToCart = async (productId, quantity = 1) => {
  const response = await api.post("/cart/add", null, {
    params: {
      product_id: productId,
      quantity,
    },
  });

  return response.data;
};

export const updateCartItem = async (productId, quantity) => {
  const response = await api.patch(`/cart/${productId}`, {
    quantity,
  });

  return response.data;
};

export const removeFromCart = async (productId) => {
  const response = await api.delete(`/cart/remove/${productId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await api.delete("/cart");
  return response.data;
};