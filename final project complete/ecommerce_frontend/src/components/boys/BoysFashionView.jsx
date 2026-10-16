import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useStorefrontStore } from "../../stores/storefrontStore";

export const BOYS_LOOKS = [
  {
    id: 1,
    title: "Noir Minimalist Utility Overshirt & Trousers",
    price: 165,
    originalPrice: 195,
    rating: 4.9,
    reviews: 118,
    badge: "Sharp Fit",
    image: "/images/boys_arch1.jpg",
    fabric: "Japanese Cotton-Nylon Twill",
    silhouette: "Architectural Boxy Fit with Tapered Leg",
    care: "Cold Gentle Machine Wash • Hang Dry",
    sizes: ["S", "M", "L", "XL"],
    tagline: "Clean architectural utility with matte black hardware and articulated sleeves.",
    heightTier: "arch-sm",
    tag: "Sharp Fit",
  },
  {
    id: 2,
    title: "Earthy Olive Waffle Knit Vest & Oxford",
    price: 120,
    originalPrice: 145,
    rating: 4.8,
    reviews: 86,
    badge: "Artisan Texture",
    image: "/images/boys_arch2.jpg",
    fabric: "Chunky Merino Wool & Organic Cotton",
    silhouette: "Relaxed Sleeveless Crewneck Layer",
    care: "Hand Wash Cold • Lay Flat to Dry",
    sizes: ["S", "M", "L", "XL"],
    tagline: "Tactile moss-stitch waffle knit layered over crisp poplin tailored shirting.",
    heightTier: "arch-md",
    tag: "Texture",
  },
  {
    id: 3,
    title: "Tailored Terracotta Clay Blazer & Turtleneck",
    price: 220,
    originalPrice: 260,
    rating: 5.0,
    reviews: 254,
    badge: "Signature Look",
    image: "/images/boys_arch3.jpg",
    fabric: "Italian Wool-Silk Blend with Cupro Lining",
    silhouette: "Deconstructed Single-Breasted Modern Blazer",
    care: "Dry Clean Specialist Only",
    sizes: ["S", "M", "L", "XL"],
    tagline: "Natural roll notched lapels draped in warm terracotta earth pigment dye.",
    heightTier: "arch-lg",
    isHero: true,
    tag: "Signature Look",
  },
  {
    id: 4,
    title: "Oatmeal Chunky Waffle Knit Pullover",
    price: 135,
    originalPrice: 160,
    rating: 4.9,
    reviews: 142,
    badge: "Relaxed Streetwear",
    image: "/images/boys_arch4.jpg",
    fabric: "Heavyweight 480 GSM Organic Ribbed Cotton",
    silhouette: "Drop-Shoulder Relaxed Casual Silhouette",
    care: "Gentle Cold Wash • Dry Flat",
    sizes: ["S", "M", "L", "XL"],
    tagline: "Ultra-soft waffle knit with thermal warmth retention and raw edge hems.",
    heightTier: "arch-md",
    tag: "Relaxed",
  },
  {
    id: 5,
    title: "Milanese Charcoal Double-Faced Overcoat",
    price: 245,
    originalPrice: 290,
    rating: 4.9,
    reviews: 98,
    badge: "Winter Atelier",
    image: "/images/boys_arch5.jpg",
    fabric: "Double-Faced Virgin Wool Blend",
    silhouette: "Structured Knee-Length Tailored Overcoat",
    care: "Dry Clean Only",
    sizes: ["S", "M", "L", "XL"],
    tagline: "Elongated architectural drape with hand-stitched lapels and mockneck inner.",
    heightTier: "arch-sm",
    tag: "Structured",
  },
];

export const ARCH_MODELS = BOYS_LOOKS;

function BoysFashionView({ onAddToCart, onBackToNormal }) {
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
  const customConfig = useStorefrontStore((state) => state.config.boys);

  const looks = BOYS_LOOKS.map((item, idx) => {
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
      prev === 0 ? BOYS_LOOKS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveModelIndex((prev) =>
      prev === BOYS_LOOKS.length - 1 ? 0 : prev + 1
    );
  };

  const toggleLike = (id) => {
    setLikedLooks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSizeSelect = (lookId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [lookId]: size }));
  };

  const handleScrollToDetail = () => {
    const el = document.getElementById("boys-look-spotlight");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="boys-fashion-wrapper animate-fadeIn">
      {/* ========================================================
          1. BOYS HERO SECTION (WARM TERRACOTTA CANVAS WITH 5 ARCHES)
      ======================================================== */}
      <section className="boys-hero-canvas">
        <div className="boys-hero-inner">
          {/* Top Pill / Tag */}
          <div className="boys-hero-tag-pill">
            <span className="boys-tag-dot" />
            <span className="boys-tag-text">{customConfig?.tagPill || "NEW BOYS COLLECTION • 2026"}</span>
            <span className="boys-tag-dot" />
          </div>

          {/* Video Replica Headline */}
          <h1 className="boys-hero-headline">
            {customConfig?.headline || (
              <>Where style meets innovative ways of <br className="hidden-mobile" /> meeting new fashion</>
            )}
          </h1>

          <p className="boys-hero-description">
            {customConfig?.description || "Experience curated menswear defined by architectural silhouettes, tactile waffle knits, and earthy terracotta tones engineered for the modern gentleman."}
          </p>

          {/* Action CTAs */}
          <div className="boys-cta-bar">
            <button
              type="button"
              onClick={handleScrollToDetail}
              className="btn-boys-collection"
            >
              <span>{customConfig?.primaryCtaText || "New Collection"}</span>
              <span className="btn-circle-dot" />
            </button>

            <button
              type="button"
              onClick={onBackToNormal}
              className="btn-boys-ghost"
              title="Return to standard shop"
            >
              <span>{customConfig?.secondaryCtaText || "Back to All Gear"}</span>
            </button>
          </div>

          {/* 5 ARCHED WINDOWS GALLERY */}
          <div className="boys-stage-container">
            <div className="boys-arch-gallery" role="region" aria-label="Boys Fashion Lookbook">
              {looks.map((model, idx) => {
                const isSelected = idx === activeModelIndex;
                return (
                  <div
                    key={model.id}
                    onClick={() => setActiveModelIndex(idx)}
                    className={`boys-arch-card ${model.heightTier} ${
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
                      <h4 className="arch-card-title">{model.title.split(" ")[0]} {model.title.split(" ")[1] || ""}</h4>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Runway Arrow Navigation */}
            <div className="zevana-nav-arrows boys-nav-arrows">
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
          2. FILMSTRIP TRAY CAROUSEL (GIRLS UI MATCH)
      ======================================================== */}
      <div className="zevana-filmstrip-tray boys-filmstrip-tray">
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
          3. ACTIVE LOOK DETAIL SPOTLIGHT (GIRLS UI REPLICA)
      ======================================================== */}
      <section id="boys-look-spotlight" className="zevana-details-section boys-details-section">
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
            <span className="spotlight-sub">{customConfig?.spotlightSubtitle || "AURA MENSWEAR ATELIER • 2026 ARCHIVE"}</span>
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
                <span className="spec-val">{activeLook.care}</span>
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
                aria-label="Save to wishlist"
              >
                <Heart
                  size={18}
                  fill={likedLooks[activeLook.id] ? "#ff4757" : "none"}
                />
              </button>
            </div>

            <div className="spotlight-perks-row">
              <span>✓ Handcrafted in Milan Atelier</span>
              <span>✓ 14-Day Complimentary Bespoke Exchange</span>
              <span>✓ Custom Luxury Presentation Packaging</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BoysFashionView;
