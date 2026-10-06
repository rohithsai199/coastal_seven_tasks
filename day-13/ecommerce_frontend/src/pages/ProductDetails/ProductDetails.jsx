import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag,
  ArrowLeft,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  Zap,
} from "lucide-react";

import { getProduct } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { getProductImageUrl, handleImageError } from "../../utils/imageUrl";

function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProduct(productId);
        setProduct(data);
      } catch (err) {
        console.error("Product details error:", err);
        setError(
          err.response?.data?.detail || "Unable to load product details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleQuantityDec = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleQuantityInc = () => {
    if (product && quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleAddToCart = async () => {
    try {
      setMessage("");
      setAddedSuccess(false);

      await addToCart(product.id, quantity);
      setAddedSuccess(true);
      setMessage(`Added ${quantity} × ${product.name} to your cart!`);

      setTimeout(() => {
        setMessage("");
        setAddedSuccess(false);
      }, 4000);
    } catch (err) {
      console.error("Add to cart error:", err);
      const detail = err.response?.data?.detail;
      let errorMessage = "Unable to add product to cart. Please log in first.";
      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((i) => i.msg).filter(Boolean).join(", ");
      }
      setMessage(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="product-details-container loading-wrapper">
        <div className="modern-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-container not-found-wrapper">
        <h2>Product Not Found</h2>
        <p>{error || "The requested item is currently unavailable."}</p>
        <button
          type="button"
          onClick={() => navigate("/products")}
          className="btn-primary"
        >
          <ArrowLeft size={18} /> Back to Catalog
        </button>
      </div>
    );
  }

  const imageUrl = getProductImageUrl(product.image_url);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="product-details-page-wrapper">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="details-breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">/</span>
          <Link to="/products">Products</Link>
          <span className="separator">/</span>
          <span className="current">{product.name}</span>
        </nav>

        <div className="details-grid">
          {/* Product Gallery */}
          <div className="details-media-card">
            <div className="main-image-container">
              <img
                src={imageUrl}
                alt={product.name}
                onError={(e) => handleImageError(e)}
                className="details-img"
              />
              <span className="details-badge">
                <Zap size={14} className="fill-current" /> Premium Quality
              </span>
            </div>
          </div>

          {/* Product Information */}
          <div className="details-info-card">
            <div className="rating-pill">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="star-filled" />
                ))}
              </div>
              <span className="rating-score">4.9 / 5.0</span>
              <span className="dot">•</span>
              <span className="review-link">128 Customer Reviews</span>
            </div>

            <h1 className="details-title">{product.name}</h1>

            <div className="details-price-row">
              <div className="price-tag">${Number(product.price).toFixed(2)}</div>
              <span className="price-tax">Inclusive of all taxes</span>
            </div>

            <p className="details-description">{product.description}</p>

            {/* Stock status */}
            <div className="details-stock-status">
              {isOutOfStock ? (
                <span className="status-out">Out of Stock</span>
              ) : (
                <span className="status-in">
                  <Check size={16} /> In Stock ({product.stock} units available)
                </span>
              )}
            </div>

            {/* Purchase Controls */}
            {!isOutOfStock && (
              <div className="purchase-controls">
                <div className="qty-picker">
                  <button
                    type="button"
                    onClick={handleQuantityDec}
                    disabled={quantity <= 1}
                    className="qty-btn"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="qty-display">{quantity}</span>
                  <button
                    type="button"
                    onClick={handleQuantityInc}
                    disabled={quantity >= product.stock}
                    className="qty-btn"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn-add-to-cart-cta"
                >
                  <ShoppingBag size={20} />
                  <span>Add to Cart</span>
                </button>
              </div>
            )}

            {/* Notification alert */}
            {message && (
              <div
                className={`details-alert ${
                  addedSuccess ? "alert-success" : "alert-error"
                }`}
              >
                {message}
              </div>
            )}

            {/* Perks list */}
            <div className="details-perks-grid">
              <div className="perk-item">
                <Truck size={20} className="perk-icon" />
                <div>
                  <h4>Free Express Shipping</h4>
                  <p>On orders above $50</p>
                </div>
              </div>

              <div className="perk-item">
                <RotateCcw size={20} className="perk-icon" />
                <div>
                  <h4>30-Day Free Returns</h4>
                  <p>Hassle-free guarantee</p>
                </div>
              </div>

              <div className="perk-item">
                <ShieldCheck size={20} className="perk-icon" />
                <div>
                  <h4>2-Year Warranty</h4>
                  <p>100% Genuine product</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;