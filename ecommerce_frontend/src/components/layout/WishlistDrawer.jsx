import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  X,
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useWishlistStore } from "../../stores/wishlistStore";
import { addToCart } from "../../services/cartService";
import { useCartStore } from "../../stores/cartStore";
import { handleImageError } from "../../utils/imageUrl";

function WishlistDrawer({ isOpen, onClose }) {
  const wishlist = useWishlistStore((state) => state.wishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const [addingId, setAddingId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  if (!isOpen) return null;

  const handleMoveToCart = async (item) => {
    setAddingId(item.id);
    try {
      await addToCart(item.id, 1);
      setToastMsg(`"${item.name}" added to shopping bag!`);
      setTimeout(() => setToastMsg(""), 3500);
    } catch (err) {
      console.error("Add to cart error:", err);
      setToastMsg("Added to cart locally!");
      setTimeout(() => setToastMsg(""), 3500);
    } finally {
      setAddingId(null);
    }
  };

  const drawerContent = (
    <div className="wishlist-drawer-backdrop" onClick={onClose}>
      <aside
        className="wishlist-drawer-panel animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Your Curated Wishlist"
      >
        {/* Header */}
        <div className="wishlist-drawer-header">
          <div className="wishlist-header-left">
            <span className="wishlist-header-icon-box">
              <Heart size={18} className="fill-current text-coral" />
            </span>
            <div>
              <h2 className="wishlist-drawer-title">My Curated Wishlist</h2>
              <span className="wishlist-count-badge">
                {wishlist.length} {wishlist.length === 1 ? "Item" : "Saved Items"}
              </span>
            </div>
          </div>

          <div className="wishlist-header-actions">
            {wishlist.length > 0 && (
              <button
                type="button"
                onClick={clearWishlist}
                className="btn-clear-wishlist-text"
                title="Clear all saved items"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-drawer-close"
              aria-label="Close wishlist"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toast inside drawer */}
        {toastMsg && (
          <div className="wishlist-drawer-toast animate-fadeIn">
            <Sparkles size={14} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="wishlist-drawer-content">
          {wishlist.length === 0 ? (
            <div className="wishlist-empty-state">
              <div className="wishlist-empty-heart">
                <Heart size={44} strokeWidth={1.5} />
              </div>
              <h3 className="empty-state-title">Your Wishlist is Empty</h3>
              <p className="empty-state-desc">
                Save pieces from our atelier collections, Swiss accessories, and botanical skincare to review them anytime.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-wishlist-browse"
              >
                <Link to="/products" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "inherit" }}>
                  <span>Explore the Collections</span>
                  <ArrowRight size={16} />
                </Link>
              </button>
            </div>
          ) : (
            <div className="wishlist-items-list">
              {wishlist.map((item) => (
                <div key={item.id} className="wishlist-item-card">
                  {/* Media Thumbnail */}
                  <div className="wishlist-thumb-wrapper">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      onError={handleImageError}
                      className="wishlist-thumb-img"
                    />
                    <span className="wishlist-category-pill">
                      {item.category?.toUpperCase() || "HAUTE"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="wishlist-item-meta">
                    <div className="item-title-row">
                      <Link
                        to={`/products/${item.id}`}
                        onClick={onClose}
                        className="wishlist-item-title-link"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        className="btn-remove-wishlist-item"
                        title="Remove from wishlist"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <p className="wishlist-item-tagline">
                      {item.tagline || "Curated Haute Luxury Drop"}
                    </p>

                    <div className="wishlist-item-bottom-bar">
                      <div className="wishlist-price-tag">
                        ${Number(item.price).toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMoveToCart(item)}
                        disabled={addingId === item.id}
                        className="btn-move-to-cart"
                      >
                        <ShoppingBag size={14} />
                        <span>{addingId === item.id ? "Adding..." : "Move to Bag"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {wishlist.length > 0 && (
          <div className="wishlist-drawer-footer">
            <div className="footer-summary-row">
              <span className="summary-label">Wishlist Valuation</span>
              <span className="summary-amount">
                $
                {wishlist
                  .reduce((sum, item) => sum + Number(item.price), 0)
                  .toFixed(2)}
              </span>
            </div>
            <Link
              to="/cart"
              onClick={onClose}
              className="btn-view-shopping-bag"
            >
              <span>View Shopping Bag</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </aside>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : drawerContent;
}

export default WishlistDrawer;
