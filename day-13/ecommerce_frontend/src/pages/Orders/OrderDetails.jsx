import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  getOrder,
  cancelOrder,
} from "../../services/orderService";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getOrder(orderId);
      setOrder(data);
    } catch (err) {
      console.error("Order details error:", err);
      setError(
        err.response?.data?.detail || "Unable to load order details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel order #" + orderId + "?"
    );
    if (!confirmed) return;

    try {
      setCancelling(true);
      setError("");
      await cancelOrder(orderId);
      await loadOrder();
    } catch (err) {
      console.error("Cancel order error:", err);
      setError(
        err.response?.data?.detail || "Unable to cancel this order."
      );
    } finally {
      setCancelling(false);
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

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="container loading-wrapper">
          <div className="modern-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="container not-found-wrapper">
          <h2>Order Not Found</h2>
          <p>{error || "The requested order could not be retrieved."}</p>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="btn-hero-primary"
            style={{ marginTop: '20px' }}
          >
            <ArrowLeft size={18} /> Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusBadge(order.status);
  const isCancelled = (order.status || "").toLowerCase() === "cancelled";
  const isDelivered = (order.status || "").toLowerCase() === "delivered";
  const items = order.items || order.order_items || [];

  return (
    <div className="order-details-page-wrapper" style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/orders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#6C5CE7',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} /> Back to My Orders
          </Link>
        </div>

        {/* Order Header Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px 32px',
          border: '1px solid #EFEFEF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <span className="section-badge-purple">Order Confirmation</span>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E272E', margin: '4px 0' }}>
              Order #{order.id}
            </h1>
            <p style={{ fontSize: '14px', color: '#808E9B' }}>
              Placed on{" "}
              {order.created_at
                ? new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recently"}
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: statusInfo.bg,
            color: statusInfo.color,
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: 800
          }}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '32px', alignItems: 'start' }}>
          {/* Left: Items List */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '28px',
            border: '1px solid #EFEFEF',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E272E', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} className="text-purple" />
              Order Items ({items.length})
            </h2>

            {items.length === 0 ? (
              <p style={{ color: '#808E9B', fontSize: '14px' }}>No item details available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {items.map((item, index) => (
                  <div
                    key={item.id || index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      background: '#F8F9FA',
                      borderRadius: '12px',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E272E', marginBottom: '4px' }}>
                        {item.name || item.product_name || `Product ID #${item.product_id}`}
                      </h4>
                      <span style={{ fontSize: '13px', color: '#808E9B' }}>
                        Qty: {item.quantity} × ${Number(item.price ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <strong style={{ fontSize: '16px', fontWeight: 800, color: '#6C5CE7' }}>
                      ${Number((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Shipping & Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Shipping Info Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px 28px',
              border: '1px solid #EFEFEF',
              boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E272E', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} className="text-coral" /> Delivery Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#485460' }}>
                <p><strong>Recipient:</strong> {order.shipping_name || "Account Customer"}</p>
                {order.shipping_phone && <p><strong>Contact:</strong> {order.shipping_phone}</p>}
                {order.shipping_address && (
                  <p>
                    <strong>Address:</strong> {order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                  </p>
                )}
              </div>
            </div>

            {/* Total Summary Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px 28px',
              border: '1px solid #EFEFEF',
              boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E272E', marginBottom: '16px' }}>
                Payment Summary
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#485460' }}>
                <span>Subtotal</span>
                <span>${Number(order.total_amount ?? 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#485460' }}>
                <span>Shipping</span>
                <span style={{ color: '#00B894', fontWeight: 700 }}>FREE</span>
              </div>

              <div style={{ height: '1px', background: '#EFEFEF', margin: '14px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px', fontWeight: 900, color: '#1E272E' }}>
                <span>Grand Total</span>
                <span style={{ color: '#6C5CE7' }}>${Number(order.total_amount ?? 0).toFixed(2)}</span>
              </div>

              {!isCancelled && !isDelivered && (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancel}
                  style={{
                    width: '100%',
                    background: '#FFF0F0',
                    color: '#FF7675',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <XCircle size={16} />
                  <span>{cancelling ? "Cancelling Order..." : "Cancel Order"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;