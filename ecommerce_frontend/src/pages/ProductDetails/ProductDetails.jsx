import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  Heart,
  MessageSquare,
  Send,
} from "lucide-react";

import {
  getProduct,
  getProductReviews,
  submitProductReview,
} from "../../services/productService";
import {
  addToCart,
  getCart,
} from "../../services/cartService";

import { useCartStore } from "../../stores/cartStore";
import { useWishlistStore } from "../../stores/wishlistStore";

import {
  getProductImageUrl,
  handleImageError,
} from "../../utils/imageUrl";

function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const setCart = useCartStore((state) => state.setCart);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Reviews state
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    average_rating: 0,
    total_reviews: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isWishlisted = useWishlistStore((state) =>
    product ? state.wishlist.some((item) => String(item.id) === String(product.id)) : false
  );

  const fetchReviews = async () => {
    if (!productId) return;
    try {
      setReviewsLoading(true);
      const data = await getProductReviews(Number(productId));
      setReviewsData(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProduct(productId);
        setProduct(data);
        if (data.sizes_list && data.sizes_list.length > 0) {
          setSelectedSize(data.sizes_list[0]);
        }
      } catch (err) {
        console.error("Product details error:", err);

        setError(
          err.response?.data?.detail ||
            "Unable to load product details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
    fetchReviews();
  }, [productId]);

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity, size }) =>
      addToCart(productId, quantity, size),

    onSuccess: async () => {
      try {
        /*
         * Fetch the real cart from FastAPI after adding.
         * This keeps React Query and Zustand synchronized
         * with the backend.
         */
        const cartData = await getCart();

        // Update React Query cache immediately
        queryClient.setQueryData(["cart"], cartData);

        // Update Zustand cart store immediately
        setCart(cartData);

        setAddedSuccess(true);

        setMessage(
          `Added ${quantity} × ${product.name} (Size: ${selectedSize}) to your cart!`
        );

        setTimeout(() => {
          setMessage("");
          setAddedSuccess(false);
        }, 4000);
      } catch (err) {
        console.error("Unable to refresh cart:", err);

        setAddedSuccess(false);

        setMessage(
          "Product was added, but the cart could not be refreshed."
        );
      }
    },

    onError: (err) => {
      console.error("Add to cart error:", err);

      const detail = err.response?.data?.detail;

      let errorMessage =
        "Unable to add product to cart. Please log in first.";

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail
          .map((item) => item.msg)
          .filter(Boolean)
          .join(", ");
      }

      setAddedSuccess(false);
      setMessage(errorMessage);
    },
  });

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

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) {
      return;
    }

    setMessage("");
    setAddedSuccess(false);

    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      size: selectedSize,
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMessage("");
    setReviewSuccess(false);

    try {
      setSubmittingReview(true);
      await submitProductReview(Number(productId), reviewRating, reviewComment);
      setReviewSuccess(true);
      setReviewMessage("Thank you! Your verified rating & review has been published.");
      setReviewComment("");
      await fetchReviews();

      setTimeout(() => {
        setReviewMessage("");
      }, 4000);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setReviewSuccess(false);
      setReviewMessage(
        err.response?.data?.detail || "Please sign in to submit a review for this product."
      );
    } finally {
      setSubmittingReview(false);
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

        <p>
          {error ||
            "The requested item is currently unavailable."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/products")}
          className="btn-primary"
        >
          <ArrowLeft size={18} />
          Back to Catalog
        </button>
      </div>
    );
  }

  const imageUrl = getProductImageUrl(product.image_url);
  const isOutOfStock = product.stock <= 0;
  const availableSizes =
    product.sizes_list && product.sizes_list.length > 0
      ? product.sizes_list
      : ["S", "M", "L", "XL"];

  return (
    <div className="product-details-page-wrapper">
      <div className="container">
        <nav className="details-breadcrumb">
          <Link to="/">Home</Link>

          <span className="separator">/</span>

          <Link to="/products">Products</Link>

          <span className="separator">/</span>

          <span className="current">
            {product.name}
          </span>
        </nav>

        <div className="details-grid">
          <div className="details-media-card">
            <div className="main-image-container">
              <img
                src={imageUrl}
                alt={product.name}
                onError={handleImageError}
                className="details-img"
                loading="lazy"
                decoding="async"
                width="600"
                height="600"
              />

              <span className="details-badge">
                <Zap
                  size={14}
                  className="fill-current"
                />
                Premium Quality
              </span>
            </div>
          </div>

          <div className="details-info-card">
            <div className="rating-pill">
              <div className="stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={15}
                    className={
                      i <= Math.round(reviewsData.average_rating || 5)
                        ? "star-filled"
                        : "star-empty"
                    }
                  />
                ))}
              </div>

              <span className="rating-score">
                {reviewsData.average_rating
                  ? Number(reviewsData.average_rating).toFixed(1)
                  : "5.0"}{" "}
                / 5.0
              </span>

              <span className="dot">•</span>

              <a href="#reviews-section" className="review-link">
                {reviewsData.total_reviews || 0} Customer Reviews
              </a>
            </div>

            <h1 className="details-title">
              {product.name}
            </h1>

            <div className="details-price-row">
              <div className="price-tag">
                ${Number(product.price).toFixed(2)}
              </div>

              <span className="price-tax">
                Inclusive of all taxes
              </span>
            </div>

            <p className="details-description">
              {product.description}
            </p>

            <div className="details-stock-status">
              {isOutOfStock ? (
                <span className="status-out">
                  Out of Stock
                </span>
              ) : (
                <span className="status-in">
                  <Check size={16} />
                  In Stock ({product.stock} units available)
                </span>
              )}
            </div>

            {/* Strict Model Size Selector */}
            <div className="product-size-section">
              <div className="size-header-row">
                <span className="size-label-title">Select Size</span>
                <span className="size-selected-badge">
                  Selected Model: <strong>{selectedSize}</strong>
                </span>
              </div>

              <div className="size-pills-grid">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-pill-btn ${selectedSize === size ? "active" : ""}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <p className="size-fulfillment-assurance">
                <Check size={14} /> Guaranteed fulfillment: You will receive the exact <strong>{selectedSize}-model</strong> piece.
              </p>
            </div>

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

                  <span className="qty-display">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={handleQuantityInc}
                    disabled={
                      quantity >= product.stock
                    }
                    className="qty-btn"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  className="btn-add-to-cart-cta"
                >
                  <ShoppingBag size={20} />

                  <span>
                    {addToCartMutation.isPending
                      ? "Adding..."
                      : `Add to Cart (${selectedSize})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`btn-details-wishlist ${isWishlisted ? "liked" : ""}`}
                  title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                >
                  <Heart
                    size={18}
                    fill={isWishlisted ? "#FF7675" : "none"}
                    color={isWishlisted ? "#FF7675" : "currentColor"}
                  />
                  <span>
                    {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
                  </span>
                </button>
              </div>
            )}

            {message && (
              <div
                className={`details-alert ${
                  addedSuccess
                    ? "alert-success"
                    : "alert-error"
                }`}
              >
                {message}
              </div>
            )}

            <div className="details-perks-grid">
              <div className="perk-item">
                <Truck
                  size={20}
                  className="perk-icon"
                />

                <div>
                  <h4>Free Express Shipping</h4>
                  <p>On orders above $50</p>
                </div>
              </div>

              <div className="perk-item">
                <RotateCcw
                  size={20}
                  className="perk-icon"
                />

                <div>
                  <h4>30-Day Free Returns</h4>
                  <p>Hassle-free guarantee</p>
                </div>
              </div>

              <div className="perk-item">
                <ShieldCheck
                  size={20}
                  className="perk-icon"
                />

                <div>
                  <h4>2-Year Warranty</h4>
                  <p>100% Genuine product</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CUSTOMER RATINGS & REVIEWS SECTION                                */}
        {/* ================================================================= */}
        <section id="reviews-section" className="product-reviews-section">
          <div className="reviews-section-header">
            <div className="reviews-title-block">
              <h2>Customer Ratings & Reviews</h2>
              <p>Authentic feedback from verified clients of this collection</p>
            </div>

            <div className="reviews-summary-card">
              <div className="big-rating-number">
                {reviewsData.average_rating
                  ? Number(reviewsData.average_rating).toFixed(1)
                  : "5.0"}
              </div>
              <div>
                <div className="rating-stars-group">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      fill={
                        star <= Math.round(reviewsData.average_rating || 5)
                          ? "#F59E0B"
                          : "none"
                      }
                      color={
                        star <= Math.round(reviewsData.average_rating || 5)
                          ? "#F59E0B"
                          : "#D1D5DB"
                      }
                    />
                  ))}
                </div>
                <div className="rating-count-sub">
                  Based on {reviewsData.total_reviews} verified{" "}
                  {reviewsData.total_reviews === 1 ? "review" : "reviews"}
                </div>
              </div>
            </div>
          </div>

          <div className="reviews-content-grid">
            {/* Review submission card */}
            <div className="review-form-card">
              <h3 className="review-form-title">Write a Review</h3>
              <p className="review-form-subtitle">
                Do you like this piece? Rate your experience with sizing, fabric, and styling.
              </p>

              <form onSubmit={handleReviewSubmit}>
                <div className="interactive-rating-picker">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || reviewRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`rating-star-btn ${
                          active ? "active-star" : ""
                        }`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                        title={`${star} Star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          size={24}
                          fill={active ? "#F59E0B" : "none"}
                          color={active ? "#F59E0B" : "#D1D5DB"}
                        />
                      </button>
                    );
                  })}
                  <span className="rating-sentiment-label">
                    {reviewRating === 5 && "Outstanding"}
                    {reviewRating === 4 && "Very Good"}
                    {reviewRating === 3 && "Average"}
                    {reviewRating === 2 && "Could Be Better"}
                    {reviewRating === 1 && "Disappointed"}
                  </span>
                </div>

                <textarea
                  className="review-textarea-field"
                  placeholder="Share details about the fit, texture, stitching, or how you styled it..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                />

                {reviewMessage && (
                  <div
                    className={`details-alert ${
                      reviewSuccess ? "alert-success" : "alert-error"
                    }`}
                    style={{ marginBottom: "16px" }}
                  >
                    {reviewMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-submit-review"
                >
                  <Send size={16} />
                  <span>
                    {submittingReview ? "Submitting Review..." : "Submit Review"}
                  </span>
                </button>
              </form>
            </div>

            {/* Reviews feed */}
            <div className="reviews-feed-container">
              {reviewsLoading ? (
                <div className="reviews-empty-state">
                  <p>Loading customer reviews...</p>
                </div>
              ) : reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                reviewsData.reviews.map((rev) => (
                  <article key={rev.id} className="single-review-card">
                    <div className="review-card-top">
                      <div className="reviewer-meta">
                        <div className="reviewer-avatar-circle">
                          {(rev.user_email || "Client").charAt(0)}
                        </div>
                        <div>
                          <div className="reviewer-name">
                            {rev.user_email
                              ? rev.user_email.split("@")[0]
                              : "Verified Client"}
                            <span className="verified-buyer-pill">
                              Verified Buyer
                            </span>
                          </div>
                          <p className="review-timestamp">
                            {rev.created_at
                              ? new Date(rev.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : "Recent purchase"}
                          </p>
                        </div>
                      </div>

                      <div className="rating-stars-group">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            fill={star <= rev.rating ? "#F59E0B" : "none"}
                            color={star <= rev.rating ? "#F59E0B" : "#D1D5DB"}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.comment ? (
                      <p className="review-comment-body">{rev.comment}</p>
                    ) : (
                      <p
                        className="review-comment-body"
                        style={{ fontStyle: "italic", color: "#94A3B8" }}
                      >
                        Rated {rev.rating} out of 5 stars without written comments.
                      </p>
                    )}
                  </article>
                ))
              ) : (
                <div className="reviews-empty-state">
                  <MessageSquare
                    size={36}
                    style={{ color: "#94A3B8", margin: "0 auto" }}
                  />
                  <h4 className="empty-state-title">No Reviews Yet</h4>
                  <p className="empty-state-text">
                    Be the first client to review this piece and share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProductDetails;
