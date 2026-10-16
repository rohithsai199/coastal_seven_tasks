import { useState, useRef, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import {
  MessageCircle,
  UploadCloud,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Sparkles,
  Package,
  Activity,
  Layers,
  Trash2,
  ExternalLink,
  ShoppingBag,
  ShieldCheck,
  RefreshCw,
  Clock,
  Play,
  Image as ImageIcon,
  X,
  Upload,
  Palette,
  RotateCcw,
} from "lucide-react";
import { getProductImageUrl } from "../../utils/imageUrl";

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const EMPTY_FORM = {
  name: "",
  price: "",
  stock: "",
  description: "",
  image: null,
  imagePreview: "",
};

import { useAuthStore } from "../../stores/authStore";
import { getChatHistory, getConversations } from "../../services/chatService";
import { useChatStore } from "../../stores/chatStore";
import {
  bulkImportCsv,
  downloadCsvTemplate,
  generateOrderInvoice,
} from "../../services/taskService";
import { useTaskStore } from "../../stores/taskStore";
import {
  generateProductDescription,
  dispatchAsyncQuotaAuditTask,
} from "../../services/aiService";
import AIGovernanceDashboard from "../../components/ai/AIGovernanceDashboard";
import AdminOrderManagement from "./AdminOrderManagement";
import AdminProductManagement from "./AdminProductManagement";
import AdminStorefrontCustomizer from "./AdminStorefrontCustomizer";
import "./adminOrders.css";

function Admin() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const chatSectionRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "all";
  const [auditingAi, setAuditingAi] = useState(false);

  // Background Task & CSV Import States
  const addTask = useTaskStore((state) => state.addTask);
  const tasks = useTaskStore((state) => state.tasks);
  const removeTask = useTaskStore((state) => state.removeTask);
  const clearCompleted = useTaskStore((state) => state.clearCompleted);
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvCurrentTaskId, setCsvCurrentTaskId] = useState(null);
  const [csvFeedback, setCsvFeedback] = useState({ type: "", message: "" });
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleTriggerAiAudit = async () => {
    setAuditingAi(true);
    try {
      const res = await dispatchAsyncQuotaAuditTask();
      addTask({
        taskId: res.task_id,
        type: "quota_audit",
        title: "Celery AI Quota & Spend Audit",
        metadata: { triggeredBy: user?.email || "admin" },
      });
    } catch (err) {
      console.error("Audit error:", err);
      alert(err.response?.data?.detail || "Failed to trigger AI audit background task.");
    } finally {
      setAuditingAi(false);
    }
  };

  const handleDownloadPdf = (pdfUrl, filename) => {
    if (!pdfUrl) return;
    const backendUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const fullUrl = pdfUrl.startsWith("http")
      ? pdfUrl
      : `${backendUrl}${pdfUrl.startsWith("/") ? "" : "/"}${pdfUrl}`;

    const link = document.createElement("a");
    link.href = fullUrl;
    link.setAttribute("download", filename || "order_invoice.pdf");
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Chat States
  const [chatRecipientId, setChatRecipientId] = useState("");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const unreadByOrder = useChatStore((state) => state.unreadByOrder);
  const markOrderRead = useChatStore((state) => state.markOrderRead);
  const sendChatMessage = useChatStore((state) => state.sendMessage);
  const isChatConnected = useChatStore((state) => state.isConnected);
  const incomingChatMessages = useChatStore((state) => state.messages);

  const addLocalMessage = useChatStore(
    (state) => state.addLocalMessage
  );

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [adminError, setAdminError] = useState("");
  const [aiGeneratingDesc, setAiGeneratingDesc] = useState(false);
  const productFileInputRef = useRef(null);

  /*
   * PRODUCTS
   */
  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const response = await api.get("/products");
      return response.data.products ?? response.data;
    },
  });

  /*
   * ORDERS
   */
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
    isRefetching: isOrdersRefetching,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const response = await api.get("/orders/admin/all");
      return response.data;
    },
  });

  /*
   * ADMIN CHAT & CONCIERGE LIVE SUPPORT
   */
  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await getConversations();
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to load customer conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [activeTab]);

  useEffect(() => {
    if (incomingChatMessages.length) {
      loadConversations();
    }
  }, [incomingChatMessages]);

  const handleSelectCustomerChat = async (convo) => {
    setChatRecipientId(convo.user_id.toString());
    setActiveOrderId(convo.order_id || null);
    try {
      const history = await getChatHistory(convo.user_id, convo.order_id || null);
      setChatMessages(history);
      if (chatSectionRef.current) {
        chatSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Failed to load customer chat history:", err);
    }
  };

  const fetchChatHistory = async (e) => {
    if (e) e.preventDefault();
    if (!chatRecipientId) return;
    try {
      const history = await getChatHistory(Number(chatRecipientId), activeOrderId);
      setChatMessages(history);
    } catch (err) {
      console.error(err);
      alert("Failed to load chat history. Ensure User ID is correct.");
    }
  };

  const handleStartChat = async (customerId, orderId) => {
    setChatRecipientId(customerId.toString());
    setActiveOrderId(orderId);
    markOrderRead(orderId);
    try {
      const history = await getChatHistory(customerId, orderId);
      setChatMessages(history);
      if (chatSectionRef.current) {
        chatSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load chat history for this customer.");
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !chatRecipientId) return;
    
    if (!sendChatMessage || !isChatConnected) return;

    const ordId = activeOrderId ? Number(activeOrderId) : null;

    const sent = sendChatMessage({
      recipient_id: Number(chatRecipientId),
      order_id: ordId,
      message: chatMessage,
    });

    if (!sent) return;

    setChatMessages((prev) => [
      ...prev,
      {
        sender_id: user.id,
        message: chatMessage,
        created_at: new Date().toISOString(),
        order_id: ordId,
      },
    ]);

    addLocalMessage({
      type: "chat.local",
      sender_id: user.id,
      order_id: ordId,
      message: chatMessage,
    });

    setChatMessage("");
  };

  // Global chat socket feeds messages into the admin chat UI.
  useEffect(() => {
    if (!chatRecipientId || !user?.id) return;

    const latestForRecipient = incomingChatMessages.filter(
      (msg) =>
        (Number(msg.sender_id) === Number(chatRecipientId) ||
          Number(msg.recipient_id) === Number(chatRecipientId)) &&
        (!activeOrderId || Number(msg.order_id) === Number(activeOrderId))
    );

    if (!latestForRecipient.length) return;

    const latest = latestForRecipient[latestForRecipient.length - 1];

    setChatMessages((previous) => {
      const exists = previous.some(
        (item) =>
          Number(item.sender_id) === Number(latest.sender_id) &&
          item.message === latest.message
      );

      return exists
        ? previous
        : [...previous, latest];
    });
  }, [incomingChatMessages, chatRecipientId, activeOrderId, user?.id]);

  /*
   * CREATE / UPDATE PRODUCT
   */
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        const updatePayload = {
          name: data.name,
          description: data.description,
          price: data.price,
          stock: data.stock,
        };
        const response = await api.patch(
          `/products/${editingId}`,
          updatePayload
        );
        return response.data;
      }

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("price", String(data.price));
      formData.append("stock", String(data.stock));
      if (data.image) {
        formData.append("image", data.image);
      }

      const response = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-products"],
      });

      if (form.imagePreview && form.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(form.imagePreview);
      }
      setForm(EMPTY_FORM);
      if (productFileInputRef.current) {
        productFileInputRef.current.value = "";
      }
      setEditingId(null);
      setAdminError("");
    },

    onError: (error) => {
      setAdminError(
        error.response?.data?.detail ||
          "Unable to save product."
      );
    },
  });

  /*
   * DELETE PRODUCT
   */
  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      await api.delete(`/products/${productId}`);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-products"],
      });
    },

    onError: (error) => {
      setAdminError(
        error.response?.data?.detail ||
          "Unable to delete product."
      );
    },
  });

  /*
   * UPDATE ORDER STATUS
   */
  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const response = await api.patch(
        `/orders/admin/${orderId}/status`,
        null,
        {
          params: {
            new_status: status,
          },
        }
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },

    onError: (error) => {
      setAdminError(
        error.response?.data?.detail ||
          "Unable to update order status."
      );
    },
  });

  /*
   * PRODUCT HANDLERS
   */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported image type. Please select a PNG, JPG, or WebP image.");
      if (productFileInputRef.current) productFileInputRef.current.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      alert("Image file size must be 5 MB or smaller.");
      if (productFileInputRef.current) productFileInputRef.current.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      image: file,
      imagePreview: previewUrl,
    }));
  };

  const handleRemoveImage = () => {
    if (form.imagePreview && form.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(form.imagePreview);
    }
    setForm((prev) => ({
      ...prev,
      image: null,
      imagePreview: "",
    }));
    if (productFileInputRef.current) {
      productFileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAdminError("");

    saveMutation.mutate({
      name: form.name.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description.trim(),
      image: form.image,
    });
  };

  const handleEdit = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name ?? "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      description: product.description ?? "",
      image: null,
      imagePreview: product.image_url ? getProductImageUrl(product.image_url) : "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    if (form.imagePreview && form.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(form.imagePreview);
    }
    setEditingId(null);
    setForm(EMPTY_FORM);
    if (productFileInputRef.current) {
      productFileInputRef.current.value = "";
    }
  };

  const handleDelete = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this product?"
      )
    ) {
      setAdminError("");
      deleteMutation.mutate(id);
    }
  };

  // Celery CSV Bulk Import Handler
  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setCsvFeedback({ type: "error", message: "Please select a .csv file first." });
      return;
    }

    setCsvImportLoading(true);
    setCsvFeedback({ type: "info", message: "Dispatching background job to Celery worker..." });

    try {
      const data = await bulkImportCsv(csvFile);
      setCsvCurrentTaskId(data.task_id);
      addTask({
        taskId: data.task_id,
        type: "csv_import",
        title: `CSV Import: ${csvFile.name}`,
        metadata: { filename: csvFile.name },
      });
      setCsvFeedback({
        type: "success",
        message: `Task queued (#${data.task_id.slice(0, 8)}). Track live progress below!`,
      });
      setCsvFile(null);
    } catch (err) {
      console.error("Bulk CSV import error:", err);
      setCsvFeedback({
        type: "error",
        message: err.response?.data?.detail || "Failed to trigger CSV import.",
      });
    } finally {
      setCsvImportLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadCsvTemplate();
    } catch (err) {
      console.error("Template download error:", err);
      alert("Failed to download CSV template.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleAdminGenerateInvoice = async (orderId) => {
    try {
      const data = await generateOrderInvoice(orderId);
      addTask({
        taskId: data.task_id,
        type: "invoice",
        title: `Invoice Order #${orderId}`,
        metadata: { orderId: Number(orderId) },
      });
    } catch (err) {
      console.error("Admin invoice error:", err);
      alert(err.response?.data?.detail || "Failed to trigger invoice generation.");
    }
  };

  const activeCsvTask = tasks.find((t) => t.taskId === csvCurrentTaskId) ||
    tasks.find((t) => t.type === "csv_import");

  useEffect(() => {
    if (activeCsvTask?.state === "SUCCESS") {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  }, [activeCsvTask?.state, queryClient]);

  /*
   * ORDER HANDLER
   */
  const handleStatusChange = (orderId, status) => {
    setAdminError("");

    statusMutation.mutate({
      orderId,
      status,
    });
  };

  if (productsLoading || ordersLoading) {
    return (
      <div
        className="container"
        style={{
          padding: "80px 0",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f4f6",
            borderTop: "4px solid #6c5ce7",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "#666", fontSize: "16px", fontWeight: "600" }}>
          Loading admin dashboard...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (productsError || ordersError) {
    return (
      <div
        className="container"
        style={{ padding: "40px 0" }}
      >
        <div className="details-alert alert-error">
          Unable to load admin dashboard. Make sure you
          have administrator access and are signed in with an admin account.
        </div>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ padding: "28px 0 40px" }}
    >
      {/* =========================================
          ADMIN TAB NAVIGATION (ORDERS, PRODUCTS, BULK CSV, BACKGROUND TASKS)
      ========================================== */}
      <div className="admin-subnav-tabs">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: "all" })}
          className={`admin-subnav-pill ${activeTab === "all" ? "active" : ""}`}
        >
          <Layers size={15} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: "orders" })}
          className={`admin-subnav-pill ${activeTab === "orders" ? "active" : ""}`}
        >
          <ShoppingBag size={15} />
          <span>Orders</span>
          <span className="admin-subnav-badge">{orders.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: "support" })}
          className={`admin-subnav-pill ${activeTab === "support" ? "active" : ""}`}
        >
          <MessageCircle size={15} />
          <span>Live Support</span>
          {conversations.reduce((sum, c) => sum + (c.unread || 0), 0) > 0 && (
            <span className="admin-subnav-badge highlight">
              {conversations.reduce((sum, c) => sum + (c.unread || 0), 0)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: "products" })}
          className={`admin-subnav-pill ${activeTab === "products" ? "active" : ""}`}
        >
          <Package size={15} />
          <span>Products</span>
          <span className="admin-subnav-badge">{products.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: "bulk-csv" })}
          className={`admin-subnav-pill ${activeTab === "bulk-csv" ? "active" : ""}`}
        >
          <FileSpreadsheet size={15} />
          <span>Bulk CSV</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: "tasks" })}
          className={`admin-subnav-pill ${activeTab === "tasks" ? "active" : ""}`}
        >
          <Activity size={15} />
          <span>Background Tasks</span>
          {tasks.length > 0 && (
            <span className="admin-subnav-badge highlight">{tasks.length}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: "ui-customizer" })}
          className={`admin-subnav-pill ${activeTab === "ui-customizer" ? "active" : ""}`}
        >
          <Palette size={15} />
          <span>Storefront CMS</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: "governance" })}
          className={`admin-subnav-pill ${activeTab === "governance" ? "active" : ""}`}
        >
          <ShieldCheck size={15} />
          <span>AI Governance</span>
        </button>
      </div>

      {/* Overview Fast Jump Cards (shown when tab === "all") */}
      {activeTab === "all" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "30px" }}>
          <div
            onClick={() => setSearchParams({ tab: "orders" })}
            className="admin-stat-card"
            style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">Orders</span>
              <span style={{ fontSize: "18px" }}>📦</span>
            </div>
            <strong className="stat-value">{orders.length}</strong>
            <small className="stat-foot" style={{ color: "#00B894", fontWeight: 700 }}>
              Click to view orders &rarr;
            </small>
          </div>

          <div
            onClick={() => setSearchParams({ tab: "products" })}
            className="admin-stat-card"
            style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">Products</span>
              <span style={{ fontSize: "18px" }}>🏷️</span>
            </div>
            <strong className="stat-value">{products.length}</strong>
            <small className="stat-foot" style={{ color: "#00B894", fontWeight: 700 }}>
              Click to manage catalog &rarr;
            </small>
          </div>

          <div
            onClick={() => setSearchParams({ tab: "ui-customizer" })}
            className="admin-stat-card"
            style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">Storefront UI</span>
              <span style={{ fontSize: "18px" }}>🎨</span>
            </div>
            <strong className="stat-value" style={{ fontSize: "17px", color: "#000000" }}>
              Visual CMS
            </strong>
            <small className="stat-foot" style={{ color: "#059669", fontWeight: 700 }}>
              Customize 6 pages live &rarr;
            </small>
          </div>

          <div
            onClick={() => setSearchParams({ tab: "bulk-csv" })}
            className="admin-stat-card"
            style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">Bulk CSV</span>
              <span style={{ fontSize: "18px" }}>📄</span>
            </div>
            <strong className="stat-value" style={{ fontSize: "16px", color: "#6C5CE7" }}>
              CSV Pipeline
            </strong>
            <small className="stat-foot" style={{ color: "#6C5CE7", fontWeight: 700 }}>
              Async Celery batch import &rarr;
            </small>
          </div>

          <div
            onClick={() => setSearchParams({ tab: "tasks" })}
            className="admin-stat-card"
            style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">Background Tasks</span>
              <span style={{ fontSize: "18px" }}>⚡</span>
            </div>
            <strong className="stat-value" style={{ color: tasks.length ? "#6C5CE7" : "#0F172A" }}>
              {tasks.length}
            </strong>
            <small className="stat-foot" style={{ color: "#6C5CE7", fontWeight: 700 }}>
              View worker status &rarr;
            </small>
          </div>
        </div>
      )}

      {/* =========================================
          STOREFRONT VISUAL CMS & THEME CUSTOMIZER
      ========================================== */}
      {(activeTab === "ui-customizer" || activeTab === "all") && (
        <section style={{ marginTop: "24px", marginBottom: "32px" }} id="admin-ui-customizer-section">
          <AdminStorefrontCustomizer />
        </section>
      )}

      {/* =========================================
          RESPONSIBLE AI & COST GOVERNANCE (ADMIN ONLY)
      ========================================== */}
      {(activeTab === "governance" || activeTab === "all") && (
        <AIGovernanceDashboard />
      )}

      {/* =========================================
          4. BACKGROUND TASKS COMPONENT (CELERY WORKER QUEUE)
      ========================================== */}
      {(activeTab === "tasks" || activeTab === "all") && (
        <section style={{ marginTop: "36px", marginBottom: "40px" }} id="admin-tasks-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#F0EDFD", color: "#6C5CE7", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>Celery & Async Background Tasks</h2>
                  <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "14px" }}>
                    Monitor asynchronous worker queues, PDF invoice generations, CSV imports, and automated Celery audits.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleTriggerAiAudit}
                disabled={auditingAi}
                className="btn-admin-task-action"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  background: "linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "9px 16px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: auditingAi ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(108, 92, 231, 0.3)",
                }}
              >
                {auditingAi ? <Loader2 size={15} className="spin" /> : <Play size={14} fill="#FFFFFF" />}
                <span>Trigger Celery AI Audit</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  background: "#F1F5F9",
                  color: "#334155",
                  border: "1px solid #CBD5E1",
                  padding: "9px 15px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Download size={14} />
                <span>CSV Template</span>
              </button>

              {tasks.length > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  title="Clear finished tasks"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "transparent",
                    color: "#94A3B8",
                    border: "1px solid #E2E8F0",
                    padding: "9px 14px",
                    borderRadius: "999px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={13} />
                  <span>Clear Finished</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "22px" }}>
            <div className="admin-stat-card">
              <span className="stat-label">Total Dispatched</span>
              <strong className="stat-value">{tasks.length}</strong>
              <small className="stat-foot">Persisted in store</small>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">Active Running</span>
              <strong className="stat-value" style={{ color: "#E67E22" }}>
                {tasks.filter((t) => t.state === "PENDING" || t.state === "PROGRESS").length}
              </strong>
              <small className="stat-foot">In worker execution</small>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">Completed</span>
              <strong className="stat-value" style={{ color: "#00B894" }}>
                {tasks.filter((t) => t.state === "SUCCESS").length}
              </strong>
              <small className="stat-foot">Successfully processed</small>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">Worker Status</span>
              <strong className="stat-value" style={{ color: "#6C5CE7", fontSize: "18px" }}>
                Active & Healthy
              </strong>
              <small className="stat-foot">Celery + Redis Broker</small>
            </div>
          </div>

          {/* Task Queue List */}
          <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 18px rgba(0, 0, 0, 0.03)" }}>
            {tasks.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <Clock size={36} color="#CBD5E1" style={{ margin: "0 auto 12px" }} />
                <h4 style={{ margin: 0, fontSize: "16px", color: "#1E293B" }}>No background tasks dispatched yet</h4>
                <p style={{ margin: "6px auto 18px", color: "#64748B", fontSize: "13px", maxWidth: "420px" }}>
                  Dispatched background tasks like CSV imports, invoice generations, or Celery audits will appear here in real-time.
                </p>
                <button
                  type="button"
                  onClick={handleTriggerAiAudit}
                  disabled={auditingAi}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#00B894",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <Play size={13} fill="#FFFFFF" />
                  <span>Run Audit Task Now</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {tasks.map((task) => {
                  const isDone = task.state === "SUCCESS";
                  const isFail = task.state === "FAILURE";
                  const isRunning = task.state === "PROGRESS" || task.state === "PENDING";
                  return (
                    <div
                      key={task.taskId}
                      style={{
                        padding: "18px 22px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "260px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: isDone ? "#E6F8F4" : isFail ? "#FEE2E2" : "#F0EDFD",
                            color: isDone ? "#00B894" : isFail ? "#EF4444" : "#6C5CE7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {task.type === "csv_import" ? (
                            <FileSpreadsheet size={20} />
                          ) : task.type === "invoice" ? (
                            <FileText size={20} />
                          ) : (
                            <ShieldCheck size={20} />
                          )}
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "14.5px", color: "#1E293B" }}>{task.title}</strong>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "999px",
                                background: isDone ? "#E6F8F4" : isFail ? "#FEE2E2" : "#FEF8E7",
                                color: isDone ? "#00B894" : isFail ? "#EF4444" : "#D97706",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {isRunning && <Loader2 size={11} className="spin" />}
                              {task.state}
                            </span>
                          </div>
                          <div style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748B", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <code style={{ background: "#F1F5F9", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>
                              {task.taskId.slice(0, 14)}...
                            </code>
                            <span>{task.status}</span>
                            {task.createdAt && (
                              <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress meter */}
                      <div style={{ width: "180px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#64748B", marginBottom: "4px" }}>
                          <span>Progress</span>
                          <strong>{task.progress ?? (isDone ? 100 : 10)}%</strong>
                        </div>
                        <div style={{ height: "6px", width: "100%", background: "#E2E8F0", borderRadius: "999px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.max(4, Math.min(100, task.progress || (isDone ? 100 : 10)))}%`,
                              background: isDone
                                ? "linear-gradient(90deg, #00B894, #55EFC4)"
                                : isFail
                                ? "#EF4444"
                                : "linear-gradient(90deg, #6C5CE7, #A29BFE)",
                              borderRadius: "999px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {task.result?.pdf_url && (
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(task.result.pdf_url, `invoice_${task.metadata?.orderId || "order"}.pdf`)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "#00B894",
                              color: "#FFFFFF",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Download size={13} />
                            <span>PDF</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeTask(task.taskId)}
                          title="Dismiss task"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94A3B8",
                            cursor: "pointer",
                            padding: "6px",
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================
          3. BULK CSV IMPORT (CELERY BACKGROUND TASK)
      ========================================== */}
      {(activeTab === "bulk-csv" || activeTab === "all") && (
        <section style={{ marginTop: "30px", marginBottom: "30px" }} id="admin-bulk-csv-section">
          <h2>Bulk CSV Import</h2>
          <div
            style={{
              background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "24px 28px",
            marginTop: "20px",
            marginBottom: "28px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "18px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    background: "#F0EDFD",
                    color: "#6C5CE7",
                    padding: "8px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#1E272E" }}>
                    Bulk Product Import (CSV)
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748B" }}>
                    Asynchronously import products in the background via Celery with real-time row processing.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={downloadingTemplate}
              onClick={handleDownloadTemplate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#F8FAFC",
                color: "#475569",
                border: "1px solid #CBD5E1",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Download size={14} />
              <span>{downloadingTemplate ? "Downloading..." : "Download Sample Template (.csv)"}</span>
            </button>
          </div>

          {/* Form & Upload Controls */}
          <form
            onSubmit={handleCsvImport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              background: "#F8FAFC",
              padding: "16px 20px",
              borderRadius: "12px",
              border: "1px dashed #CBD5E1",
            }}
          >
            <div style={{ flex: 1, minWidth: "260px" }}>
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                onChange={(e) => {
                  setCsvFile(e.target.files?.[0] || null);
                  setCsvFeedback({ type: "", message: "" });
                }}
                style={{
                  width: "100%",
                  fontSize: "13px",
                  color: "#334155",
                }}
              />
              <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginTop: "4px" }}>
                Accepts valid CSV files containing: name, price, stock, description, image_url
              </span>
            </div>

            <button
              type="submit"
              disabled={!csvFile || csvImportLoading || activeCsvTask?.state === "PROGRESS"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#6C5CE7",
                color: "#FFFFFF",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: !csvFile || csvImportLoading ? "not-allowed" : "pointer",
                opacity: !csvFile || csvImportLoading ? 0.6 : 1,
                boxShadow: "0 2px 8px rgba(108, 92, 231, 0.25)",
              }}
            >
              {csvImportLoading || activeCsvTask?.state === "PROGRESS" ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Processing CSV Import...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Start Bulk Import</span>
                </>
              )}
            </button>
          </form>

          {/* Feedback message */}
          {csvFeedback.message && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                background: csvFeedback.type === "error" ? "#FEE2E2" : "#F0FDF4",
                color: csvFeedback.type === "error" ? "#DC2626" : "#16A34A",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {csvFeedback.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{csvFeedback.message}</span>
            </div>
          )}

          {/* Real-time Progress Bar for active CSV Task */}
          {activeCsvTask && (
            <div
              style={{
                marginTop: "16px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "14px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background:
                        activeCsvTask.state === "SUCCESS"
                          ? "#E6F8F4"
                          : activeCsvTask.state === "FAILURE"
                          ? "#FEE2E2"
                          : "#FEF8E7",
                      color:
                        activeCsvTask.state === "SUCCESS"
                          ? "#00B894"
                          : activeCsvTask.state === "FAILURE"
                          ? "#E74C3C"
                          : "#D35400",
                    }}
                  >
                    {activeCsvTask.state}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E272E" }}>
                    {activeCsvTask.title}
                  </span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#6C5CE7" }}>
                  {activeCsvTask.progress ?? 0}%
                </span>
              </div>

              <div
                style={{
                  height: "8px",
                  width: "100%",
                  background: "#EDF2F7",
                  borderRadius: "999px",
                  overflow: "hidden",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(3, Math.min(100, activeCsvTask.progress || 0))}%`,
                    background:
                      activeCsvTask.state === "SUCCESS"
                        ? "linear-gradient(90deg, #00B894, #55EFC4)"
                        : "linear-gradient(90deg, #6C5CE7, #A29BFE)",
                    borderRadius: "999px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
                <span>{activeCsvTask.status}</span>
                {activeCsvTask.result && (
                  <span style={{ color: "#16A34A", fontWeight: 700 }}>
                    Successfully imported {activeCsvTask.result.imported_count} products
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      {/* =========================================
          2. PRODUCT MANAGEMENT
      ========================================== */}
      {/* =========================================
          2. PRODUCT MANAGEMENT (LUXURY DOSSIER & CATALOG)
      ========================================== */}
      {(activeTab === "products" || activeTab === "all") && (
        <section style={{ marginTop: "24px", marginBottom: "36px" }} id="admin-products-section">
          <AdminProductManagement
            products={products}
            form={form}
            setForm={setForm}
            editingId={editingId}
            setEditingId={setEditingId}
            saveMutation={saveMutation}
            deleteMutation={deleteMutation}
            handleSubmit={handleSubmit}
            handleEdit={handleEdit}
            handleCancelEdit={handleCancelEdit}
            handleDelete={handleDelete}
            handleImageChange={handleImageChange}
            handleRemoveImage={handleRemoveImage}
            productFileInputRef={productFileInputRef}
            EMPTY_FORM={EMPTY_FORM}
          />
        </section>
      )}

      {/* =========================================
          1. ORDER MANAGEMENT (LUXURY DOSSIER & DISPATCH)
      ========================================== */}
      {(activeTab === "orders" || activeTab === "all") && (
        <section style={{ marginTop: "24px", marginBottom: "36px" }}>
          <AdminOrderManagement
            orders={orders}
            products={products}
            statusMutation={statusMutation}
            onStatusChange={handleStatusChange}
            onStartChat={handleStartChat}
            unreadByOrder={unreadByOrder}
            onGenerateInvoice={handleAdminGenerateInvoice}
            refetchOrders={refetchOrders}
            isRefetching={isOrdersRefetching}
          />
        </section>
      )}

      {/* =========================================
          LIVE CUSTOMER SUPPORT INBOX (ADMIN SIDE)
      ========================================== */}
      {(activeTab === "support" || activeTab === "all") && (
        <section className="admin-orders-container" style={{ marginTop: "32px", marginBottom: "36px" }}>
          {/* Header Row */}
          <div className="admin-section-header">
            <div className="orders-title-group">
              <h2 className="admin-section-title">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  <MessageCircle size={22} style={{ color: "#00B894" }} />
                  Customer Support & Live Concierge Inquiries
                </span>
                <span className="orders-total-badge">
                  {conversations.length} {conversations.length === 1 ? "Thread" : "Threads"}
                </span>
                {conversations.reduce((acc, c) => acc + (Number(c.unread) || 0), 0) > 0 && (
                  <span
                    className="orders-total-badge"
                    style={{ background: "#EF4444", color: "#FFFFFF" }}
                  >
                    {conversations.reduce((acc, c) => acc + (Number(c.unread) || 0), 0)} New
                  </span>
                )}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: isChatConnected ? "#059669" : "#64748B",
                    background: isChatConnected ? "#ECFDF5" : "#F1F5F9",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: isChatConnected ? "1px solid #A7F3D0" : "1px solid #E2E8F0",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: isChatConnected ? "#10B981" : "#94A3B8",
                      boxShadow: isChatConnected ? "0 0 8px #10B981" : "none",
                    }}
                  />
                  {isChatConnected ? "Live Gateway Active" : "Gateway Ready"}
                </span>
              </h2>
              <p className="admin-section-desc">
                Real-time WebSocket conversations with clients across the storefront and active orders.
              </p>
            </div>

            <button
              type="button"
              onClick={loadConversations}
              className="btn-refresh-pill"
              title="Refresh support threads"
              disabled={loadingConversations}
            >
              <RotateCcw
                size={14}
                className={loadingConversations ? "animate-spin" : ""}
              />
              <span>{loadingConversations ? "Refreshing..." : "Refresh Threads"}</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px", marginTop: "12px" }}>
            {loadingConversations ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 24px", color: "#64748B", background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: "#00B894" }} />
                <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#0F172A" }}>Synchronizing live concierge inquiries...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "52px 24px", background: "#FFFFFF", borderRadius: "20px", border: "1px dashed #CBD5E1", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#64748B" }}>
                  <MessageCircle size={26} />
                </div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0F172A", fontSize: "16px", fontWeight: 800 }}>No active customer support inquiries yet</h4>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#64748B", maxWidth: "460px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                  Client inquiries sent from the floating concierge support widget or order cards will stream here live.
                </p>
              </div>
            ) : (
              conversations.map((convo) => {
                const isSelected = chatRecipientId === convo.user_id.toString();
                return (
                  <div
                    key={convo.user_id}
                    onClick={() => handleSelectCustomerChat(convo)}
                    className={`support-thread-card ${isSelected ? "active" : "default"}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "10px",
                            background: isSelected ? "#1E293B" : "#F1F5F9",
                            color: isSelected ? "#FFFFFF" : "#0F172A",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "13px",
                            fontWeight: 800,
                            letterSpacing: "-0.5px",
                          }}
                        >
                          {convo.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: "14px", fontWeight: 700, display: "block", color: isSelected ? "#FFFFFF" : "#0F172A" }}>
                            {convo.email?.split("@")[0]}
                          </strong>
                          <span style={{ fontSize: "11px", color: isSelected ? "#94A3B8" : "#94A3B8" }}>
                            Customer #{convo.user_id}
                          </span>
                        </div>
                      </div>
                      {convo.unread > 0 && (
                        <span style={{ background: "#EF4444", color: "#FFFFFF", fontSize: "11px", fontWeight: 800, padding: "3px 9px", borderRadius: "999px", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)" }}>
                          {convo.unread} New
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: "13px", color: isSelected ? "#CBD5E1" : "#475569", margin: "6px 0", lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {convo.last_message || "No message content"}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: isSelected ? "#94A3B8" : "#94A3B8", paddingTop: "8px", borderTop: isSelected ? "1px solid rgba(255,255,255,0.08)" : "1px solid #F1F5F9" }}>
                      <span>{convo.order_id ? `Order #${convo.order_id}` : "Storefront Inquiry"}</span>
                      <span style={{ fontWeight: 600 }}>
                        {convo.last_message_at ? new Date(convo.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* =========================================
          LIVE CHAT SUPPORT (ADMIN SIDE)
      ========================================== */}
      {(activeTab === "orders" || activeTab === "all" || activeTab === "support") && (activeOrderId || chatRecipientId) && (
        <section style={{ marginTop: "40px", marginBottom: "40px" }} ref={chatSectionRef}>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "20px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.06)",
              overflow: "hidden",
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px",
                background: "#F8FAFC",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#000000",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                    Live Customer Concierge {activeOrderId ? `• Order #${activeOrderId}` : "• Client Support Thread"}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px", fontSize: "12px", color: "#64748B" }}>
                    <span>Customer ID: #{chatRecipientId}</span>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: isChatConnected ? "#059669" : "#E11D48", fontWeight: 700 }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isChatConnected ? "#059669" : "#E11D48" }} />
                      {isChatConnected ? "WebSocket Connected" : "Connecting..."}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setActiveOrderId(null); setChatRecipientId(""); }}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748B",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title="Dismiss Chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Message Stream */}
            <div style={{ padding: "20px 24px" }}>
              <div
                style={{
                  height: "320px",
                  border: "1px solid #EDF2F7",
                  borderRadius: "14px",
                  padding: "18px",
                  overflowY: "auto",
                  background: "#F8FAFC",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {chatMessages.length === 0 ? (
                  <div style={{ color: "#94A3B8", textAlign: "center", margin: "auto", fontSize: "13px" }}>
                    <MessageCircle size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>No chat messages yet for this order.</p>
                    <small>Send a greeting to reach out to the customer in real time.</small>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => {
                    const isAdminMsg = msg.sender_id === user.id;
                    return (
                      <div
                        key={i}
                        style={{
                          alignSelf: isAdminMsg ? "flex-end" : "flex-start",
                          maxWidth: "75%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isAdminMsg ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            background: isAdminMsg ? "linear-gradient(135deg, #6C5CE7 0%, #a855f7 100%)" : "#FFFFFF",
                            color: isAdminMsg ? "#FFFFFF" : "#0F172A",
                            padding: "10px 16px",
                            borderRadius: isAdminMsg ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                            fontSize: "13.5px",
                            fontWeight: 500,
                            lineHeight: 1.4,
                            border: isAdminMsg ? "none" : "1px solid #E2E8F0",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                          }}
                        >
                          {msg.message}
                        </div>
                        <span style={{ fontSize: "10px", color: "#94A3B8", marginTop: "3px", padding: "0 4px" }}>
                          {isAdminMsg ? "You (Admin)" : `Customer #${msg.sender_id}`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatMessage} style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <input
                  type="text"
                  placeholder="Type an instant reply to the customer..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    fontSize: "13.5px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatRecipientId || !chatMessage.trim()}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "12px",
                    background: "#111111",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: chatMessage.trim() ? "pointer" : "default",
                    opacity: chatMessage.trim() ? 1 : 0.6,
                    transition: "all 0.2s",
                  }}
                >
                  Send Reply
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Admin;


