export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  total: number;
}

export interface CartResponse {
  cart: CartItem[];
  item_count: number;
  grand_total: number;
}