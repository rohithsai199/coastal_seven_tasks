import { useCallback, useEffect, useRef, useState } from "react";

function useWebSocket({
  url,
  onMessage,
  enabled = true,
}) {
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const manuallyClosedRef = useRef(false);
  const connectRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((data) => {
    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    }

    console.warn("WebSocket is not connected");
    return false;
  }, []);

  const disconnect = useCallback(() => {
    manuallyClosedRef.current = true;
    clearReconnectTimer();

    const socket = socketRef.current;
    socketRef.current = null;

    if (socket) {
      socket.close(1000, "Client disconnected");
    }

    setIsConnected(false);
  }, [clearReconnectTimer]);

  const connect = useCallback(() => {
    if (!enabled || !url || manuallyClosedRef.current) {
      return;
    }

    const existing = socketRef.current;

    if (
      existing?.readyState === WebSocket.OPEN ||
      existing?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    clearReconnectTimer();

    let socket;

    try {
      socket = new WebSocket(url);
      socketRef.current = socket;
      setIsConnected(false);

      socket.onopen = () => {
        // Ignore an old socket that has already been replaced.
        if (socketRef.current !== socket) return;

        console.log("WebSocket connected:", url);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        if (socketRef.current !== socket) return;

        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch (error) {
          console.error("Invalid WebSocket message:", error);
        }
      };

      socket.onerror = (error) => {
        if (socketRef.current === socket) {
          console.error("WebSocket error:", error);
        }
      };

      socket.onclose = (event) => {
        // This is the important stale-socket guard.
        // An old socket must never schedule another connection.
        if (socketRef.current !== socket) return;

        socketRef.current = null;
        setIsConnected(false);

        if (manuallyClosedRef.current) return;

        const attempt = reconnectAttemptsRef.current;
        const delay = Math.min(
          1000 * 2 ** attempt,
          30000
        );

        reconnectAttemptsRef.current = Math.min(
          attempt + 1,
          10
        );

        console.warn(
          `WebSocket closed (${event.code}). Reconnecting in ${delay}ms...`
        );

        clearReconnectTimer();

        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          connectRef.current?.();
        }, delay);
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setIsConnected(false);
    }
  }, [clearReconnectTimer, enabled, url]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    manuallyClosedRef.current = false;
    reconnectAttemptsRef.current = 0;
    clearReconnectTimer();

    if (!enabled || !url) {
      setIsConnected(false);
      return undefined;
    }

    connect();

    return () => {
      manuallyClosedRef.current = true;
      clearReconnectTimer();

      const socket = socketRef.current;
      socketRef.current = null;

      if (socket) {
        socket.close(1000, "Component unmounted");
      }

      setIsConnected(false);
    };
  }, [clearReconnectTimer, connect, enabled, url]);

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
  };
}

export default useWebSocket;
