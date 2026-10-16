import { useState, useEffect, useCallback, memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Watch,
  Footprints,
  Backpack,
  Star,
  Zap,
  Sparkles,
  CheckCircle2,
  Flame,
  Award,
  ChevronRight,
} from "lucide-react";
import { getProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import ProductCard from "../../components/product/ProductCard";
import { handleImageError } from "../../utils/imageUrl";
import CategoryNavRow from "../../components/common/CategoryNavRow";
import BoysFashionView from "../../components/boys/BoysFashionView";
import GirlsFashionView from "../../components/girls/GirlsFashionView";
import KidsFashionView from "../../components/kids/KidsFashionView";
import AccessoriesView from "../../components/accessories/AccessoriesView";
import BeautyView from "../../components/beauty/BeautyView";
import Orders from "../Orders/Orders";
import CategoryMiddleShowcase from "../../components/home/CategoryMiddleShowcase";
import HomeProductFilter from "../../components/home/HomeProductFilter";
import { useCategoryStore } from "../../stores/categoryStore";
import { useStorefrontStore } from "../../stores/storefrontStore";

// Isolated Memoized Countdown Component to prevent full page re-renders
const CountdownTimer = memo(function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="countdown-timer-box">
      <div className="timer-unit">
        <span className="timer-number">
          {String(timeLeft.hours).padStart(2, "0")}
        </span>
        <span className="timer-label">Hours</span>
      </div>
      <span className="timer-colon">:</span>
      <div className="timer-unit">
        <span className="timer-number">
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className="timer-label">Mins</span>
      </div>
      <span className="timer-colon">:</span>
      <div className="timer-unit">
        <span className="timer-number">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
        <span className="timer-label">Secs</span>
      </div>
    </div>
  );
});





const TESTIMONIALS = [
  {
    name: "Alex Rivera",
    role: "Creative Director",
    avatar: "AR",
    rating: 5,
    comment:
      "The Tailored Terracotta Blazer is phenomenal. The Italian wool-silk drape is impeccably balanced, and the pigment dye gives it a rich, timeless architectural look.",
  },
  {
    name: "Sarah Chen",
    role: "Fashion Curator",
    avatar: "SC",
    rating: 5,
    comment:
      "The Siren Slit Velvet Runway Gown exceeded every expectation. The silk velvet texture and internal corset structure are genuine haute couture quality.",
  },
  {
    name: "Marcus Vance",
    role: "Collector & Designer",
    avatar: "MV",
    rating: 5,
    comment:
      "The Aura Chronometer Ice-Blue timepiece has world-class finishing on its octagonal bezel. Truly high-end craftsmanship across the entire collection.",
  },
];

function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const activeCategory = useCategoryStore((state) => state.activeCategory);
  const setActiveCategory = useCategoryStore((state) => state.setActiveCategory);
  const homeConfig = useStorefrontStore((state) => state.config.home);

  const [searchParams] = useSearchParams();
  const catParam = searchParams.get("cat");

  // Sync ?cat= query param with store activeCategory
  useEffect(() => {
    if (
      catParam &&
      ["home", "boys", "girls", "kids", "accessories", "beauty", "orders"].includes(catParam)
    ) {
      setActiveCategory(catParam);
    }
  }, [catParam, setActiveCategory]);

  // Fetch initial featured products (all 25 UI products)
  useEffect(() => {
    let mounted = true;
    async function loadFeatured() {
      try {
        setLoading(true);
        const data = await getProducts({ page_size: 25, sort: "newest" });
        if (mounted) {
          setProducts(data || []);
          setFilteredProducts(data || []);
        }
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadFeatured();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = useCallback(async (product) => {
    try {
      await addToCart(product.id, 1);
      setToastMessage(`Added "${product.name}" to your cart!`);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      setToastMessage(
        err.response?.data?.detail || "Please log in to add items to your cart."
      );
      setTimeout(() => setToastMessage(""), 4000);
    }
  }, []);

  return (
    <div className="home-modern-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="modern-toast-notification">
          <Sparkles size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dynamic Category Views (Boys, Girls, or Standard Home) */}
      {activeCategory === "boys" ? (
        <div className="boys-view-container">
          <BoysFashionView
            onAddToCart={handleAddToCart}
            onBackToNormal={() => {
              setActiveCategory("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : activeCategory === "girls" ? (
        <div className="girls-view-container">
          <GirlsFashionView
            onAddToCart={handleAddToCart}
            onBackToNormal={() => {
              setActiveCategory("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : activeCategory === "kids" ? (
        <div className="kids-view-container">
          <KidsFashionView
            onAddToCart={handleAddToCart}
            onBackToNormal={() => {
              setActiveCategory("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : activeCategory === "accessories" ? (
        <div className="accessories-view-container">
          <AccessoriesView
            onAddToCart={handleAddToCart}
            onBackToNormal={() => {
              setActiveCategory("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : activeCategory === "beauty" ? (
        <div className="beauty-view-container">
          <BeautyView
            onAddToCart={handleAddToCart}
            onBackToNormal={() => {
              setActiveCategory("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : activeCategory === "orders" ? (
        <div className="orders-view-container">
          <Orders />
        </div>
      ) : (
        <>
          {/* ========================================================
              0. OPTIONAL TOP ANNOUNCEMENT STRIP (HIDDEN BY DEFAULT)
          ======================================================== */}
          {homeConfig?.showAnnouncement && homeConfig?.announcementText && (
            <div className="home-top-announcement-strip">
              <span className="announcement-sparkle">✦</span>
              <span>{homeConfig.announcementText}</span>
              <span className="announcement-sparkle">✦</span>
            </div>
          )}

          {/* ========================================================
              1. EDITORIAL SHOWCASE (MIDDLE PRODUCTS: BOYS -> GIRLS -> KIDS -> ACCESSORIES -> BEAUTY)
              Fashion-forward full-bleed brand banners inspired by top luxury ecommerce
          ======================================================== */}
          <CategoryMiddleShowcase onAddToCart={handleAddToCart} />

          {/* ========================================================
              2. ALLBIRDS-STYLE REFERENCE PRODUCT FILTER (RED LINE LOCATION)
              Placed exactly between the hero carousel and Curated Best Sellers
          ======================================================== */}
          <HomeProductFilter
            allProducts={products}
            onFilteredProductsChange={setFilteredProducts}
          />

      {/* ========================================================
          4. TRENDING PRODUCTS / BEST SELLERS GRID
      ======================================================== */}
      <section className="trending-products-section content-visibility-auto">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-badge-coral">{homeConfig?.trendingBadge || "Trending Now"}</span>
              <h2 className="section-main-heading">{homeConfig?.trendingHeading || "Curated Best Sellers"}</h2>
              <p className="section-sub-heading">
                {homeConfig?.trendingSubtitle || "Hand-picked essentials crafted with bespoke tailoring, Swiss precision, and pure botanical formulas."}
              </p>
            </div>
            <Link to="/products" className="view-all-link">
              <span>Explore All ({filteredProducts.length})</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="loading-state-container">
              <div className="modern-spinner"></div>
              <p>Loading curated products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="filter-empty-state-card">
              <Sparkles size={32} />
              <h3>No products match your selected filters</h3>
              <p>Try clearing some filters or selecting a different size, color, or price range.</p>
              <button
                type="button"
                className="btn-filter-reset-empty"
                onClick={() => setFilteredProducts(products)}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="products-grid-modern">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          5. SPECIAL PROMO / FLASH SALE BANNER WITH LIVE TIMER
      ======================================================== */}
      <section id="flash-sale" className="flash-sale-banner-section content-visibility-auto">
        <div className="container">
          <div className="flash-sale-card">
            <div className="flash-sale-content">
              <div className="flash-badge">
                <Flame size={16} className="text-yellow animate-pulse" />
                <span>{homeConfig?.flashBadge || "LIMITED TIME DROP"}</span>
              </div>

              <h2 className="flash-title">
                {homeConfig?.flashTitle || (
                  <>
                    Mid-Season Atelier Drop: <br />
                    <span className="text-highlight-yellow">Save Up To 30%</span> On Select Luxury Editions
                  </>
                )}
              </h2>

              <p className="flash-desc">
                {homeConfig?.flashDescription || "Elevate your look with handcrafted Swiss chronometers, tailored Italian blazers, and pure bespoke perfumes at our most coveted prices of the season."}
              </p>

              {/* Memoized Live Countdown Timer */}
              <CountdownTimer />

              <div className="flash-cta-row">
                <Link to="/products" className="btn-flash-primary">
                  {homeConfig?.flashCtaText || "Claim Your Discount Now"}
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="flash-sale-visual">
              <img
                src="/images/acc_arch3.jpg"
                alt="Aura Chronometer Royal Edition Ice-Blue Timepiece"
                onError={(e) => handleImageError(e)}
                className="flash-featured-img"
                loading="lazy"
                decoding="async"
                width="340"
                height="320"
              />
              <div className="flash-discount-tag">
                <span className="tag-pct">{homeConfig?.flashDiscountTag || "30% OFF"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. TESTIMONIALS / SOCIAL PROOF SECTION
      ======================================================== */}
      <section className="testimonials-modern-section content-visibility-auto">
        <div className="container">
          <div className="testimonials-header text-center">
            <span className="section-badge-purple">Real Reviews</span>
            <h2 className="section-main-heading">Loved By 12,000+ Creators</h2>
            <p className="section-sub-heading">
              See what verified customers say about our quality, durability, and customer service.
            </p>
          </div>

          <div className="testimonials-grid-3">
            {TESTIMONIALS.map((testi, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-stars">
                  {[...Array(testi.rating)].map((_, s) => (
                    <Star key={s} size={16} className="star-filled" />
                  ))}
                </div>
                <p className="testimonial-quote">"{testi.comment}"</p>

                <div className="testimonial-author">
                  <div className="author-avatar">{testi.avatar}</div>
                  <div className="author-details">
                    <h4 className="author-name">{testi.name}</h4>
                    <span className="author-role">{testi.role}</span>
                    <span className="verified-badge">
                      <CheckCircle2 size={13} /> Verified Buyer
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          7. NEWSLETTER / VIP ACCESS (GLASSMORPHIC CARD)
      ======================================================== */}
      <section className="newsletter-modern-section content-visibility-auto">
        <div className="container">
          <div className="newsletter-card-glass">
            <div className="newsletter-inner">
              <span className="newsletter-pill">
                <Sparkles size={14} /> {homeConfig?.vipBadge || "VIP CLUB ACCESS"}
              </span>
              <h2 className="newsletter-title">
                {homeConfig?.vipTitle || "Unlock 15% Off Your Next Order"}
              </h2>
              <p className="newsletter-subtitle">
                {homeConfig?.vipSubtitle || "Join 35,000+ members and receive secret product drops, early flash sale access, and members-only discounts straight to your inbox."}
              </p>

              <form
                className="newsletter-glass-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("🎉 Welcome to the VIP club! Coupon code VIP15 has been sent to your email.");
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  required
                  className="newsletter-glass-input"
                />
                <button type="submit" className="btn-newsletter-submit">
                  <span>{homeConfig?.vipButtonText || "Join & Get 15% OFF"}</span>
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="newsletter-perks-row">
                <span>🔒 No spam ever</span>
                <span>⚡ Instant discount delivery</span>
                <span>✨ Unsubscribe anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  );
}

export default Home;