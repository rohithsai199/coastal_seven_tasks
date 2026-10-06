import api from "./api";

export const getProducts = async (params = {}) => {
  const response = await api.get("/products", {
    params,
  });

  return response.data;
};

export const getProduct = async (productId) => {
  const response = await api.get(`/products/${productId}`);

  return response.data;
};