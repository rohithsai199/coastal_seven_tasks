import { useState, useRef } from "react";
import { Link } from "react-router-dom";

import ChatPanel from "../../components/common/ChatPanel";
import {
  Package,
  Eye,
  XCircle,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ArrowRight,
  MessageCircle,
  FileText,
} from "lucide-react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getOrders,
  cancelOrder,
} from "../../services/orderService";
import { generateOrderInvoice } from "../../services/taskService";
import { useTaskStore } from "../../stores/taskStore";
import { useChatStore } from "../../stores/chatStore";

function Orders() {
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");
  
  const [activeOrderId, setActiveOrderId] = useState(null);
  const chatRef = useRef(null);

  const queryClient = useQueryClient();

  const unreadByOrder = useChatStore((state) => state.unreadByOrder);
  const markOrderRead = useChatStore((state) => state.markOrderRead);

  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const data = await getOrders();

      return Array.isArray(data)
        ? data
        : data.orders || [];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,

    onMutate: (orderId) => {
      setCancellingId(orderId);
      setError("");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },

    onError: (err) => {
      console.error("Cancel order error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to cancel this order."
      );
    },

    onSettled: () => {
      setCancellingId(null);
    },
  });

  const addTask = useTaskStore((state) => state.addTask);

  const handleGenerateInvoice = async (orderId) => {
    try {
      const data = await generateOrderInvoice(orderId);
      addTask({
        taskId: data.task_id,
        type: "invoice",
        title: `Invoice Order #${orderId}`,
        metadata: { orderId: Number(orderId) },
      });
    } catch (err) {
      console.error("Failed to generate invoice:", err);
      alert(err.response?.data?.detail || "Failed to trigger invoice generation.");
    }
  };

  const handleCancel = (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel order #" + orderId + "?"
    );

    if (!confirmed) return;

    cancelMutation.mutate(orderId);
  };

  const handleChatClick = (orderId) => {
    setActiveOrderId(orderId);
    markOrderRead(orderId);
    if (chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "PENDING").toUpperCase();

    switch (s) {
      case "COMPLETED":
      case "DELIVERED":
        return {
          bg: "#E6F8F4",
          color: "#00B894",
          icon: <CheckCircle2 size={14} />,
          label: "Delivered",
        };

      case "PROCESSING":
      case "SHIPPED":
        return {
          bg: "#F0EDFD",
          color: "#6C5CE7",
          icon: <Truck size={14} />,
          label:
            s === "SHIPPED"
              ? "Shipped"
              : "Processing",
        };

      case "CANCELLED":
        return {
          bg: "#FFF0F0",
          color: "#FF7675",
          icon: <AlertCircle size={14} />,
          label: "Cancelled",
        };

      default:
        return {
          bg: "#FEF8E7",
          color: "#D35400",
          icon: <Clock size={14} />,
          label: "Order Placed",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="orders-page">
        <div className="container loading-wrapper">
          <div className="modern-spinner"></div>

          <p>
            Loading your order history...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="orders-page">
        <div className="container">
          <div
            className="details-alert alert-error"
            style={{ marginBottom: "24px" }}
          >
            Unable to load your orders.
            Please make sure you are logged in.
          </div>

          <button
            type="button"
            onClick={() => refetch()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">

        {/* Header */}
        <div className="section-header-row">
          <div>
            <span className="section-badge-purple">
              Purchase History
            </span>

            <h1 className="section-main-heading">
              My Orders
            </h1>

            <p className="section-sub-heading">
              Track real-time delivery status,
              view invoices, and manage previous
              orders.
            </p>
          </div>

          <Link
            to="/products"
            className="view-all-link"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div
            className="details-alert alert-error"
            style={{ marginBottom: "24px" }}
          >
            {error}
          </div>
        )}

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="catalog-empty-state">
            <div className="empty-icon-circle">
              <Package size={40} />
            </div>

            <h3>No orders found</h3>

            <p>
              You haven't placed any orders yet.
              Discover our latest collection!
            </p>

            <Link
              to="/products"
              className="btn-hero-primary"
              style={{ marginTop: "20px" }}
            >
              Explore Collection
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {orders.map((order) => {
              const statusInfo =
                getStatusBadge(order.status);

              const isCancelled =
                (order.status || "").toLowerCase() ===
                "cancelled";

              const isCompleted =
                (order.status || "").toLowerCase() ===
                  "delivered" ||
                (order.status || "").toLowerCase() ===
                  "completed";

              return (
                <div
                  key={order.id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "20px",
                    padding: "24px 28px",
                    border: "1px solid #EFEFEF",
                    boxShadow:
                      "0 4px 18px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    transition:
                      "all 0.2s ease",
                  }}
                >
                  {/* Order Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      borderBottom:
                        "1px solid #F3F4F6",
                      paddingBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          background: "#F0EDFD",
                          color: "#6C5CE7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "center",
                        }}
                      >
                        <Package size={22} />
                      </div>

                      <div>
                        <h3
                          style={{
                            fontSize: "17px",
                            fontWeight: 800,
                            color: "#1E272E",
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          Order #{order.id}
                          <div style={{ position: "relative" }}>
                            <button
                              type="button"
                              onClick={() => handleChatClick(order.id)}
                              title="Chat with Support"
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#00B894",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                padding: 0,
                              }}
                            >
                              <MessageCircle size={18} />
                            </button>
                            {unreadByOrder[order.id] > 0 && (
                              <span style={{
                                position: "absolute",
                                top: "-8px",
                                right: "-8px",
                                background: "#FF7675",
                                color: "white",
                                borderRadius: "50%",
                                width: "16px",
                                height: "16px",
                                fontSize: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold"
                              }}>
                                {unreadByOrder[order.id]}
                              </span>
                            )}
                          </div>
                        </h3>

                        <span
                          style={{
                            fontSize: "13px",
                            color: "#808E9B",
                          }}
                        >
                          {order.created_at
                            ? new Date(
                                order.created_at
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "Recently placed"}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background:
                          statusInfo.bg,
                        color:
                          statusInfo.color,
                        padding: "6px 14px",
                        borderRadius: "9999px",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      {statusInfo.icon}
                      <span>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Order Information */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "32px",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Total */}
                      <div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#808E9B",
                            textTransform:
                              "uppercase",
                            fontWeight: 700,
                            letterSpacing:
                              "0.5px",
                            display: "block",
                            marginBottom: "2px",
                          }}
                        >
                          Total Amount
                        </span>

                        <strong
                          style={{
                            fontSize: "20px",
                            fontWeight: 900,
                            color: "#6C5CE7",
                          }}
                        >
                          $
                          {Number(
                            order.total_amount ?? 0
                          ).toFixed(2)}
                        </strong>
                      </div>

                      {/* Shipping */}
                      {order.shipping_city && (
                        <div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#808E9B",
                              textTransform:
                                "uppercase",
                              fontWeight: 700,
                              letterSpacing:
                                "0.5px",
                              display: "block",
                              marginBottom: "2px",
                            }}
                          >
                            Shipping Destination
                          </span>

                          <strong
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#1E272E",
                            }}
                          >
                            {order.shipping_city},{" "}
                            {order.shipping_state}
                          </strong>
                        </div>
                      )}

                      {/* Items */}
                      {order.items &&
                        order.items.length > 0 && (
                          <div>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#808E9B",
                                textTransform:
                                  "uppercase",
                                fontWeight: 700,
                                letterSpacing:
                                  "0.5px",
                                display: "block",
                                marginBottom: "2px",
                              }}
                            >
                              Items
                            </span>

                            <strong
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#1E272E",
                              }}
                            >
                              {order.items.length}{" "}
                              Product
                              {order.items.length >
                              1
                                ? "s"
                                : ""}
                            </strong>
                          </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Link
                        to={`/orders/${order.id}`}
                        style={{
                          background: "#F3F4F6",
                          color: "#1E272E",
                          padding: "10px 18px",
                          borderRadius:
                            "9999px",
                          fontSize: "13px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems:
                            "center",
                          gap: "6px",
                          textDecoration:
                            "none",
                          transition:
                            "all 0.2s ease",
                        }}
                      >
                        <Eye size={16} />
                        <span>
                          View Details
                        </span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleGenerateInvoice(order.id)}
                        style={{
                          background: "#F0EDFD",
                          color: "#6C5CE7",
                          border: "1px solid #D4CEFB",
                          padding: "10px 18px",
                          borderRadius: "9999px",
                          fontSize: "13px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <FileText size={16} />
                        <span>Invoice</span>
                      </button>

                      {!isCancelled &&
                        !isCompleted && (
                          <button
                            type="button"
                            disabled={
                              cancellingId ===
                              order.id
                            }
                            onClick={() =>
                              handleCancel(
                                order.id
                              )
                            }
                            style={{
                              background:
                                "#FFF0F0",
                              color: "#FF7675",
                              border: "none",
                              padding:
                                "10px 18px",
                              borderRadius:
                                "9999px",
                              fontSize: "13px",
                              fontWeight: 700,
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: "6px",
                              cursor:
                                "pointer",
                              transition:
                                "all 0.2s ease",
                            }}
                          >
                            <XCircle size={16} />

                            <span>
                              {cancellingId ===
                              order.id
                                ? "Cancelling..."
                                : "Cancel"}
                            </span>
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Customer Support Chat */}
        {activeOrderId && (
          <div
            ref={chatRef}
            style={{
              marginTop: "40px",
              marginBottom: "40px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <ChatPanel adminId={1} orderId={activeOrderId} />
          </div>
        )}

      </div>
    </div>
  );
}

export default Orders;