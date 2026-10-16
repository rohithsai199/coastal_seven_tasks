import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Check, ExternalLink, Sparkles } from "lucide-react";
import { addToCart, getCart } from "../../services/cartService";
import { useCartStore } from "../../stores/cartStore";

export default function ProductCitationCard({ citation, onNavigate }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const setCart = useCartStore((state) => state.setCart);

  if (!citation) return null;

  const {
    id,
    name,
    price,
    stock,
    image_url,
    relevance_score,
  } = citation;

  const matchPercent = relevance_score ? Math.round(relevance_score * 100) : null;
  const isAvailable = stock > 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable || adding) return;

    try {
      setAdding(true);
      await addToCart(id, 1);
      const updatedCart = await getCart();
      setCart(updatedCart);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to add cited product to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="aura-citation-card">
      <div className="aura-citation-img-wrap">
        {image_url ? (
          <img
            src={image_url.startsWith("http") ? image_url : `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}${image_url}`}
            alt={name}
            className="aura-citation-img"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="aura-citation-img-fallback">
            <Sparkles size={20} />
          </div>
        )}
        {matchPercent && (
          <span className="aura-match-pill">
            {matchPercent}% match
          </span>
        )}
      </div>

      <div className="aura-citation-body">
        <h4 className="aura-citation-title" title={name}>
          {name}
        </h4>

        <div className="aura-citation-meta">
          <span className="aura-citation-price">${Number(price).toFixed(2)}</span>
          <span className={`aura-stock-badge ${isAvailable ? "in-stock" : "out-of-stock"}`}>
            {isAvailable ? `${stock} in stock` : "Out of stock"}
          </span>
        </div>

        <div className="aura-citation-actions">
          <Link
            to={`/products?q=${encodeURIComponent(name)}`}
            onClick={() => onNavigate && onNavigate()}
            className="aura-btn-details"
            title="View Product in Catalogue"
          >
            <span>View</span>
            <ExternalLink size={13} />
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable || adding}
            className={`aura-btn-add ${added ? "added" : ""}`}
            title="Add to Shopping Cart"
          >
            {added ? (
              <>
                <Check size={13} />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag size={13} />
                <span>{adding ? "..." : "Add"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
