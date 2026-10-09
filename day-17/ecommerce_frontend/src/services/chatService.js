import api from "./api";

export const getChatHistory = async (recipientId, orderId = null) => {
  const url = orderId ? `/chat/history/${recipientId}?order_id=${orderId}` : `/chat/history/${recipientId}`;
  const response = await api.get(url);
  return response.data;
};

export const getAdminId = async () => {
  const response = await api.get("/chat/admin-id");
  return response.data.admin_id;
};

