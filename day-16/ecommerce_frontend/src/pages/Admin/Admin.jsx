import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../../services/api";

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

function Admin() {
  const queryClient = useQueryClient();

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
   * CREATE / UPDATE PRODUCT
   */
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        const response = await api.put(
          `/products/${editingId}`,
          data
        );

        return response.data;
      }

      const response = await api.post(
        "/products",
        data
      );

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
        style={{ padding: "40px 0" }}
      >
        Loading admin dashboard...
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
          have administrator access.
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

                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#666",
                      }}
                    >
                      Customer ID: {order.user_id}
                    </p>

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
    </div>
  );
}

export default Admin;


