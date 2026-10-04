import { memo } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Star, Zap, Eye } from "lucide-react";
import { getProductImageUrl, handleImageError } from "../../utils/imageUrl";

const ProductCard = memo(function ProductCard({ product, onAddToCart }) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const imageUrl = getProductImageUrl(product.image_url);

  // Generate deterministic mock rating / badge based on product id
  const rating = 4.8;
  const reviewCount = 24 + ((product.id || 1) * 17) % 80;
  const badgeType = product.id % 3 === 0 ? "Bestseller" : (product.id % 2 === 0 ? "20% OFF" : "New Arrival");

  return (
    <article className="modern-product-card group">
      <div className="card-media-wrapper">
        <Link to={`/products/${product.id}`} className="card-image-link">
          <img
            src={imageUrl}
            alt={product.name}
            onError={(e) => handleImageError(e)}
            className="product-img"
            loading="lazy"
            decoding="async"
            width="320"
            height="320"
          />
        </Link>

        {/* Badges */}
        <div className="card-badge-container">
          {badgeType === "Bestseller" && (
            <span className="badge badge-bestseller">
              <Zap size={12} className="inline mr-1 fill-current" /> Bestseller
            </span>
          )}
          {badgeType === "20% OFF" && (
            <span className="badge badge-discount">20% OFF</span>
          )}
          {badgeType === "New Arrival" && (
            <span className="badge badge-new">New</span>
          )}
        </div>

        {/* Quick View Floating Action */}
        <Link to={`/products/${product.id}`} className="quick-view-btn" title="View details">
          <Eye size={16} />
          <span>Quick View</span>
        </Link>
      </div>

      <div className="card-body">
        {/* Rating & Category */}
        <div className="card-meta">
          <div className="rating-stars">
            <Star size={14} className="star-icon fill-current" />
            <span className="rating-val">{rating}</span>
            <span className="review-count">({reviewCount})</span>
          </div>
          {isLowStock && <span className="stock-alert">Only {product.stock} left!</span>}
        </div>

        {/* Product Title */}
        <Link to={`/products/${product.id}`} className="card-title" title={product.name}>
          {product.name}
        </Link>

        {/* Description snippet */}
        {product.description && (
          <p className="card-snippet">
            {product.description}
          </p>
        )}

        {/* Price & Action */}
        <div className="card-footer">
          <div className="price-box">
            <span className="current-price">
              ${Number(product.price).toFixed(2)}
            </span>
            {badgeType === "20% OFF" && (
              <span className="original-price">
                ${(Number(product.price) * 1.25).toFixed(2)}
              </span>
            )}
          </div>

          {isOutOfStock ? (
            <span className="out-of-stock-pill">Sold Out</span>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="btn-add-cart"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingBag size={16} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
});

export default ProductCard;