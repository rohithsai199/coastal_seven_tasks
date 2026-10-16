import { useEffect, useState } from "react";
import {
  getChatHistory,
  getAdminId,
} from "../../services/chatService";
import { useAuthStore } from "../../stores/authStore";
import { useChatStore } from "../../stores/chatStore";

function ChatPanel({ adminId: propAdminId, orderId }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [adminId, setAdminId] = useState(propAdminId || null);

  const user = useAuthStore((state) => state.user);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isConnected = useChatStore((state) => state.isConnected);
  const incomingMessages = useChatStore((state) => state.messages);
  const addLocalMessage = useChatStore(
    (state) => state.addLocalMessage
  );

  useEffect(() => {
    setMessage("");
    setMessages([]);
  }, [orderId]);

  useEffect(() => {
    if (propAdminId) {
      setAdminId(propAdminId);
    } else {
      getAdminId()
        .then((id) => setAdminId(id))
        .catch(() => setAdminId(1));
    }
  }, [propAdminId]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!adminId || !orderId) return;

      try {
        const history = await getChatHistory(
          adminId,
          orderId
        );

        setMessages(
          history.map((msg) => ({
            senderId: msg.sender_id,
            message: msg.message,
            orderId: msg.order_id,
            isMine: msg.sender_id === user?.id,
          }))
        );
      } catch (err) {
        console.error(
          "Failed to load chat history:",
          err
        );
      }
    };

    fetchHistory();
  }, [adminId, user?.id, orderId]);

  // The global chat WebSocket receives messages once for the whole app.
  useEffect(() => {
    if (!orderId || !user?.id) return;

    const latestForOrder = incomingMessages.filter(
      (msg) =>
        Number(msg.order_id) === Number(orderId) &&
        Number(msg.sender_id) !== Number(user.id)
    );

    if (!latestForOrder.length) return;

    const latest = latestForOrder[latestForOrder.length - 1];

    setMessages((previous) => {
      const alreadyExists = previous.some(
        (item) =>
          item.message === latest.message &&
          Number(item.senderId) === Number(latest.sender_id)
      );

      if (alreadyExists) return previous;

      return [
        ...previous,
        {
          senderId: latest.sender_id,
          message: latest.message,
          orderId: latest.order_id,
          isMine: false,
        },
      ];
    });
  }, [incomingMessages, orderId, user?.id]);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();

    if (
      !trimmedMessage ||
      !adminId ||
      !orderId ||
      !sendMessage
    ) {
      return;
    }

    const sent = sendMessage({
      recipient_id: Number(adminId),
      order_id: Number(orderId),
      message: trimmedMessage,
    });

    if (!sent) return;

    const localMessage = {
      senderId: user?.id,
      message: trimmedMessage,
      orderId: Number(orderId),
      isMine: true,
    };

    addLocalMessage({
      type: "chat.local",
      sender_id: user?.id,
      order_id: Number(orderId),
      message: trimmedMessage,
    });

    setMessages((previous) => [
      ...previous,
      localMessage,
    ]);

    setMessage("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className="chat-panel"
      style={{
        width: "100%",
        maxWidth: "500px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "16px",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3 style={{ margin: 0 }}>
          Customer Support
        </h3>

        <span
          style={{
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          {isConnected
            ? "🟢 Connected"
            : "🔴 Connecting..."}
        </span>
      </div>

      <div
        className="chat-messages"
        style={{
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "12px",
          border: "1px solid #eee",
          borderRadius: "8px",
          background: "#f8f9fa",
        }}
      >
        {messages.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#777",
              marginTop: "120px",
            }}
          >
            No messages yet.
          </p>
        ) : (
          messages.map((item, index) => (
            <div
              key={`${item.senderId}-${item.message}-${index}`}
              style={{
                display: "flex",
                justifyContent: item.isMine
                  ? "flex-end"
                  : "flex-start",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: item.isMine
                    ? "#007bff"
                    : "#e9ecef",
                  color: item.isMine
                    ? "#fff"
                    : "#222",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    fontSize: "12px",
                    marginBottom: "3px",
                  }}
                >
                  {item.isMine ? "You" : "Admin"}
                </strong>

                <span>{item.message}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div
        className="chat-input"
        style={{
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder={
            isConnected
              ? "Type a message..."
              : "Connecting to support..."
          }
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            outline: "none",
          }}
        />

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={!isConnected || !message.trim()}
          style={{
            padding: "10px 18px",
            border: "none",
            borderRadius: "8px",
            cursor:
              isConnected && message.trim()
                ? "pointer"
                : "not-allowed",
            opacity:
              isConnected && message.trim() ? 1 : 0.6,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;
