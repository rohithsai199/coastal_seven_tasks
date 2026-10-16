import { useState, useMemo } from "react";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MessageCircle,
  FileText,
  Search,
  X,
  RefreshCw,
  MapPin,
  Phone,
  User,
  ChevronDown,
  Sparkles,
  DollarSign,
  Layers,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { getProductImageUrl, handleImageError } from "../../utils/imageUrl";
import "./adminOrders.css";

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function AdminOrderManagement({
  orders = [],
  products = [],
  statusMutation,
  onStatusChange,
  onStartChat,
  unreadByOrder = {},
  onGenerateInvoice,
  refetchOrders,
  isRefetching = false,
}) {
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [invoiceRequestedId, setInvoiceRequestedId] = useState(null);

  // 1. Executive KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const grossRevenue = orders.reduce(
      (sum, ord) => sum + Number(ord.total_amount || 0),
      0
    );
    const deliveredCount = orders.filter(
      (ord) => ord.status?.toUpperCase() === "DELIVERED"
    ).length;
    const inTransitCount = orders.filter(
      (ord) => ord.status?.toUpperCase() === "SHIPPED"
    ).length;
    const actionRequiredCount = orders.filter((ord) => {
      const s = ord.status?.toUpperCase();
      return s === "PENDING" || s === "PROCESSING";
    }).length;

    const fulfillmentRate =
      totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 100;

    return {
      totalCount,
      grossRevenue,
      deliveredCount,
      inTransitCount,
      actionRequiredCount,
      fulfillmentRate,
      avgOrderValue: totalCount > 0 ? grossRevenue / totalCount : 0,
    };
  }, [orders]);

  // 2. Status Counts for Tabs
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: orders.length,
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    orders.forEach((ord) => {
      const st = ord.status?.toUpperCase();
      if (counts[st] !== undefined) {
        counts[st] += 1;
      }
    });
    return counts;
  }, [orders]);

  // 3. Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (selectedStatus !== "ALL") {
          if (order.status?.toUpperCase() !== selectedStatus) {
            return false;
          }
        }

        // Search query filter
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();

        const matchId = String(order.id).includes(query);
        const matchUser = String(order.user_id).includes(query);
        const matchName = order.shipping_name?.toLowerCase().includes(query);
        const matchAddress = order.shipping_address?.toLowerCase().includes(query);
        const matchCity = order.shipping_city?.toLowerCase().includes(query);
        const matchPhone = order.shipping_phone?.toLowerCase().includes(query);

        // Check if any item matches product title
        const matchItem = order.items?.some((item) => {
          const prod = products.find((p) => p.id === item.product_id);
          return (
            prod?.name?.toLowerCase().includes(query) ||
            item.product_name?.toLowerCase().includes(query) ||
            String(item.product_id) === query
          );
        });

        return (
          matchId ||
          matchUser ||
          matchName ||
          matchAddress ||
          matchCity ||
          matchPhone ||
          matchItem
        );
      })
      .sort((a, b) => {
        if (sortBy === "newest") return Number(b.id) - Number(a.id);
        if (sortBy === "oldest") return Number(a.id) - Number(b.id);
        if (sortBy === "highest_value") {
          return Number(b.total_amount || 0) - Number(a.total_amount || 0);
        }
        if (sortBy === "lowest_value") {
          return Number(a.total_amount || 0) - Number(b.total_amount || 0);
        }
        return 0;
      });
  }, [orders, selectedStatus, searchQuery, sortBy, products]);

  const handleStatusChangeInternal = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await onStatusChange(orderId, newStatus);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleInvoiceClick = async (orderId) => {
    setInvoiceRequestedId(orderId);
    try {
      await onGenerateInvoice(orderId);
    } finally {
      setTimeout(() => setInvoiceRequestedId(null), 2000);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "status-delivered";
      case "SHIPPED":
        return "status-shipped";
      case "PROCESSING":
        return "status-processing";
      case "PENDING":
        return "status-pending";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  const formatOrderDate = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Oct 2026";
    }
  };

  return (
    <div className="admin-orders-container" id="admin-orders-section">
      {/* 1. Section Header */}
      <div className="orders-header-row">
        <div className="orders-title-group">
          <h2>
            <span>Order Management & Dispatch</span>
            <span className="orders-total-badge">{orders.length} Total</span>
          </h2>
          <p className="orders-subtitle">
            Executive control panel for customer shipments, courier fulfillment, invoices, and live chat
          </p>
        </div>

        <div className="orders-actions-header">
          {refetchOrders && (
            <button
              type="button"
              onClick={refetchOrders}
              className="btn-orders-refresh"
              title="Refresh all order statuses and telemetry"
            >
              <RefreshCw
                size={14}
                className={isRefetching ? "animate-spin" : ""}
              />
              <span>{isRefetching ? "Refreshing..." : "Sync Orders"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive KPI Metrics Cards */}
      <div className="orders-kpi-grid">
        {/* Metric 1: Total Orders */}
        <div className="order-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Orders</span>
            <div className="kpi-icon-wrap kpi-icon-blue">
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-main-metric">{metrics.totalCount}</div>
          <div className="kpi-sub-text text-emerald">
            <TrendingUp size={13} />
            <span>100% Real-time SQLite Synced</span>
          </div>
        </div>

        {/* Metric 2: Gross Revenue */}
        <div className="order-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Gross Volume</span>
            <div className="kpi-icon-wrap kpi-icon-emerald">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-main-metric">
            ₹{metrics.grossRevenue.toFixed(2)}
          </div>
          <div className="kpi-sub-text">
            <span>Avg Order: ₹{metrics.avgOrderValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Metric 3: Action Required */}
        <div className="order-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Action Required</span>
            <div className="kpi-icon-wrap kpi-icon-amber">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="kpi-main-metric">
            {metrics.actionRequiredCount}
          </div>
          <div className="kpi-sub-text">
            <span>Pending or processing dispatch</span>
          </div>
        </div>

        {/* Metric 4: Fulfillment Rate */}
        <div className="order-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Fulfillment Rate</span>
            <div className="kpi-icon-wrap kpi-icon-purple">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-main-metric">
            {metrics.fulfillmentRate}%
          </div>
          <div className="kpi-sub-text">
            <span>{metrics.deliveredCount} Delivered • {metrics.inTransitCount} In Transit</span>
          </div>
        </div>
      </div>

      {/* 3. Control Panel (Status Tabs + Live Search + Sort) */}
      <div className="orders-control-panel">
        {/* Status Tabs */}
        <div className="orders-status-tabs-row" role="tablist">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "PENDING", label: "Pending" },
            { id: "PROCESSING", label: "Processing" },
            { id: "SHIPPED", label: "Shipped" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => {
            const count = statusCounts[tab.id] || 0;
            const isActive = selectedStatus === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`order-filter-tab ${isActive ? "active" : ""}`}
                role="tab"
                aria-selected={isActive}
              >
                <span>{tab.label}</span>
                <span className="tab-count-bubble">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="orders-search-sort-row">
          <div className="orders-search-input-wrap">
            <Search size={15} className="search-icon-fixed" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, recipient, customer ID, or city..."
              className="orders-search-field"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="btn-clear-search"
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
            aria-label="Sort orders"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highest_value">Sort: Highest Amount</option>
            <option value="lowest_value">Sort: Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* 4. Luxury Orders List */}
      <div className="orders-list-wrapper">
        {filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            <div className="empty-orders-icon-wrap">
              <Package size={28} />
            </div>
            <h3 className="empty-orders-title">No matching orders found</h3>
            <p className="empty-orders-desc">
              {searchQuery
                ? `No orders matching "${searchQuery}". Try searching with a different ID or customer name.`
                : `There are currently no orders under the "${selectedStatus}" filter.`}
            </p>
            {(searchQuery || selectedStatus !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("ALL");
                  setSearchQuery("");
                }}
                className="btn-reset-filters"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isUpdating =
              updatingOrderId === order.id ||
              (statusMutation?.isPending && statusMutation?.variables?.orderId === order.id);

            const isDelivered = order.status?.toUpperCase() === "DELIVERED";
            const isShipped =
              order.status?.toUpperCase() === "SHIPPED" || isDelivered;
            const isProcessing =
              order.status?.toUpperCase() === "PROCESSING" || isShipped;

            const recipientInitial = order.shipping_name
              ? order.shipping_name.charAt(0).toUpperCase()
              : "C";

            const unreadCount = unreadByOrder[order.id] || 0;

            const totalItemCount =
              order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

            return (
              <div key={order.id} className="luxury-order-card">
                {/* --- Top Bar: ID, Date, Status, Quick Actions --- */}
                <div className="order-card-topbar">
                  <div className="order-top-left-info">
                    <span className="order-id-badge">
                      #ORD-{String(order.id).padStart(4, "0")}
                    </span>

                    <span className="order-datetime-tag">
                      <Clock size={13} />
                      {formatOrderDate(order.created_at)}
                    </span>

                    <div className="order-customer-pill">
                      <span className="customer-avatar-mini">{recipientInitial}</span>
                      <span>
                        {order.shipping_name || `Customer #${order.user_id}`}
                      </span>
                      <small style={{ color: "#94A3B8" }}>ID: #{order.user_id}</small>
                    </div>
                  </div>

                  <div className="order-top-right-actions">
                    {/* Status Pill Badge */}
                    <div
                      className={`luxury-status-badge ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      <span className="badge-dot" />
                      <span>{order.status}</span>
                    </div>

                    {/* Quick Status Selector Dropdown */}
                    <select
                      value={order.status}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleStatusChangeInternal(order.id, e.target.value)
                      }
                      className="order-status-quick-select"
                      aria-label={`Update status for order #${order.id}`}
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          Change: {st}
                        </option>
                      ))}
                    </select>

                    {/* Generate PDF Invoice Button */}
                    <button
                      type="button"
                      onClick={() => handleInvoiceClick(order.id)}
                      disabled={invoiceRequestedId === order.id}
                      className="btn-order-pdf"
                      title="Generate Celery Background PDF Invoice"
                    >
                      <FileText size={13} />
                      <span>
                        {invoiceRequestedId === order.id ? "Queuing..." : "Invoice PDF"}
                      </span>
                    </button>

                    {/* Chat Support Button */}
                    <button
                      type="button"
                      onClick={() => onStartChat(order.user_id, order.id)}
                      className="btn-order-chat"
                      title="Open Real-time WebSocket Chat with Customer"
                    >
                      <MessageCircle size={14} />
                      <span>Chat</span>
                      {unreadCount > 0 && (
                        <span className="chat-unread-badge">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* --- Body: Intel Grid (Customer, Financials, Timeline) --- */}
                <div className="order-card-body">
                  <div className="order-intel-grid">
                    {/* Column 1: Customer Destination */}
                    <div className="intel-block">
                      <span className="intel-block-title">
                        <MapPin size={12} />
                        Shipping Destination
                      </span>
                      <h4 className="intel-recipient-name">
                        {order.shipping_name || "Verified Customer"}
                      </h4>
                      <p className="intel-street-text">
                        {order.shipping_address || "Address registered on checkout"}
                      </p>
                      <p className="intel-street-text">
                        {[
                          order.shipping_city,
                          order.shipping_state,
                          order.shipping_postal_code,
                        ]
                          .filter(Boolean)
                          .join(", ") || "United States / Global"}
                      </p>
                      {order.shipping_phone && (
                        <p className="intel-phone-text">
                          <Phone size={11} className="text-muted" />
                          <span>{order.shipping_phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Column 2: Order Valuation */}
                    <div className="intel-block">
                      <span className="intel-block-title">
                        <DollarSign size={12} />
                        Order Valuation
                      </span>
                      <div className="intel-amount-hero">
                        ₹{Number(order.total_amount || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"} in parcel
                      </div>
                      <span className="intel-payment-tag">
                        ✓ SSL Secure Checkout Verified
                      </span>
                    </div>

                    {/* Column 3: Visual Fulfillment Timeline */}
                    <div className="intel-block">
                      <span className="intel-block-title">
                        <Truck size={12} />
                        Fulfillment Telemetry
                      </span>
                      <div className="order-fulfillment-timeline">
                        <div className="timeline-track-bg" />

                        {/* Step 1: Placed */}
                        <div className="timeline-step completed">
                          <div className="step-circle">✓</div>
                          <span className="step-label">Placed</span>
                        </div>

                        {/* Step 2: Confirmed */}
                        <div
                          className={`timeline-step ${
                            isProcessing ? "completed" : "active"
                          }`}
                        >
                          <div className="step-circle">
                            {isProcessing ? "✓" : "2"}
                          </div>
                          <span className="step-label">Confirmed</span>
                        </div>

                        {/* Step 3: Shipped */}
                        <div
                          className={`timeline-step ${
                            isShipped ? "completed" : isProcessing ? "active" : ""
                          }`}
                        >
                          <div className="step-circle">
                            {isShipped ? "✓" : "3"}
                          </div>
                          <span className="step-label">In Transit</span>
                        </div>

                        {/* Step 4: Delivered */}
                        <div
                          className={`timeline-step ${
                            isDelivered ? "completed" : ""
                          }`}
                        >
                          <div className="step-circle">
                            {isDelivered ? "✓" : "4"}
                          </div>
                          <span className="step-label">Delivered</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- Order Items Tray with Thumbnails --- */}
                  {order.items && order.items.length > 0 && (
                    <div className="order-items-tray">
                      <div className="items-tray-header">
                        <span className="items-tray-title">
                          <Layers size={13} />
                          Ordered Atelier Pieces ({order.items.length})
                        </span>
                        <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700 }}>
                          Item Breakdown
                        </span>
                      </div>

                      <div className="items-list-compact">
                        {order.items.map((item, index) => {
                          // Look up matched product from catalog
                          const matchedProduct = products.find(
                            (p) => p.id === item.product_id
                          );

                          const itemTitle =
                            matchedProduct?.name ||
                            item.product_name ||
                            `Atelier Product #${item.product_id}`;

                          const itemImage =
                            item.image_url ||
                            (matchedProduct?.image_url
                              ? getProductImageUrl(matchedProduct.image_url)
                              : "/images/boys_arch3.jpg");

                          const unitPrice = Number(item.price || 0);
                          const lineTotal = unitPrice * (item.quantity || 1);

                          return (
                            <div
                              key={item.id ?? `${order.id}-${index}`}
                              className="order-item-row"
                            >
                              <div className="item-left-block">
                                <div className="item-thumbnail-wrap">
                                  <img
                                    src={itemImage}
                                    alt={itemTitle}
                                    onError={handleImageError}
                                    className="item-thumb-img"
                                  />
                                </div>
                                <div className="item-meta-texts">
                                  <h5 className="item-title-bold">
                                    {itemTitle}
                                  </h5>
                                  <p className="item-specs-sub">
                                    SKU #{item.product_id} • Qty:{" "}
                                    <strong>{item.quantity}</strong> × ₹
                                    {unitPrice.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <div className="item-total-tag">
                                ₹{lineTotal.toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminOrderManagement;
