import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStorefrontStore } from "../../stores/storefrontStore";

export const GIRLS_LOOKS = [
  {
    id: 1,
    title: "Noir Enchanté High-Neck Gown",
    price: 180,
    originalPrice: 220,
    rating: 4.9,
    reviews: 124,
    badge: "Haute Couture",
    tag: "High-Neck",
    heightTier: "arch-sm",
    image: "/images/girls_model1.jpg",
    fabric: "Structured French Wool Crepe",
    silhouette: "Column Gown with High Slit",
    sizes: ["XS", "S", "M", "L"],
    tagline: "Regal mock neckline with architectural side drape",
  },
  {
    id: 2,
    title: "Midnight Silk Voluminous Gown",
    price: 165,
    originalPrice: 195,
    rating: 4.8,
    reviews: 89,
    badge: "Runway Pick",
    tag: "Silk Satin",
    heightTier: "arch-md",
    image: "/images/girls_model2.jpg",
    fabric: "Duchess Satin Silk",
    silhouette: "Flared Halter Silhouette",
    sizes: ["XS", "S", "M"],
    tagline: "Dramatic flowing sweep with cross-pleated bodice",
  },
  {
    id: 3,
    title: "Siren Slit Velvet Runway Gown",
    price: 220,
    originalPrice: 280,
    rating: 5.0,
    reviews: 248,
    badge: "Centerpiece",
    tag: "Signature",
    heightTier: "arch-lg",
    isCenterpiece: true,
    image: "/images/girls_model3.jpg",
    fabric: "Crushed Silk Velvet",
    silhouette: "Off-Shoulder High Slit",
    sizes: ["XS", "S", "M", "L", "XL"],
    tagline: "Signature off-shoulder corset with cascading train",
  },
  {
    id: 4,
    title: "Architectural Strapless Mini Dress",
    price: 140,
    originalPrice: 165,
    rating: 4.9,
    reviews: 172,
    badge: "Cocktail Edit",
    tag: "Mini Dress",
    heightTier: "arch-md",
    image: "/images/girls_model4.jpg",
    fabric: "Bonded Italian Satin",
    silhouette: "Sculptural Origami Mini",
    sizes: ["XS", "S", "M"],
    tagline: "Asymmetric neckline fold with tailored interior corset",
  },
  {
    id: 5,
    title: "Monochrome Geometric Cutout Gown",
    price: 195,
    originalPrice: 240,
    rating: 4.8,
    reviews: 95,
    badge: "Modernist",
    tag: "Cutout Gown",
    heightTier: "arch-sm",
    image: "/images/girls_model5.jpg",
    fabric: "Heavy Stretch Crepe",
    silhouette: "Long-Sleeve Fishtail",
    sizes: ["S", "M", "L"],
    tagline: "Precision waist cutout with elongated fluted hem",
  },
];

function GirlsFashionView({ onAddToCart, onBackToNormal }) {
  const [searchParams] = useSearchParams();
  const lookParam = searchParams.get("look");
  const parsedLook =
    lookParam !== null && !isNaN(Number(lookParam)) ? Number(lookParam) : null;
  const initialIndex =
    parsedLook !== null && parsedLook >= 0 && parsedLook < 5 ? parsedLook : 2;

  const [activeModelIndex, setActiveModelIndex] = useState(initialIndex);

  useEffect(() => {
    if (parsedLook !== null && parsedLook >= 0 && parsedLook < 5) {
      setActiveModelIndex(parsedLook);
    }
  }, [parsedLook]);
  const [likedLooks, setLikedLooks] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const customConfig = useStorefrontStore((state) => state.config.girls);

  const looks = GIRLS_LOOKS.map((item, idx) => {
    const customLook = customConfig?.looks?.[idx];
    if (customLook) {
      return {
        ...item,
        title: customLook.title || item.title,
        price: customLook.rawPrice || customLook.price || item.price,
        originalPrice: customLook.originalPrice || item.originalPrice,
        image: customLook.image || item.image,
        tagline: customLook.tagline || item.tagline,
        badge: customLook.badge || item.badge,
        tag: customLook.tag || customLook.badge || item.tag,
        fabric: customLook.fabric || item.fabric,
        silhouette: customLook.silhouette || item.silhouette,
        care: customLook.care || item.care,
      };
    }
    return item;
  });

  const activeLook = looks[activeModelIndex];

  const handlePrev = () => {
    setActiveModelIndex((prev) =>
      prev === 0 ? GIRLS_LOOKS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveModelIndex((prev) =>
      prev === GIRLS_LOOKS.length - 1 ? 0 : prev + 1
    );
  };

  const toggleLike = (id) => {
    setLikedLooks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSizeSelect = (lookId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [lookId]: size }));
  };

  const handleScrollToDetail = () => {
    const el = document.getElementById("girls-look-spotlight");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="girls-fashion-wrapper animate-fadeIn">
      {/* ========================================================
          1. GIRLS HERO SECTION (WHITE CLEAN CANVAS WITH 5 ARCHES)
      ======================================================== */}
      <section className="girls-hero-canvas">
        <div className="girls-hero-inner">
          {/* Top Pill / Tag */}
          <div className="girls-hero-tag-pill">
            <span className="girls-tag-dot" />
            <span className="girls-tag-text">{customConfig?.tagPill || "NEW GIRLS COLLECTION • 2026"}</span>
            <span className="girls-tag-dot" />
          </div>

          {/* Video Headline Replica */}
          <h1 className="girls-hero-headline">
            {customConfig?.headline || (
              <>Where style meets innovative ways of <br className="hidden-mobile" /> meeting new fashion</>
            )}
          </h1>

          <p className="girls-hero-description">
            {customConfig?.description || "Experience curated womenswear defined by architectural silhouettes, fluid silk draping, and contemporary luxury engineered for the modern woman."}
          </p>

          {/* Action CTAs */}
          <div className="girls-cta-bar">
            <button
              type="button"
              onClick={handleScrollToDetail}
              className="btn-girls-collection"
            >
              <span>{customConfig?.primaryCtaText || "Explore Runway"}</span>
              <span className="btn-circle-dot" />
            </button>

            <button
              type="button"
              onClick={onBackToNormal}
              className="btn-girls-ghost"
              title="Return to standard shop"
            >
              <span>{customConfig?.secondaryCtaText || "Back to All Gear"}</span>
            </button>
          </div>

          {/* 5 ARCHED WINDOWS GALLERY */}
          <div className="girls-stage-container">
            <div className="girls-arch-gallery" role="region" aria-label="Girls Fashion Lookbook">
              {looks.map((model, idx) => {
                const isSelected = idx === activeModelIndex;
                return (
                  <div
                    key={model.id}
                    onClick={() => setActiveModelIndex(idx)}
                    className={`girls-arch-card ${model.heightTier} ${
                      isSelected ? "selected" : ""
                    }`}
                  >
                    <div className="arch-image-wrap">
                      <img
                        src={model.image}
                        alt={model.title}
                        className="arch-img"
                        loading="eager"
                      />
                      <div className="arch-overlay-gradient" />
                    </div>

                    <div className="arch-card-caption">
                      <span className="arch-pill-badge">{model.tag}</span>
                      <h4 className="arch-card-title">
                        {model.title.split(" ")[0]} {model.title.split(" ")[1] || ""}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Runway Arrow Navigation */}
            <div className="zevana-nav-arrows girls-nav-arrows">
              <button
                type="button"
                onClick={handlePrev}
                className="zevana-arrow-btn"
                aria-label="Previous look"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="zevana-arrow-btn"
                aria-label="Next look"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. FILMSTRIP TRAY CAROUSEL
      ======================================================== */}
      <div className="zevana-filmstrip-tray girls-filmstrip-tray">
        <div className="filmstrip-inner-grid">
          {looks.map((look, idx) => {
            const isSelected = idx === activeModelIndex;
            const isLiked = likedLooks[look.id];
            return (
              <div
                key={look.id}
                onClick={() => setActiveModelIndex(idx)}
                className={`filmstrip-card ${isSelected ? "active" : ""}`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(look.id);
                  }}
                  className={`filmstrip-like-btn ${isLiked ? "liked" : ""}`}
                  aria-label="Save to wishlist"
                >
                  <Heart size={14} fill={isLiked ? "#ff4757" : "none"} />
                </button>

                <div className="filmstrip-thumb-box">
                  <img
                    src={look.image}
                    alt={look.title}
                    className="filmstrip-thumb-img"
                  />
                </div>

                <div className="filmstrip-info">
                  <h4 className="filmstrip-title">{look.title}</h4>
                  <div className="filmstrip-meta">
                    <span className="filmstrip-price">₹{look.price}</span>
                    <div className="filmstrip-rating">
                      <Star size={11} fill="#FFA502" color="#FFA502" />
                      <span>{look.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          3. ACTIVE LOOK DETAIL SPOTLIGHT & ORDERING
      ======================================================== */}
      <section id="girls-look-spotlight" className="zevana-details-section girls-details-section">
        <div className="container zevana-spotlight-grid">
          <div className="spotlight-left-media">
            <div className="spotlight-frame">
              <img
                src={activeLook.image}
                alt={activeLook.title}
                className="spotlight-main-img"
              />
              <span className="spotlight-badge">{activeLook.badge}</span>
            </div>
          </div>

          <div className="spotlight-right-content">
            <span className="spotlight-sub">{customConfig?.spotlightSubtitle || "ZEVANA HAUTE COUTURE • 2026 ARCHIVE"}</span>
            <h2 className="spotlight-title">{activeLook.title}</h2>
            <p className="spotlight-tagline">{activeLook.tagline}</p>

            <div className="spotlight-price-row">
              <span className="spotlight-price">₹{activeLook.price}</span>
              <span className="spotlight-orig-price">₹{activeLook.originalPrice}</span>
              <span className="spotlight-tax-tag">{customConfig?.guaranteeText || "VAT Included • Complimentary Global Courier"}</span>
            </div>

            {/* Spec Sheet */}
            <div className="spotlight-specs-box">
              <div className="spec-row">
                <span className="spec-key">Fabric:</span>
                <span className="spec-val">{activeLook.fabric}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Silhouette:</span>
                <span className="spec-val">{activeLook.silhouette}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Care:</span>
                <span className="spec-val">Dry Clean Specialist Only</span>
              </div>
            </div>

            {/* Size Selector */}
            <div className="spotlight-size-section">
              <div className="size-header-row">
                <span className="size-title">Select Size:</span>
                <span className="size-guide-link">Size & Fit Guide</span>
              </div>

              <div className="size-buttons-row">
                {activeLook.sizes.map((sz) => {
                  const isChosen =
                    selectedSizes[activeLook.id] === sz ||
                    (!selectedSizes[activeLook.id] && sz === activeLook.sizes[0]);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleSizeSelect(activeLook.id, sz)}
                      className={`spotlight-size-btn ${isChosen ? "chosen" : ""}`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="spotlight-actions-row">
              <button
                type="button"
                onClick={() =>
                  onAddToCart({
                    id: activeLook.id,
                    name: activeLook.title,
                    price: activeLook.price,
                  })
                }
                className="btn-zevana-add"
              >
                <ShoppingBag size={18} />
                <span>Add to Bag • ₹{activeLook.price}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleLike(activeLook.id)}
                className={`btn-zevana-wishlist ${
                  likedLooks[activeLook.id] ? "liked" : ""
                }`}
              >
                <Heart
                  size={18}
                  fill={likedLooks[activeLook.id] ? "#ff4757" : "none"}
                />
              </button>
            </div>

            <div className="spotlight-perks-row">
              <span>✓ Handcrafted in Milan Atelier</span>
              <span>✓ 14-Day Bespoke Exchange</span>
              <span>✓ Signature Presentation Box</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GirlsFashionView;
