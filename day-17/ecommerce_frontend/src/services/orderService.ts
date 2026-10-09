import api from "./api";
import type { CheckoutData, Order } from "../types/order";

export const checkout = async (
  orderData: CheckoutData
): Promise<Order> => {
  const response = await api.post<Order>(
    "/orders/checkout",
    orderData
  );

  return response.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>("/orders");

  return response.data;
};

export const getOrder = async (
  orderId: number
): Promise<Order> => {
  const response = await api.get<Order>(
    `/orders/${orderId}`
  );

  return response.data;
};

export const cancelOrder = async (
  orderId: number
): Promise<Order> => {
  const response = await api.patch<Order>(
    `/orders/${orderId}/cancel`
  );

  return response.data;
};