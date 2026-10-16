import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  MapPin,
  XCircle,
  FileText,
  Download,
  Loader2,
  Zap,
  Phone,
  ShieldCheck,
  Check,
  Copy,
} from "lucide-react";

import {
  getOrder,
  cancelOrder,
  advanceOrderStatus,
} from "../../services/orderService";
import { generateOrderInvoice } from "../../services/taskService";
import { useTaskStore } from "../../stores/taskStore";
import { getProductImageUrl, handleImageError } from "../../utils/imageUrl";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import "./orders.css";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: order,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: Boolean(orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["order", orderId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => {
      console.error("Cancel order error:", err);
      alert(err.response?.data?.detail || "Failed to cancel order.");
    },
  });

  const advanceMutation = useMutation({
    mutationFn: () => advanceOrderStatus(Number(orderId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const addTask = useTaskStore((state) => state.addTask);
  const tasks = useTaskStore((state) => state.tasks);

  const activeInvoiceTask = tasks.find(
    (t) => t.type === "invoice" && t.metadata?.orderId === Number(orderId)
  );

  const handleGenerateInvoice = async () => {
    setInvoiceLoading(true);
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
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleCancel = () => {
    const confirmed = window.confirm(
      `Are you sure you wish to cancel Order #ORD-${orderId}?`
    );
    if (!confirmed) return;
    cancelMutation.mutate();
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(`#ORD-${orderId}`);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const error =
    queryError?.response?.data?.detail ||
    (isError ? "Unable to load order details." : "") ||
    cancelMutation.error?.response?.data?.detail ||
    "";

  if (isLoading) {
    return (
      <div className="orders-page-container">
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <div className="modern-spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#64748B", fontSize: "14px", fontWeight: 600 }}>
            Retrieving authenticated order details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="orders-page-container">
        <div className="orders-empty-state-card">
          <div className="empty-order-icon-circle">
            <AlertCircle size={32} />
          </div>
          <h2 className="empty-orders-title">Order Dossier Not Found</h2>
          <p className="empty-orders-desc">
            {error || "The requested order could not be retrieved from the store registry."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="btn-action-primary-black"
            style={{ marginTop: "12px" }}
          >
            <ArrowLeft size={16} /> Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = (order.status || "").toUpperCase() === "CANCELLED";
  const isDelivered = (order.status || "").toUpperCase() === "DELIVERED";
  const items = order.items || order.order_items || [];

  const getStepperStatus = () => {
    const s = (order.status || "").toUpperCase();
    if (s === "CANCELLED") return { width: "0%", activeIndex: -1 };
    if (s === "DELIVERED" || s === "COMPLETED") return { width: "100%", activeIndex: 3 };
    if (s === "SHIPPED") return { width: "66%", activeIndex: 2 };
    if (s === "PROCESSING") return { width: "33%", activeIndex: 1 };
    return { width: "0%", activeIndex: 0 };
  };

  const stepper = getStepperStatus();

  return (
    <div className="orders-page-container">
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: "24px" }}>
        <Link
          to="/orders"
          className="btn-order-action-pill btn-action-secondary-white"
          style={{ width: "fit-content" }}
        >
          <ArrowLeft size={15} /> Back to My Orders
        </Link>
      </div>

      {/* Main Order Dossier Card */}
      <article className="order-dossier-card" style={{ marginBottom: "28px" }}>
        {/* Header Bar */}
        <div className="order-dossier-header">
          <div className="order-identity-block">
            <div className="order-package-avatar">
              <Package size={22} />
            </div>
            <div>
              <div className="order-id-title-row">
                <h1 className="order-reference-tag" style={{ fontSize: "22px" }}>
                  Receipt Dossier #ORD-{order.id}
                </h1>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="btn-copy-order-id"
                  title="Copy Order ID"
                >
                  {copiedId ? (
                    <Check size={16} style={{ color: "#059669" }} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <div className="order-timestamp-row">
                <Clock size={13} />
                <span>
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
                </span>
              </div>
            </div>
          </div>

          <div className="order-header-status-side">
            {/* Generate / Download Invoice */}
            <button
              type="button"
              disabled={invoiceLoading || activeInvoiceTask?.state === "PROGRESS"}
              onClick={handleGenerateInvoice}
              className="btn-order-action-pill btn-action-secondary-white"
            >
              {invoiceLoading || activeInvoiceTask?.state === "PROGRESS" ? (
                <>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Generating Invoice ({activeInvoiceTask?.progress || 10}%)...</span>
                </>
              ) : activeInvoiceTask?.state === "SUCCESS" ? (
                <>
                  <Download size={14} />
                  <span>Download PDF Invoice</span>
                </>
              ) : (
                <>
                  <FileText size={14} />
                  <span>Official Invoice</span>
                </>
              )}
            </button>

            {/* Status Badge */}
            {isCancelled ? (
              <span className="luxury-status-badge status-badge-cancelled">
                <AlertCircle size={14} />
                <span>Cancelled</span>
              </span>
            ) : isDelivered ? (
              <span className="luxury-status-badge status-badge-delivered">
                <CheckCircle2 size={14} />
                <span>Delivered</span>
              </span>
            ) : (order.status || "").toUpperCase() === "SHIPPED" ? null : (
              <span className="luxury-status-badge status-badge-processing">
                <Clock size={14} />
                <span>Processing Order</span>
              </span>
            )}
          </div>
        </div>

        {/* Real-time Fulfillment Stepper */}
        {!isCancelled ? (
          <div className="shipment-stepper-wrap">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#059669",
                    boxShadow: "0 0 8px #059669",
                  }}
                />
                <strong style={{ fontSize: "13px", color: "#0F172A" }}>
                  Live Fulfillment Tracker
                </strong>
                <span
                  style={{
                    fontSize: "11px",
                    background: "rgba(172, 208, 192, 0.3)",
                    color: "#0F172A",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontWeight: 700,
                  }}
                >
                  ⚡ Real-Time Sync Active
                </span>
              </div>

              {!isDelivered && (
                <button
                  type="button"
                  onClick={() => advanceMutation.mutate()}
                  disabled={advanceMutation.isPending}
                  className="btn-order-action-pill btn-action-primary-black"
                  style={{ fontSize: "11px", padding: "5px 12px" }}
                  title="Simulate fulfillment state progression"
                >
                  <Zap size={12} />
                  <span>
                    {advanceMutation.isPending
                      ? "Syncing State..."
                      : "Advance Stage (Demo)"}
                  </span>
                </button>
              )}
            </div>

            <div className="stepper-progress-bar-row">
              <div className="stepper-line-track" />
              <div
                className="stepper-line-progress"
                style={{ width: stepper.width }}
              />

              {[
                { label: "Order Placed", step: 1 },
                { label: "Bespoke Tailoring", step: 2 },
                { label: "Courier In Transit", step: 3 },
                { label: "Delivered", step: 4 },
              ].map((stage, idx) => {
                const isPassed = stepper.activeIndex >= idx;
                const isCurrent = stepper.activeIndex === idx;
                return (
                  <div
                    key={stage.label}
                    className={`stepper-node-item ${
                      isPassed ? "completed" : ""
                    } ${isCurrent ? "current" : ""}`}
                  >
                    <div className="stepper-node-circle">
                      {isPassed && stepper.activeIndex > idx ? (
                        <Check size={12} />
                      ) : (
                        stage.step
                      )}
                    </div>
                    <span className="stepper-node-title">{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#FFF1F2",
              border: "1px solid #FECDD3",
              borderRadius: "14px",
              padding: "16px 20px",
              color: "#E11D48",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "13.5px",
              fontWeight: 700,
            }}
          >
            <AlertCircle size={18} />
            <span>
              This order was cancelled. Reserved items have been returned to active catalog inventory.
            </span>
          </div>
        )}

        {/* Ordered Selection Items */}
        <div className="order-items-container">
          <h4 className="order-items-heading">
            Authenticated Items ({items.length})
          </h4>

          {items.map((item, index) => {
            const fallbackImg =
              index % 2 === 0 ? "boys_arch3.jpg" : "accessories_main.jpg";
            const imageUrl = getProductImageUrl(
              item.image_url || item.product_image || item.image
            );

            return (
              <div key={item.id || index} className="order-item-row">
                <div className="order-item-main-details">
                  <div className="order-item-thumb-box">
                    <img
                      src={imageUrl}
                      alt={item.product_name || item.name || "Item"}
                      className="order-item-thumb-img"
                      onError={(e) => handleImageError(e, fallbackImg)}
                    />
                  </div>

                  <div className="order-item-text-info">
                    <h5 className="order-item-name">
                      {item.product_name || item.name || `Arise Piece #${item.product_id}`}
                    </h5>
                    <div className="order-item-meta-pills">
                      <span className="order-item-qty-tag">
                        Qty: {item.quantity}
                      </span>
                      <span>•</span>
                      <span className="order-item-size-pill">
                        Size {item.size || "M"}
                      </span>
                      <span>•</span>
                      <span>${Number(item.price || 0).toFixed(2)} each</span>
                    </div>
                  </div>
                </div>

                <div className="order-item-actions-side">
                  <div className="order-item-total-price">
                    ${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shipping & Payment Summary Grid */}
        <div className="order-dossier-meta-grid">
          <div className="order-meta-column">
            <span className="order-meta-col-title">
              <MapPin size={12} />
              White-Glove Delivery Destination
            </span>
            <strong className="order-shipping-recipient">
              {order.shipping_name || "Valued Client"}
            </strong>
            <p className="order-shipping-full-address">
              {order.shipping_address
                ? `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`
                : "Address on file"}
            </p>
            {order.shipping_phone && (
              <span className="order-shipping-phone-row">
                <Phone size={12} />
                <span>{order.shipping_phone}</span>
              </span>
            )}
          </div>

          <div className="order-meta-column">
            <span className="order-meta-col-title">
              <ShieldCheck size={12} />
              Payment & Invoicing Summary
            </span>
            <div className="order-financial-breakdown">
              <div className="order-finance-line">
                <span>Items Subtotal</span>
                <span>${Number(order.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="order-finance-line">
                <span>Express Courier Shipping</span>
                <span style={{ color: "#059669", fontWeight: 700 }}>
                  Complimentary
                </span>
              </div>
              <div className="order-finance-total-line">
                <span className="order-finance-grand-label">
                  Total Charged
                </span>
                <span className="order-finance-grand-amount">
                  ${Number(order.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {!isCancelled && !isDelivered && (
          <div className="order-dossier-actions-bar">
            <span style={{ fontSize: "13px", color: "#64748B" }}>
              Need assistance with this order? Contact our concierge service anytime.
            </span>
            <button
              type="button"
              disabled={cancelMutation.isPending}
              onClick={handleCancel}
              className="btn-order-action-pill btn-action-cancel"
            >
              <XCircle size={15} />
              <span>
                {cancelMutation.isPending ? "Cancelling..." : "Cancel Order"}
              </span>
            </button>
          </div>
        )}
      </article>
    </div>
  );
}

export default OrderDetails;