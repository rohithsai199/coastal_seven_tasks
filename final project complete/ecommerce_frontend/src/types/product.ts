export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url: string;
  description?: string;
  sizes?: string;
  sizes_list?: string[];
  average_rating?: number;
  total_reviews?: number;
}