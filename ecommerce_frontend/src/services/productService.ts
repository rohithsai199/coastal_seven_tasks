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

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_email?: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface ProductReviewsData {
  reviews: Review[];
  average_rating: number;
  total_reviews: number;
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

export const getProductReviews = async (
  productId: number
): Promise<ProductReviewsData> => {
  const response = await api.get<ProductReviewsData>(`/products/${productId}/reviews`);
  return response.data;
};

export const submitProductReview = async (
  productId: number,
  data: { rating: number; comment?: string }
): Promise<Review> => {
  const response = await api.post<Review>(`/products/${productId}/reviews`, data);
  return response.data;
};