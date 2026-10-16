import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Package,
  RotateCcw,
  Minus,
  UserCheck,
} from "lucide-react";

import { useAuthStore } from "../../stores/authStore";
import { useChatStore } from "../../stores/chatStore";
import { getAdminId, getChatHistory } from "../../services/chatService";
import api from "../../services/api";
import "./CustomerSupportWidget.css";

function CustomerSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [adminId, setAdminId] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const messagesEndRef = useRef(null);

  const user = useAuthStore((state) => state.user);
  const isConnected = useChatStore((state) => state.isConnected);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const incomingMessages = useChatStore((state) => state.messages);
  const addLocalMessage = useChatStore((state) => state.addLocalMessage);

  // Unread counter for messages from support
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Fetch Admin ID & User Orders on Mount/Auth
  useEffect(() => {
    if (!user) return;

    getAdminId()
      .then((id) => setAdminId(id))
      .catch(() => setAdminId(1));

    api
      .get("/orders")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setUserOrders(res.data);
        }
      })
      .catch(() => setUserOrders([]));
  }, [user]);

  // 2. Fetch Chat History when opening or changing adminId
  useEffect(() => {
    if (!isOpen || !user || !adminId) return;

    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const history = await getChatHistory(adminId);
        setMessages(
          history.map((msg) => ({
            id: msg.id,
            senderId: msg.sender_id,
            message: msg.message,
            orderId: msg.order_id,
            createdAt: msg.created_at,
            isMine: msg.sender_id === user.id,
          }))
        );
      } catch (err) {
        console.error("Failed to load concierge chat history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
    setUnreadCount(0);
  }, [isOpen, user, adminId]);

  // 3. Reactively Receive WebSocket Messages in Real Time
  useEffect(() => {
    if (!incomingMessages.length || !user) return;

    const latest = incomingMessages[incomingMessages.length - 1];
    if (!latest || latest.type !== "chat.message") return;

    // Check if message belongs to conversation between current user and admin
    const isRelevant =
      (latest.sender_id === adminId && latest.recipient_id === user.id) ||
      (latest.sender_id === user.id && latest.recipient_id === adminId);

    if (!isRelevant) return;

    setMessages((prev) => {
      if (prev.some((m) => m.id && latest.id && m.id === latest.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: latest.id || Date.now(),
          senderId: latest.sender_id,
          message: latest.message,
          orderId: latest.order_id,
          createdAt: latest.created_at || new Date().toISOString(),
          isMine: latest.sender_id === user.id,
        },
      ];
    });

    if (!isOpen && latest.sender_id !== user.id) {
      setUnreadCount((c) => c + 1);
    }
  }, [incomingMessages, user, adminId, isOpen]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // 4. Send Message via WebSocket
  const handleSend = (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || !sendMessage || !user) return;

    const orderNum = selectedOrderId ? Number(selectedOrderId) : null;

    const sent = sendMessage({
      recipient_id: Number(adminId),
      order_id: orderNum,
      message: text,
    });

    if (!sent) {
      console.warn("WebSocket send returned false. Trying reconnect...");
    }

    const optimisticMsg = {
      id: Date.now(),
      senderId: user.id,
      message: text,
      orderId: orderNum,
      createdAt: new Date().toISOString(),
      isMine: true,
    };

    addLocalMessage({
      type: "chat.local",
      sender_id: user.id,
      order_id: orderNum,
      message: text,
    });

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickChip = (prompt) => {
    setInputText(prompt);
    handleSend(prompt);
  };

  return (
    <>
      {/* --- Floating Bottom-Right Concierge Trigger --- */}
      <button
        type="button"
        className="concierge-float-trigger"
        onClick={() => {
          setIsOpen((o) => !o);
          setUnreadCount(0);
        }}
        aria-label="Open Arise Customer Support Chat"
        title="Chat with Arise Concierge & Customer Support"
      >
        <span className="concierge-pulse-dot" />
        <MessageSquare size={16} />
        <span>Customer Support</span>

        {unreadCount > 0 && (
          <span className="concierge-unread-dot">{unreadCount}</span>
        )}
      </button>

      {/* --- Floating Concierge Chat Window --- */}
      {isOpen && (
        <div className="concierge-window-wrapper">
          {/* Header */}
          <div className="concierge-header">
            <div className="concierge-header-brand">
              <div className="concierge-brand-avatar">JB</div>
              <div className="concierge-header-meta">
                <h4>
                  Arise Client Concierge
                  <Sparkles size={13} style={{ color: "#F59E0B" }} />
                </h4>
                <div className="concierge-header-status">
                  <span className="concierge-status-beacon" />
                  <span>
                    {isConnected ? "Live Support Online" : "Connecting..."}
                  </span>
                </div>
              </div>
            </div>

            <div className="concierge-header-actions">
              <button
                type="button"
                className="btn-concierge-icon"
                onClick={() => setIsOpen(false)}
                title="Minimize Concierge"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                className="btn-concierge-icon"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Connection Strip */}
          <div className="concierge-telemetry-bar">
            <span>Official Arise Client Services</span>
            <span className="telemetry-status-pill">
              <ShieldCheck size={11} /> WebSocket Encrypted
            </span>
          </div>

          {/* Main Content Area */}
          {!user ? (
            <div className="concierge-unauth-box">
              <UserCheck size={38} style={{ color: "#94A3B8", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 6px 0" }}>
                Private Client Support
              </h3>
              <p style={{ fontSize: "13px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Please sign in to connect directly with an Arise concierge representative regarding your orders, styling, or inquiries.
              </p>
              <div className="unauth-actions-group">
                <Link to="/login" className="btn-unauth-signin" onClick={() => setIsOpen(false)}>
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-unauth-signin"
                  style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #E2E8F0" }}
                  onClick={() => setIsOpen(false)}
                >
                  Create Account
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Message Feed */}
              <div className="concierge-messages-feed">
                <div className="concierge-welcome-banner">
                  <div className="welcome-atelier-crest">ARISE</div>
                  <h5 className="welcome-title">Dedicated Atelier Concierge</h5>
                  <p className="welcome-desc">
                    Welcome, {user.email?.split("@")[0]}. How may our concierge team assist you today?
                  </p>

                  {/* Quick Inquiry Chips */}
                  <div className="concierge-quick-chips">
                    <button
                      type="button"
                      className="quick-chip-btn"
                      onClick={() => handleQuickChip("Could you assist me with tracking my recent order?")}
                    >
                      📦 Track Order
                    </button>
                    <button
                      type="button"
                      className="quick-chip-btn"
                      onClick={() => handleQuickChip("I need sizing guidance between S, M, L, XL for an apparel piece.")}
                    >
                      📏 Sizing Advice
                    </button>
                    <button
                      type="button"
                      className="quick-chip-btn"
                      onClick={() => handleQuickChip("What is the return or exchange policy for luxury items?")}
                    >
                      🔄 Returns
                    </button>
                    <button
                      type="button"
                      className="quick-chip-btn"
                      onClick={() => handleQuickChip("Hello, I have an inquiry for the Arise support desk.")}
                    >
                      💬 Support Desk
                    </button>
                  </div>
                </div>

                {loadingHistory ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#94A3B8", fontSize: "12.5px" }}>
                    Loading past concierge conversations...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "#94A3B8" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>
                      No messages yet. Send an inquiry below to chat with customer support!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`chat-msg-row ${msg.isMine ? "mine" : "theirs"}`}
                    >
                      <div className="chat-msg-bubble">{msg.message}</div>
                      <div className="chat-msg-meta">
                        {msg.orderId && (
                          <span className="chat-order-tag">#ORD-{msg.orderId}</span>
                        )}
                        <span>{msg.isMine ? "You" : "Concierge"}</span>
                        <span>•</span>
                        <span>
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Just now"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer Input Bar */}
              <div className="concierge-input-footer">
                {userOrders.length > 0 && (
                  <div className="concierge-order-picker-row">
                    <Package size={12} />
                    <span>Inquire about order:</span>
                    <select
                      className="concierge-order-select"
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                    >
                      <option value="">General Support (No Order)</option>
                      {userOrders.map((ord) => (
                        <option key={ord.id} value={ord.id}>
                          #ORD-{ord.id} (${Number(ord.total_amount).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="concierge-input-form">
                  <input
                    type="text"
                    className="concierge-text-input"
                    placeholder="Type inquiry to customer support..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    className="btn-concierge-send"
                    onClick={() => handleSend()}
                    disabled={!inputText.trim()}
                    title="Send message"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default CustomerSupportWidget;
