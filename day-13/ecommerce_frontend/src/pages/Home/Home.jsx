import { useState, useEffect } from "react";
import { Link} from "react-router-dom";
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

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [activeHeroTab, setActiveHeroTab] = useState(0);

  // Countdown timer for flash sale
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

  // Fetch featured products
  useEffect(() => {
    async function loadFeatured() {
      try {
        setLoading(true);
        const data = await getProducts({ page_size: 6, sort: "newest" });
        setProducts(data || []);
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleAddToCart = async (product) => {
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
  };

  const heroItems = [
    {
      title: "Apex Pro Wireless ANC",
      tagline: "Ultra-crisp 40mm Beryllium acoustic drivers",
      price: "$249.99",
      rating: "4.9 (1,420 reviews)",
      image: "/images/headphones.jpg",
      badge: "Flagship Choice",
      highlights: ["Hybrid ANC 3.0", "45h Battery", "Spatial Audio"],
      productId: 1,
    },
    {
      title: "Chronos Horizon Titanium",
      tagline: "Aerospace titanium bezel with AMOLED display",
      price: "$329.99",
      rating: "4.9 (980 reviews)",
      image: "/images/smartwatch.jpg",
      badge: "Top Rated 2026",
      highlights: ["Dual-Band GPS", "Biometric Suite", "14-Day Battery"],
      productId: 2,
    },
    {
      title: "Strata Velocity Performance",
      tagline: "Responsive energy-return propulsion foam",
      price: "$149.99",
      rating: "4.8 (2,150 reviews)",
      image: "/images/sneakers.jpg",
      badge: "Trending Fast",
      highlights: ["Ultra-Light Knit", "Zero-Drag Arch", "All-Terrain"],
      productId: 3,
    },
  ];

  const currentHero = heroItems[activeHeroTab];

  const categories = [
    {
      name: "Audio & Acoustics",
      count: "Studio sound quality",
      icon: <Headphones size={28} />,
      color: "from-purple-500 to-indigo-600",
      image: "/images/headphones.jpg",
      badge: "20% OFF",
    },
    {
      name: "Smart Wearables",
      count: "Titanium health tech",
      icon: <Watch size={28} />,
      color: "from-blue-500 to-cyan-600",
      image: "/images/smartwatch.jpg",
      badge: "Hot Pick",
    },
    {
      name: "Performance Footwear",
      count: "Engineered comfort",
      icon: <Footprints size={28} />,
      color: "from-amber-500 to-rose-600",
      image: "/images/sneakers.jpg",
      badge: "New Arrival",
    },
    {
      name: "Urban Carry & Bags",
      count: "Weather-resistant nylon",
      icon: <Backpack size={28} />,
      color: "from-emerald-500 to-teal-600",
      image: "/images/backpack.jpg",
      badge: "Limited Drop",
    },
  ];

  const testimonials = [
    {
      name: "Alex Rivera",
      role: "Creative Director & Tech Reviewer",
      avatar: "AR",
      rating: 5,
      comment:
        "The Apex Pro headphones blew my expectations away. Build quality is flawless, ANC blocks out studio clatter, and the battery feels virtually endless. Instant daily driver.",
    },
    {
      name: "Sarah Chen",
      role: "Marathon Runner & Athlete",
      avatar: "SC",
      rating: 5,
      comment:
        "The Strata Velocity sneakers offer unmatched bounce and foot stability. Plus, the checkout was fast and delivery arrived 2 days earlier than estimated!",
    },
    {
      name: "Marcus Vance",
      role: "Product Designer",
      avatar: "MV",
      rating: 5,
      comment:
        "Clean aesthetic, top tier customer service, and unmatched attention to detail in packaging. ShopStore is now my go-to for all gear updates.",
    },
  ];

  return (
    <div className="home-modern-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="modern-toast-notification">
          <Sparkles size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================
          1. HERO SECTION (SPLIT-SCREEN DESIGN)
      ======================================================== */}
      <section className="hero-modern-section">
        <div className="container hero-split-grid">
          {/* Left Column: Bold Headline & Social Proof & CTAs */}
          <div className="hero-left-content">
            <div className="hero-pill-tag">
              <span className="pill-dot"></span>
              <span className="pill-text">NEW COLLECTION • 2026 RELEASE</span>
              <Sparkles size={14} className="pill-sparkle" />
            </div>

            <h1 className="hero-main-title">
              Next-Gen <span className="text-gradient-purple">Everyday</span>{" "}
              Essentials.
            </h1>

            <p className="hero-subtext">
              Experience meticulously engineered wireless audio, precision
              wearables, and urban lifestyle gear designed for the modern creator.
            </p>

            {/* Social Proof Star Ratings */}
            <div className="hero-social-proof">
              <div className="star-group">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="star-icon fill-current" />
                ))}
              </div>
              <span className="rating-text">
                <strong>4.9 / 5.0</strong> from over 12,000+ verified buyers
              </span>
            </div>

            {/* Primary & Secondary Action CTAs */}
            <div className="hero-cta-group">
              <Link to="/products" className="btn-hero-primary">
                <span>Shop the Collection</span>
                <ArrowRight size={18} />
              </Link>
              <a href="#flash-sale" className="btn-hero-secondary">
                <Flame size={18} className="text-coral" />
                <span>View Flash Deals</span>
              </a>
            </div>

            {/* Micro Guarantees */}
            <div className="hero-micro-perks">
              <div className="micro-perk">
                <CheckCircle2 size={16} className="text-emerald" />
                <span>Free 2-Day Shipping</span>
              </div>
              <div className="micro-perk">
                <CheckCircle2 size={16} className="text-emerald" />
                <span>30-Day Risk-Free Trial</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Interactive Product Showcase */}
          <div className="hero-right-showcase">
            <div className="showcase-card-wrapper">
              <div className="showcase-glow-bg"></div>

              {/* Floating Badges */}
              <div className="floating-badge badge-top-right">
                <Flame size={14} className="badge-icon text-coral" />
                <span>{currentHero.badge}</span>
              </div>

              <div className="floating-badge badge-bottom-left">
                <Zap size={14} className="badge-icon text-yellow" />
                <span>20% OFF Limited Drop</span>
              </div>

              {/* Product Hero Image */}
              <div className="showcase-media">
                <img
                  src={currentHero.image}
                  alt={currentHero.title}
                  onError={(e) => handleImageError(e)}
                  className="showcase-img"
                />
              </div>

              {/* Showcase Detail Info */}
              <div className="showcase-info-box">
                <div className="showcase-info-header">
                  <div>
                    <h3 className="showcase-product-name">
                      {currentHero.title}
                    </h3>
                    <p className="showcase-tagline">{currentHero.tagline}</p>
                  </div>
                  <span className="showcase-price">{currentHero.price}</span>
                </div>

                <div className="showcase-highlights">
                  {currentHero.highlights.map((item, idx) => (
                    <span key={idx} className="highlight-chip">
                      ✓ {item}
                    </span>
                  ))}
                </div>

                <div className="showcase-action-row">
                  <Link
                    to="/products"
                    className="btn-showcase-buy"
                  >
                    <ShoppingBag size={16} />
                    <span>Explore Now</span>
                  </Link>
                </div>
              </div>

              {/* Hero Switcher Tabs */}
              <div className="hero-switcher-tabs">
                {heroItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveHeroTab(idx)}
                    className={`switcher-dot ${
                      activeHeroTab === idx ? "active" : ""
                    }`}
                    aria-label={`View ${item.title}`}
                  >
                    <span>{item.title.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. VALUE PROPOSITION / PERKS BAR (4-COLUMN)
      ======================================================== */}
      <section className="perks-bar-section">
        <div className="container">
          <div className="perks-grid-4">
            <div className="perk-card">
              <div className="perk-icon-wrapper bg-purple-tint">
                <Truck size={24} className="text-purple" />
              </div>
              <div className="perk-text-content">
                <h4 className="perk-title">Free Express Shipping</h4>
                <p className="perk-desc">Fast, tracked delivery on all orders over $50.</p>
              </div>
            </div>

            <div className="perk-card">
              <div className="perk-icon-wrapper bg-coral-tint">
                <RotateCcw size={24} className="text-coral" />
              </div>
              <div className="perk-text-content">
                <h4 className="perk-title">30-Day Money-Back</h4>
                <p className="perk-desc">100% satisfaction guaranteed or full refund.</p>
              </div>
            </div>

            <div className="perk-card">
              <div className="perk-icon-wrapper bg-indigo-tint">
                <Award size={24} className="text-indigo" />
              </div>
              <div className="perk-text-content">
                <h4 className="perk-title">24/7 Priority Support</h4>
                <p className="perk-desc">Real specialist assistance around the clock.</p>
              </div>
            </div>

            <div className="perk-card">
              <div className="perk-icon-wrapper bg-emerald-tint">
                <ShieldCheck size={24} className="text-emerald" />
              </div>
              <div className="perk-text-content">
                <h4 className="perk-title">100% Authentic & Verified</h4>
                <p className="perk-desc">Direct from certified manufacturers with 2-year warranty.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. CURATED CATEGORIES / FEATURED COLLECTIONS
      ======================================================== */}
      <section className="categories-modern-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-badge-purple">Curated Collections</span>
              <h2 className="section-main-heading">Explore By Category</h2>
            </div>
            <Link to="/products" className="view-all-link">
              <span>View All Catalog</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="categories-grid-4">
            {categories.map((cat, index) => (
              <Link
                to="/products"
                key={index}
                className="category-card-interactive group"
              >
                <div className="category-media-box">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    onError={(e) => handleImageError(e)}
                    className="category-img"
                  />
                  <div className="category-badge-pill">{cat.badge}</div>
                </div>
                <div className="category-content">
                  <div className="category-icon-bubble">{cat.icon}</div>
                  <h3 className="category-name">{cat.name}</h3>
                  <p className="category-sub">{cat.count}</p>
                  <span className="category-explore-cta">
                    Browse Gear <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          4. TRENDING PRODUCTS / BEST SELLERS GRID
      ======================================================== */}
      <section className="trending-products-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-badge-coral">Trending Now</span>
              <h2 className="section-main-heading">Top Rated Best Sellers</h2>
              <p className="section-sub-heading">
                Hand-picked essentials crafted with premium engineering and modern aesthetics.
              </p>
            </div>
            <Link to="/products" className="view-all-link">
              <span>Explore All ({products.length})</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="loading-state-container">
              <div className="modern-spinner"></div>
              <p>Loading curated products...</p>
            </div>
          ) : (
            <div className="products-grid-modern">
              {products.map((product) => (
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
      <section id="flash-sale" className="flash-sale-banner-section">
        <div className="container">
          <div className="flash-sale-card">
            <div className="flash-sale-content">
              <div className="flash-badge">
                <Flame size={16} className="text-yellow animate-pulse" />
                <span>LIMITED TIME DROP</span>
              </div>

              <h2 className="flash-title">
                Mid-Season Flash Drop: <br />
                <span className="text-highlight-yellow">Save Up To 40%</span> On Select Gear
              </h2>

              <p className="flash-desc">
                Upgrade your desk setup, fitness routine, and daily carry. Premium audio, smart wearables, and waterproof backpacks at our lowest prices of the season.
              </p>

              {/* Live Countdown Timer */}
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

              <div className="flash-cta-row">
                <Link to="/products" className="btn-flash-primary">
                  Claim Your Discount Now
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="flash-sale-visual">
              <img
                src="/images/speaker.jpg"
                alt="Flash Sale Featured Product"
                onError={(e) => handleImageError(e)}
                className="flash-featured-img"
              />
              <div className="flash-discount-tag">
                <span className="tag-pct">40%</span>
                <span className="tag-text">OFF TODAY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. TESTIMONIALS / SOCIAL PROOF SECTION
      ======================================================== */}
      <section className="testimonials-modern-section">
        <div className="container">
          <div className="testimonials-header text-center">
            <span className="section-badge-purple">Real Reviews</span>
            <h2 className="section-main-heading">Loved By 12,000+ Creators</h2>
            <p className="section-sub-heading">
              See what verified customers say about our quality, durability, and customer service.
            </p>
          </div>

          <div className="testimonials-grid-3">
            {testimonials.map((testi, i) => (
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
      <section className="newsletter-modern-section">
        <div className="container">
          <div className="newsletter-card-glass">
            <div className="newsletter-inner">
              <span className="newsletter-pill">
                <Sparkles size={14} /> VIP CLUB ACCESS
              </span>
              <h2 className="newsletter-title">
                Unlock 15% Off Your Next Order
              </h2>
              <p className="newsletter-subtitle">
                Join 35,000+ members and receive secret product drops, early flash sale access, and members-only discounts straight to your inbox.
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
                  <span>Join & Get 15% OFF</span>
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
    </div>
  );
}

export default Home;