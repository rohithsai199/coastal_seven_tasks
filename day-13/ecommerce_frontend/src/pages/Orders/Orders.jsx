import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Eye,
  XCircle,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getOrders,
  cancelOrder,
} from "../../services/orderService";

function Orders() {
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

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

  const handleCancel = (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel order #" + orderId + "?"
    );

    if (!confirmed) return;

    cancelMutation.mutate(orderId);
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
          label: s === "SHIPPED" ? "Shipped" : "Processing",
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
          <p>Loading your order history...</p>
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
            Unable to load your orders. Please make sure you are logged in.
          </div>

          <button type="button" onClick={() => refetch()}>
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
              Track real-time delivery status, view invoices, and manage previous orders.
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

        {error && (
          <div
            className="details-alert alert-error"
            style={{ marginBottom: "24px" }}
          >
            {error}
          </div>
        )}

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
              const statusInfo = getStatusBadge(order.status);

              const isCancelled =
                (order.status || "").toLowerCase() === "cancelled";

              const isCompleted =
                (order.status || "").toLowerCase() === "delivered" ||
                (order.status || "").toLowerCase() === "completed";

              return (
                <div
                  key={order.id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "20px",
                    padding: "24px 28px",
                    border: "1px solid #EFEFEF",
                    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      borderBottom: "1px solid #F3F4F6",
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
                          justifyContent: "center",
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
                          }}
                        >
                          Order #{order.id}
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
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Recently placed"}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        padding: "6px 14px",
                        borderRadius: "9999px",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
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
                      <div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#808E9B",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
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
                          ${Number(order.total_amount ?? 0).toFixed(2)}
                        </strong>
                      </div>

                      {order.shipping_city && (
                        <div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#808E9B",
                              textTransform: "uppercase",
                              fontWeight: 700,
                              letterSpacing: "0.5px",
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

                      {order.items &&
                        order.items.length > 0 && (
                          <div>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#808E9B",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.5px",
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
                              {order.items.length} Product
                              {order.items.length > 1 ? "s" : ""}
                            </strong>
                          </div>
                        )}
                    </div>

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
                          borderRadius: "9999px",
                          fontSize: "13px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          textDecoration: "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Eye size={16} />
                        <span>View Details</span>
                      </Link>

                      {!isCancelled && !isCompleted && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() =>
                            handleCancel(order.id)
                          }
                          style={{
                            background: "#FFF0F0",
                            color: "#FF7675",
                            border: "none",
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
                          <XCircle size={16} />

                          <span>
                            {cancellingId === order.id
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
      </div>
    </div>
  );
}

export default Orders;