import { useState, useRef, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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
} from "lucide-react";

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
};

import { useAuthStore } from "../../stores/authStore";
import { getChatHistory } from "../../services/chatService";
import { useChatStore } from "../../stores/chatStore";
import {
  bulkImportCsv,
  downloadCsvTemplate,
  generateOrderInvoice,
} from "../../services/taskService";
import { useTaskStore } from "../../stores/taskStore";

function Admin() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const chatSectionRef = useRef(null);

  // Background Task & CSV Import States
  const addTask = useTaskStore((state) => state.addTask);
  const tasks = useTaskStore((state) => state.tasks);
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvCurrentTaskId, setCsvCurrentTaskId] = useState(null);
  const [csvFeedback, setCsvFeedback] = useState({ type: "", message: "" });
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Chat States
  const [chatRecipientId, setChatRecipientId] = useState("");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

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
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const response = await api.get("/orders/admin/all");
      return response.data;
    },
  });

  /*
   * ADMIN CHAT
   */
  const fetchChatHistory = async (e) => {
    if (e) e.preventDefault();
    if (!chatRecipientId) return;
    try {
      const history = await getChatHistory(chatRecipientId, activeOrderId);
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

    const sent = sendChatMessage({
      recipient_id: Number(chatRecipientId),
      order_id: Number(activeOrderId),
      message: chatMessage,
    });

    if (!sent) return;

    setChatMessages((prev) => [
      ...prev,
      {
        sender_id: user.id,
        message: chatMessage,
        created_at: new Date().toISOString(),
        order_id: activeOrderId,
      },
    ]);

    addLocalMessage({
      type: "chat.local",
      sender_id: user.id,
      order_id: Number(activeOrderId),
      message: chatMessage,
    });

    setChatMessage("");
  };

  // Global chat socket feeds messages into the admin chat UI.
  useEffect(() => {
    if (!activeOrderId || !user?.id) return;

    const latestForOrder = incomingChatMessages.filter(
      (msg) =>
        Number(msg.order_id) === Number(activeOrderId) &&
        Number(msg.sender_id) !== Number(user.id)
    );

    if (!latestForOrder.length) return;

    const latest = latestForOrder[latestForOrder.length - 1];

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
  }, [incomingChatMessages, activeOrderId, user?.id]);

  /*
   * CREATE / UPDATE PRODUCT
   */
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        const response = await api.patch(
          `/products/${editingId}`,
          data
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

      setForm(EMPTY_FORM);
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
  const handleSubmit = (event) => {
    event.preventDefault();
    setAdminError("");

    saveMutation.mutate({
      name: form.name.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description.trim(),
    });
  };

  const handleEdit = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name ?? "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      description: product.description ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
      style={{ padding: "40px 0" }}
    >
      <h1>Admin Dashboard</h1>

      {adminError && (
        <div
          className="details-alert alert-error"
          style={{ marginTop: "20px" }}
        >
          {adminError}
        </div>
      )}

      {/* =========================================
          PRODUCT MANAGEMENT
      ========================================== */}
      <section style={{ marginTop: "30px" }}>
        <h2>Product Management</h2>

        {/* =========================================
            BULK CSV IMPORT CARD (CELERY BACKGROUND TASK)
        ========================================== */}
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "350px 1fr",
            gap: "30px",
            marginTop: "20px",
            alignItems: "start",
          }}
        >
          {/* Product Form */}
          <div
            style={{
              padding: "24px",
              border: "1px solid #eee",
              borderRadius: "16px",
              background: "#fff",
            }}
          >
            <h3>
              {editingId
                ? "Edit Product"
                : "Add Product"}
            </h3>

            <form
              onSubmit={handleSubmit}
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <input
                className="form-input"
                placeholder="Product name"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                required
              />

              <input
                className="form-input"
                placeholder="Price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm({
                    ...form,
                    price: event.target.value,
                  })
                }
                required
              />

              <input
                className="form-input"
                placeholder="Stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) =>
                  setForm({
                    ...form,
                    stock: event.target.value,
                  })
                }
                required
              />

              <textarea
                className="form-input"
                placeholder="Description"
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
                rows={4}
              />

              <button
                type="submit"
                className="btn-add-to-cart-cta"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : editingId
                  ? "Update Product"
                  : "Create Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          {/* Product List */}
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: "16px",
              background: "#fff",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px" }}>
              <h3>
                Products ({products.length})
              </h3>
            </div>

            {products.length === 0 ? (
              <div style={{ padding: "20px" }}>
                No products found.
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "18px 20px",
                    borderTop: "1px solid #eee",
                    gap: "20px",
                  }}
                >
                  <div>
                    <strong>{product.name}</strong>

                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      ₹{product.price} · Stock:{" "}
                      {product.stock}
                    </div>

                    {product.description && (
                      <div
                        style={{
                          marginTop: "5px",
                          fontSize: "13px",
                          color: "#888",
                        }}
                      >
                        {product.description}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(product)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(product.id)
                      }
                      disabled={
                        deleteMutation.isPending
                      }
                    >
                      {deleteMutation.isPending
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* =========================================
          ORDER MANAGEMENT
      ========================================== */}
      <section style={{ marginTop: "50px" }}>
        <h2>Order Management</h2>

        <div
          style={{
            marginTop: "20px",
            border: "1px solid #eee",
            borderRadius: "16px",
            background: "#fff",
            overflow: "hidden",
          }}
        >
          {orders.length === 0 ? (
            <div style={{ padding: "30px" }}>
              No orders found.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: "24px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                      }}
                    >
                      Order #{order.id}
                    </h3>

                    <div
                      style={{
                        margin: "8px 0 0",
                        color: "#666",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      Customer ID: {order.user_id}
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={() => handleStartChat(order.user_id, order.id)}
                          title="Chat with Customer"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#6C5CE7",
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
                    </div>

                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#666",
                      }}
                    >
                      Total: ₹
                      {Number(
                        order.total_amount || 0
                      ).toFixed(2)}
                    </p>

                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#666",
                      }}
                    >
                      Shipping:{" "}
                      {order.shipping_name ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor={`order-status-${order.id}`}
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      Order Status
                    </label>

                    <select
                      id={`order-status-${order.id}`}
                      value={order.status}
                      disabled={
                        statusMutation.isPending
                      }
                      onChange={(event) =>
                        handleStatusChange(
                          order.id,
                          event.target.value
                        )
                      }
                      className="form-input"
                    >
                      {ORDER_STATUSES.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>

                    <div style={{ marginTop: "10px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleAdminGenerateInvoice(order.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#F0EDFD",
                          color: "#6C5CE7",
                          border: "1px solid #D4CEFB",
                          padding: "7px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <FileText size={14} />
                        <span>Invoice PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {order.items?.length > 0 && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "16px",
                      background: "#f8f9fa",
                      borderRadius: "10px",
                    }}
                  >
                    <strong>Order Items</strong>

                    <div
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {order.items.map(
                        (item, index) => (
                          <div
                            key={
                              item.id ??
                              `${order.id}-${index}`
                            }
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              fontSize: "14px",
                            }}
                          >
                            <span>
                              Product #{item.product_id}
                              {" · "}
                              Qty: {item.quantity}
                            </span>

                            <span>
                              ₹
                              {Number(
                                item.price || 0
                              ).toFixed(2)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* =========================================
          LIVE CHAT SUPPORT (ADMIN SIDE)
      ========================================== */}
      {activeOrderId && (
        <section style={{ marginTop: "50px" }} ref={chatSectionRef}>
          <h2>Customer Support Chat (Order #{activeOrderId})</h2>
          <div style={{ marginTop: "20px", border: "1px solid #eee", borderRadius: "16px", background: "#fff", padding: "24px" }}>
            <div style={{ height: "300px", border: "1px solid #eee", borderRadius: "8px", padding: "16px", overflowY: "auto", background: "#f8f9fa", display: "flex", flexDirection: "column", gap: "10px" }}>
              {chatMessages.length === 0 ? (
                <div style={{ color: "#888", textAlign: "center", marginTop: "100px" }}>No messages yet.</div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.sender_id === user.id ? "flex-end" : "flex-start", background: msg.sender_id === user.id ? "#6C5CE7" : "#e2e8f0", color: msg.sender_id === user.id ? "#fff" : "#333", padding: "10px 15px", borderRadius: "20px", maxWidth: "70%" }}>
                    <div style={{ fontSize: "14px" }}>{msg.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChatMessage} style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <input 
                className="form-input" 
                placeholder="Type a message..." 
                value={chatMessage} 
                onChange={(e) => setChatMessage(e.target.value)} 
              />
              <button type="submit" className="btn-hero-primary" disabled={!chatRecipientId} style={{ padding: "10px 20px" }}>Send</button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

export default Admin;


