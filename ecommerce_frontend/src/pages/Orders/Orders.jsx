import { useState, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ArrowRight,
  MessageCircle,
  FileText,
  Eye,
  Copy,
  Check,
  Search,
  X,
  Download,
  Loader2,
  Sparkles,
  RotateCcw,
  DollarSign,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getOrders, cancelOrder } from "../../services/orderService";
import { generateOrderInvoice } from "../../services/taskService";
import { addToCart } from "../../services/cartService";
import { useTaskStore } from "../../stores/taskStore";
import { useChatStore } from "../../stores/chatStore";
import { getProductImageUrl, handleImageError } from "../../utils/imageUrl";
import ChatPanel from "../../components/common/ChatPanel";
import "./orders.css";

const STATUS_TABS = [
  { id: "ALL", label: "All Orders" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
];

function Orders() {
  const [selectedStatusTab, setSelectedStatusTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [cancellingId, setCancellingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [actionNotice, setActionNotice] = useState("");

  const chatRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const unreadByOrder = useChatStore((state) => state.unreadByOrder);
  const markOrderRead = useChatStore((state) => state.markOrderRead);
  const addTask = useTaskStore((state) => state.addTask);
  const tasks = useTaskStore((state) => state.tasks);

  // 1. Fetch Orders Query
  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const data = await getOrders();
      return Array.isArray(data) ? data : data.orders || [];
    },
  });

  // 2. Executive Customer KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const totalInvested = orders.reduce(
      (sum, ord) => sum + Number(ord.total_amount || 0),
      0
    );
    const deliveredCount = orders.filter(
      (ord) => (ord.status || "").toUpperCase() === "DELIVERED"
    ).length;
    const activeCount = orders.filter((ord) => {
      const s = (ord.status || "").toUpperCase();
      return s === "PENDING" || s === "PROCESSING" || s === "SHIPPED";
    }).length;

    return {
      totalCount,
      totalInvested,
      deliveredCount,
      activeCount,
    };
  }, [orders]);

  // 3. Tab Counts
  const tabCounts = useMemo(() => {
    const counts = {
      ALL: orders.length,
      IN_PROGRESS: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orders.forEach((ord) => {
      const st = (ord.status || "").toUpperCase();
      if (st === "PENDING" || st === "PROCESSING") {
        counts.IN_PROGRESS += 1;
      } else if (st === "SHIPPED") {
        counts.SHIPPED += 1;
      } else if (st === "DELIVERED" || st === "COMPLETED") {
        counts.DELIVERED += 1;
      } else if (st === "CANCELLED") {
        counts.CANCELLED += 1;
      }
    });

    return counts;
  }, [orders]);

  // 4. Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const st = (order.status || "").toUpperCase();

        // Status Filter
        if (selectedStatusTab === "IN_PROGRESS") {
          if (st !== "PENDING" && st !== "PROCESSING") return false;
        } else if (selectedStatusTab === "SHIPPED") {
          if (st !== "SHIPPED") return false;
        } else if (selectedStatusTab === "DELIVERED") {
          if (st !== "DELIVERED" && st !== "COMPLETED") return false;
        } else if (selectedStatusTab === "CANCELLED") {
          if (st !== "CANCELLED") return false;
        }

        // Search Query Filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();

        const matchId = String(order.id).includes(q);
        const matchName = order.shipping_name?.toLowerCase().includes(q);
        const matchCity = order.shipping_city?.toLowerCase().includes(q);
        const matchAddress = order.shipping_address?.toLowerCase().includes(q);
        const matchItems = (order.items || []).some((item) =>
          (item.product_name || "").toLowerCase().includes(q)
        );

        return matchId || matchName || matchCity || matchAddress || matchItems;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return Number(b.id) - Number(a.id);
        if (sortBy === "oldest") return Number(a.id) - Number(b.id);
        if (sortBy === "highest_amount") {
          return Number(b.total_amount || 0) - Number(a.total_amount || 0);
        }
        return 0;
      });
  }, [orders, selectedStatusTab, searchQuery, sortBy]);

  // 5. Cancel Order Mutation
  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onMutate: (orderId) => {
      setCancellingId(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setActionNotice("Order has been cancelled successfully.");
      setTimeout(() => setActionNotice(""), 3500);
    },
    onError: (err) => {
      console.error("Cancel order error:", err);
      alert(err.response?.data?.detail || "Unable to cancel this order.");
    },
    onSettled: () => {
      setCancellingId(null);
    },
  });

  const handleCancel = (orderId) => {
    const confirmed = window.confirm(
      `Are you sure you wish to cancel Order #ORD-${orderId}?`
    );
    if (!confirmed) return;
    cancelMutation.mutate(orderId);
  };

  // 6. Generate Invoice
  const handleGenerateInvoice = async (orderId) => {
    try {
      const data = await generateOrderInvoice(orderId);
      addTask({
        taskId: data.task_id,
        type: "invoice",
        title: `Invoice Order #${orderId}`,
        metadata: { orderId: Number(orderId) },
      });
      setActionNotice(`Generating invoice for Order #ORD-${orderId}...`);
      setTimeout(() => setActionNotice(""), 4000);
    } catch (err) {
      console.error("Failed to generate invoice:", err);
      alert(err.response?.data?.detail || "Failed to trigger invoice generation.");
    }
  };

  // 7. Quick Reorder / Buy Again
  const handleBuyAgain = async (item) => {
    try {
      await addToCart(item.product_id, 1, item.size || "M");
      setActionNotice(`Added "${item.product_name || 'Item'}" (Size: ${item.size || 'M'}) to your cart!`);
      setTimeout(() => setActionNotice(""), 3500);
    } catch (err) {
      setActionNotice(
        err.response?.data?.detail || "Could not add item to cart."
      );
      setTimeout(() => setActionNotice(""), 3500);
    }
  };

  // 8. Copy Order Reference
  const handleCopyOrderId = (id) => {
    navigator.clipboard.writeText(`#ORD-${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 9. Chat Toggle
  const handleChatClick = (orderId) => {
    if (activeOrderId === orderId) {
      setActiveOrderId(null);
    } else {
      setActiveOrderId(orderId);
      markOrderRead(orderId);
      setTimeout(() => {
        chatRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") {
      return (
        <span className="luxury-status-badge status-badge-delivered">
          <CheckCircle2 size={13} />
          <span>Delivered</span>
        </span>
      );
    }
    // "In Transit" badge removed as requested
    if (s === "SHIPPED") {
      return null;
    }
    if (s === "CANCELLED") {
      return (
        <span className="luxury-status-badge status-badge-cancelled">
          <AlertCircle size={13} />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="luxury-status-badge status-badge-processing">
        <Clock size={13} />
        <span>{s === "PROCESSING" ? "Tailoring & Packing" : "Order Placed"}</span>
      </span>
    );
  };

  // Stepper Calculation Helper
  const getStepperProgress = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "CANCELLED") return { width: "0%", activeIndex: -1, isCancelled: true };
    if (s === "DELIVERED" || s === "COMPLETED") return { width: "100%", activeIndex: 3 };
    if (s === "SHIPPED") return { width: "66%", activeIndex: 2 };
    if (s === "PROCESSING") return { width: "33%", activeIndex: 1 };
    return { width: "0%", activeIndex: 0 };
  };

  if (isLoading) {
    return (
      <div className="orders-page-container">
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <div className="modern-spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#64748B", fontSize: "14px", fontWeight: 600 }}>
            Retrieving your luxury purchase history...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="orders-page-container">
        <div className="orders-empty-state-card">
          <div className="empty-order-icon-circle">
            <AlertCircle size={32} />
          </div>
          <h2 className="empty-orders-title">Unable to Load Orders</h2>
          <p className="empty-orders-desc">
            Please verify you are signed into your account.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-action-primary-black"
            style={{ marginTop: "12px" }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-container">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="modern-toast-notification">
          <Sparkles size={16} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* --- Section Header Row --- */}
      <div className="orders-header-row">
        <div className="orders-title-group">
          <span className="orders-kicker-pill">
            ✦ Client Purchase Dossier
          </span>
          <h1 className="orders-main-heading">
            My Orders & Shipments
          </h1>
          <p className="orders-sub-heading">
            Track real-time fulfillment, view authenticated purchase details, and access official invoices.
          </p>
        </div>

        <Link to="/products" className="btn-orders-continue">
          <span>Continue Shopping</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* --- Executive Customer KPI Metrics --- */}
      <div className="orders-kpi-grid">
        <div className="order-kpi-box">
          <div className="order-kpi-icon-wrap">
            <Package size={20} />
          </div>
          <div className="order-kpi-meta">
            <span className="order-kpi-label">Total Orders</span>
            <span className="order-kpi-value">{metrics.totalCount}</span>
          </div>
        </div>

        <div className="order-kpi-box">
          <div className="order-kpi-icon-wrap">
            <Truck size={20} />
          </div>
          <div className="order-kpi-meta">
            <span className="order-kpi-label">Active In Transit</span>
            <span className="order-kpi-value">{metrics.activeCount}</span>
          </div>
        </div>

        <div className="order-kpi-box">
          <div className="order-kpi-icon-wrap">
            <CheckCircle2 size={20} />
          </div>
          <div className="order-kpi-meta">
            <span className="order-kpi-label">Delivered</span>
            <span className="order-kpi-value">{metrics.deliveredCount}</span>
          </div>
        </div>

        <div className="order-kpi-box">
          <div className="order-kpi-icon-wrap">
            <DollarSign size={20} />
          </div>
          <div className="order-kpi-meta">
            <span className="order-kpi-label">Total Invested</span>
            <span className="order-kpi-value">
              ${metrics.totalInvested.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* --- Filter Bar & Search Controls --- */}
      <div className="orders-controls-panel">
        <div className="orders-status-tabs">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatusTab === tab.id;
            const count = tabCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatusTab(tab.id)}
                className={`order-status-tab-btn ${isActive ? "active" : ""}`}
              >
                <span>{tab.label}</span>
                <span className="order-tab-counter">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="orders-filter-actions">
          <div className="orders-search-box">
            <Search size={14} className="orders-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by #ID, item, or city..."
              className="orders-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="orders-clear-search-btn"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="orders-sort-select"
          >
            <option value="newest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_amount">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* --- Orders Content Stack --- */}
      {filteredOrders.length === 0 ? (
        <div className="orders-empty-state-card">
          <div className="empty-order-icon-circle">
            <Package size={36} />
          </div>
          <h2 className="empty-orders-title">
            {searchQuery || selectedStatusTab !== "ALL"
              ? "No Matching Orders Found"
              : "No Orders Placed Yet"}
          </h2>
          <p className="empty-orders-desc">
            {searchQuery || selectedStatusTab !== "ALL"
              ? "Try adjusting your search terms or status filter."
              : "Discover bespoke tailoring, fine accessories, and pure botanical beauty in our collection."}
          </p>
          <Link
            to="/products"
            className="btn-orders-continue"
            style={{ marginTop: "12px" }}
          >
            Explore Curated Collection
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="orders-list-stack">
          {filteredOrders.map((order) => {
            const isCancelled =
              (order.status || "").toUpperCase() === "CANCELLED";
            const isCancellable =
              (order.status || "").toUpperCase() === "PENDING" ||
              (order.status || "").toUpperCase() === "PROCESSING";

            const stepper = getStepperProgress(order.status);
            const items = order.items || [];

            const activeInvoice = tasks.find(
              (t) =>
                t.type === "invoice" && t.metadata?.orderId === Number(order.id)
            );

            return (
              <article key={order.id} className="order-dossier-card">
                {/* 1. Header */}
                <div className="order-dossier-header">
                  <div className="order-identity-block">
                    <div className="order-package-avatar">
                      <Package size={20} />
                    </div>
                    <div>
                      <div className="order-id-title-row">
                        <h3 className="order-reference-tag">
                          Order #ORD-{order.id}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderId(order.id)}
                          className="btn-copy-order-id"
                          title="Copy Order ID"
                        >
                          {copiedId === order.id ? (
                            <Check size={14} style={{ color: "#059669" }} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      <div className="order-timestamp-row">
                        <Clock size={12} />
                        <span>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "Recently Placed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="order-header-status-side">
                    {renderStatusBadge(order.status)}

                    {/* Support Chat Trigger with Unread Bubble */}
                    <button
                      type="button"
                      onClick={() => handleChatClick(order.id)}
                      className="btn-order-chat"
                      title="Open Real-time Chat regarding this order"
                    >
                      <MessageCircle size={14} />
                      <span>Chat</span>
                      {unreadByOrder[order.id] > 0 && (
                        <span className="chat-unread-badge">
                          {unreadByOrder[order.id]}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Visual Shipment Stepper */}
                {!isCancelled && (
                  <div className="shipment-stepper-wrap">
                    <div className="stepper-progress-bar-row">
                      <div className="stepper-line-track" />
                      <div
                        className="stepper-line-progress"
                        style={{ width: stepper.width }}
                      />

                      {/* Step 1: Placed */}
                      <div
                        className={`stepper-node-item ${
                          stepper.activeIndex >= 0 ? "completed" : ""
                        } ${stepper.activeIndex === 0 ? "current" : ""}`}
                      >
                        <div className="stepper-node-circle">
                          {stepper.activeIndex > 0 ? (
                            <Check size={12} />
                          ) : (
                            "1"
                          )}
                        </div>
                        <span className="stepper-node-title">Placed</span>
                      </div>

                      {/* Step 2: Processing */}
                      <div
                        className={`stepper-node-item ${
                          stepper.activeIndex >= 1 ? "completed" : ""
                        } ${stepper.activeIndex === 1 ? "current" : ""}`}
                      >
                        <div className="stepper-node-circle">
                          {stepper.activeIndex > 1 ? (
                            <Check size={12} />
                          ) : (
                            "2"
                          )}
                        </div>
                        <span className="stepper-node-title">
                          Tailoring & Inspection
                        </span>
                      </div>

                      {/* Step 3: Shipped */}
                      <div
                        className={`stepper-node-item ${
                          stepper.activeIndex >= 2 ? "completed" : ""
                        } ${stepper.activeIndex === 2 ? "current" : ""}`}
                      >
                        <div className="stepper-node-circle">
                          {stepper.activeIndex > 2 ? (
                            <Check size={12} />
                          ) : (
                            "3"
                          )}
                        </div>
                        <span className="stepper-node-title">In Transit</span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div
                        className={`stepper-node-item ${
                          stepper.activeIndex >= 3 ? "completed" : ""
                        } ${stepper.activeIndex === 3 ? "current" : ""}`}
                      >
                        <div className="stepper-node-circle">
                          {stepper.activeIndex >= 3 ? (
                            <Check size={12} />
                          ) : (
                            "4"
                          )}
                        </div>
                        <span className="stepper-node-title">Delivered</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Ordered Products Dossier */}
                <div className="order-items-container">
                  <h4 className="order-items-heading">
                    Ordered Selection ({items.length} {items.length === 1 ? "Item" : "Items"})
                  </h4>

                  {items.map((item, idx) => {
                    const fallbackImg =
                      idx % 2 === 0 ? "boys_arch3.jpg" : "accessories_main.jpg";
                    const imageUrl = getProductImageUrl(item.image_url);

                    return (
                      <div key={item.id || idx} className="order-item-row">
                        <div className="order-item-main-details">
                          <div className="order-item-thumb-box">
                            <img
                              src={imageUrl}
                              alt={item.product_name || "Arise Luxury Item"}
                              className="order-item-thumb-img"
                              onError={(e) => handleImageError(e, fallbackImg)}
                            />
                          </div>

                          <div className="order-item-text-info">
                            <h5 className="order-item-name">
                              {item.product_name || "Arise Bespoke Piece"}
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
                          <button
                            type="button"
                            onClick={() => handleBuyAgain(item)}
                            className="btn-buy-again-pill"
                            title="Add item to shopping bag again"
                          >
                            <RotateCcw size={12} />
                            <span>Buy Again</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 4. Shipping Address & Financial Breakdown */}
                <div className="order-dossier-meta-grid">
                  <div className="order-meta-column">
                    <span className="order-meta-col-title">
                      <MapPin size={12} />
                      Shipping Destination
                    </span>
                    <strong className="order-shipping-recipient">
                      {order.shipping_name || "Valued Client"}
                    </strong>
                    <p className="order-shipping-full-address">
                      {order.shipping_address
                        ? `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}`
                        : "Express Courier Destination on File"}
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
                      Payment & Fulfillment Dossier
                    </span>
                    <div className="order-financial-breakdown">
                      <div className="order-finance-line">
                        <span>Items Subtotal</span>
                        <span>${Number(order.total_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="order-finance-line">
                        <span>White-Glove Courier</span>
                        <span style={{ color: "#059669", fontWeight: 700 }}>
                          Complimentary
                        </span>
                      </div>
                      <div className="order-finance-total-line">
                        <span className="order-finance-grand-label">
                          Grand Total
                        </span>
                        <span className="order-finance-grand-amount">
                          ${Number(order.total_amount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Card Actions Bar */}
                <div className="order-dossier-actions-bar">
                  <div className="order-actions-left-group">
                    {/* View Details Link */}
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn-order-action-pill btn-action-secondary-white"
                    >
                      <Eye size={14} />
                      <span>View Receipt Details</span>
                    </Link>

                    {/* Generate / Download Invoice */}
                    <button
                      type="button"
                      onClick={() => handleGenerateInvoice(order.id)}
                      disabled={activeInvoice?.state === "PROGRESS"}
                      className="btn-order-action-pill btn-action-secondary-white"
                      title="Download official PDF invoice"
                    >
                      {activeInvoice?.state === "PROGRESS" ? (
                        <>
                          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          <span>Generating Invoice ({activeInvoice?.progress || 10}%)...</span>
                        </>
                      ) : activeInvoice?.state === "SUCCESS" ? (
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
                  </div>

                  <div className="order-actions-right-group">
                    {/* Cancel Order (if eligible) */}
                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        className="btn-order-action-pill btn-action-cancel"
                      >
                        <X size={14} />
                        <span>
                          {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* --- Embedded Support Chat Panel --- */}
      {activeOrderId && (
        <div ref={chatRef} className="order-chat-embed-container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageCircle size={18} />
              <strong style={{ fontSize: "16px" }}>
                Concierge Live Chat — Order #ORD-{activeOrderId}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setActiveOrderId(null)}
              className="orders-clear-search-btn"
              style={{ padding: "6px" }}
              title="Close chat panel"
            >
              <X size={18} />
            </button>
          </div>
          <ChatPanel adminId={1} orderId={activeOrderId} />
        </div>
      )}
    </div>
  );
}

export default Orders;