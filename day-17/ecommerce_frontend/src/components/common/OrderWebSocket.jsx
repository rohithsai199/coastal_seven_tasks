import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import useWebSocket from "../../hooks/useWebSocket";
import { getWebSocketUrl } from "../../services/websocketService";
import { useNotificationStore } from "../../stores/notificationStore";
import { useAuthStore } from "../../stores/authStore";

function OrderWebSocket() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const addNotification =
    useNotificationStore(
      (state) => state.addNotification
    );

  const handleMessage = useCallback(
    (message) => {
      console.log(
        "Order WebSocket message:",
        message
      );

      if (
        message.type ===
        "order.status.updated"
      ) {
        queryClient.invalidateQueries({
          queryKey: ["orders"],
        });

        queryClient.invalidateQueries({
          queryKey: [
            "order",
            message.order_id,
          ],
        });

        addNotification({
          type: "order",
          title: "Order Update",
          message: `Order #${message.order_id} is now ${message.status}.`,
        });
      }

      if (
        message.type === "order.created"
      ) {
        queryClient.invalidateQueries({
          queryKey: ["orders"],
        });

        addNotification({
          type: "order",
          title: "Order Created",
          message: `Order #${message.order_id} was successfully created.`,
        });
      }
    },
    [queryClient, addNotification]
  );

  useWebSocket({
    url: user ? getWebSocketUrl("/ws/orders") : null,
    onMessage: handleMessage,
    enabled: Boolean(user),
  });

  return null;
}

export default OrderWebSocket;