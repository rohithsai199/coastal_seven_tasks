import api from "./api";
import type { Product } from "../types/product";

export interface ProductQueryParams {
  page?: number;
  page_size?: number;
  q?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "name" | "relevance";
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