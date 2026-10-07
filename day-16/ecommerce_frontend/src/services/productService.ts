import api from "./api";
import type { Product } from "../types/product";

export interface ProductQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export const getProducts = async (
  params: ProductQueryParams = {}
): Promise<Product[]> => {
  const response = await api.get<Product[]>("/products", {
    params,
  });

  return response.data;
};

export const getProduct = async (
  productId: number
): Promise<Product> => {
  const response = await api.get<Product>(`/products/${productId}`);

  return response.data;
};