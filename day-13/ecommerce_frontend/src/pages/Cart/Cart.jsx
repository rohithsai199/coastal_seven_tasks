import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";

import {
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../../services/cartService";
import { getProductImageUrl, handleImageError } from "../../utils/imageUrl";

function Cart() {
  const [cart, setCart] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [error, setError] = useState("");

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCart();
      setCart(data.cart || []);
      setItemCount(data.item_count || 0);
      setGrandTotal(data.grand_total || 0);
    } catch (err) {
      console.error("Cart error:", err);
      setError(
        err.response?.data?.detail || "Unable to load your cart. Please ensure you are logged in."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    try {
      setUpdatingProductId(productId);
      setError("");
      await updateCartItem(productId, quantity);
      await loadCart();
    } catch (err) {
      console.error("Update cart error:", err);
      setError(err.response?.data?.detail || "Unable to update item quantity.");
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleRemove = async (productId) => {
    try {
      setUpdatingProductId(productId);
      setError("");
      await removeFromCart(productId);
      await loadCart();
    } catch (err) {
      console.error("Remove cart item error:", err);
      setError(err.response?.data?.detail || "Unable to remove item.");
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      setLoading(true);
      setError("");
      await clearCart();
      await loadCart();
    } catch (err) {
      console.error("Clear cart error:", err);
      setError(err.response?.data?.detail || "Unable to clear cart.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="container loading-wrapper">
          <div className="modern-spinner"></div>
          <p>Loading your shopping bag...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="section-header-row">
          <div>
            <span className="section-badge-purple">Shopping Bag</span>
            <h1 className="section-main-heading">Your Cart ({itemCount})</h1>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={handleClearCart}
              title="Clear all items"
            >
              <Trash2 size={16} className="text-coral" />
              <span>Empty Bag</span>
            </button>
          )}
        </div>

        {error && (
          <div className="details-alert alert-error">
            {error}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="catalog-empty-state">
            <div className="empty-icon-circle">
              <ShoppingBag size={38} />
            </div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added any products yet.</p>
            <Link to="/products" className="btn-hero-primary" style={{ marginTop: '20px' }}>
              Start Shopping <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '40px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.map((item) => {
                const imageUrl = getProductImageUrl(item.image_url);
                const isUpdating = updatingProductId === item.product_id;

                return (
                  <div
                    key={item.product_id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      border: '1px solid #EFEFEF',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', background: '#F8F9FA', flexShrink: 0 }}>
                      <img
                        src={imageUrl}
                        alt={item.name}
                        onError={(e) => handleImageError(e)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E272E', marginBottom: '4px' }}>
                        {item.name}
                      </h3>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#6C5CE7', marginBottom: '12px' }}>
                        ${Number(item.price).toFixed(2)}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="qty-picker" style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                          <button
                            type="button"
                            disabled={isUpdating || item.quantity <= 1}
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            className="qty-btn"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-display">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            className="qty-btn"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleRemove(item.product_id)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#808E9B',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                            fontWeight: 600
                          }}
                        >
                          <Trash2 size={15} /> Remove
                        </button>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: '#1E272E' }}>
                        ${Number(item.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Sidebar */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid #EFEFEF',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E272E', marginBottom: '20px' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#485460' }}>
                <span>Total Items</span>
                <span style={{ fontWeight: 700 }}>{itemCount}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#485460' }}>
                <span>Estimated Shipping</span>
                <span style={{ fontWeight: 700, color: '#00B894' }}>FREE</span>
              </div>

              <div style={{ height: '1px', background: '#EFEFEF', margin: '16px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '18px', fontWeight: 900, color: '#1E272E' }}>
                <span>Grand Total</span>
                <span style={{ color: '#6C5CE7' }}>${Number(grandTotal).toFixed(2)}</span>
              </div>

              <Link
                to="/checkout"
                className="btn-add-to-cart-cta"
                style={{ textAlign: 'center', textDecoration: 'none', marginBottom: '14px' }}
              >
                Proceed to Checkout <ArrowRight size={18} />
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#808E9B' }}>
                <ShieldCheck size={16} className="text-emerald" /> 256-Bit SSL Encrypted Checkout
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;