export interface CheckoutData {
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
}

export interface Order {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
}