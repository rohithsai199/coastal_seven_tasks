import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
} from "lucide-react";
import { useStorefrontStore } from "../../stores/storefrontStore";

export const BEAUTY_PRODUCTS = [
  {
    id: 1,
    title: "Velvet Crimson Matte Lipstick 103",
    shortTitle: "Velvet Crimson",
    price: 58,
    originalPrice: 72,
    rating: 4.9,
    reviews: 184,
    badge: "Royal Crimson",
    tag: "Velvet Matte",
    heightTier: "arch-sm",
    image: "/images/beauty_prod1.jpg",
    formula: "Pure Velvet Pigment with Camellia Oil & Shea Butter",
    finish: "Weightless Comfort-Matte • 16-Hour Hydrating Wear",
    shades: ["103 Royal Crimson", "104 Cherry Red", "105 Warm Nude", "106 Midnight Plum"],
    tagline: "Signature velvet crimson lipstick in sculpted ribbed gold casing.",
  },
  {
    id: 2,
    title: "Golden Radiance 24K Cellular Serum",
    shortTitle: "Golden Radiance",
    price: 135,
    originalPrice: 165,
    rating: 5.0,
    reviews: 219,
    badge: "Cellular Elixir",
    tag: "24K Gold",
    heightTier: "arch-md",
    image: "/images/beauty_prod2.jpg",
    formula: "Colloidal 24K Gold, Damask Rose & Hyaluronic Acid",
    finish: "Luminous Cellular Radiance & Deep Hydration",
    shades: ["30ml Glass Dropper", "50ml Luxury Bottle"],
    tagline: "Ultra-concentrated restorative youth fluid in fluted crystal with golden dropper.",
  },
  {
    id: 3,
    title: "Amber Glow Luxury Crystal Perfume",
    shortTitle: "Amber Glow",
    price: 240,
    originalPrice: 295,
    rating: 5.0,
    reviews: 312,
    badge: "Masterpiece",
    tag: "Pure Perfume",
    heightTier: "arch-lg",
    isCenterpiece: true,
    image: "/images/beauty_prod3.jpg",
    formula: "Rare Bulgarian Rose, Golden Amber & White Camellia",
    finish: "Bespoke Long-Lasting Scent • Pure Perfume Extract",
    shades: ["50ml Pure Perfume", "100ml Special Edition"],
    tagline: "Faceted octagonal crystal bottle crowned with hand-engraved filigree gold.",
  },
  {
    id: 4,
    title: "Rose Petal Sculpted Illuminating Powder",
    shortTitle: "Rose Petal Glow",
    price: 78,
    originalPrice: 95,
    rating: 4.9,
    reviews: 142,
    badge: "Sculpted Glow",
    tag: "Silk Compact",
    heightTier: "arch-md",
    image: "/images/beauty_prod4.jpg",
    formula: "Micro-milled Pearl Pigment & Organic Rosehip Oil",
    finish: "Soft-Focus Candlelight Glow with Mirror & Brush",
    shades: ["01 Rose Pearl", "02 Champagne Gold", "03 Warm Bronze"],
    tagline: "Intricately embossed rose petal powder set in lacquered black and polished gold vanity compact.",
  },
  {
    id: 5,
    title: "Restorative Botanical Night Repair Cream",
    shortTitle: "Night Repair Cream",
    price: 155,
    originalPrice: 190,
    rating: 4.8,
    reviews: 168,
    badge: "Night Repair",
    tag: "Hydra-Cream",
    heightTier: "arch-sm",
    image: "/images/beauty_prod5.jpg",
    formula: "Marine Peptides, Botanical Squalane & Wild Lavender",
    finish: "Whipped Velvety Barrier Repair with Sculpting Gold Spatula",
    shades: ["50ml Glass Jar", "100ml Luxury Jar"],
    tagline: "Whipped regenerating restorative balm housed in heavy frosted glass with solid gold lid.",
  },
];

function BeautyView({ onAddToCart, onBackToNormal }) {
  const [searchParams] = useSearchParams();
  const lookParam = searchParams.get("look");
  const parsedLook =
    lookParam !== null && !isNaN(Number(lookParam)) ? Number(lookParam) : null;
  const initialIndex =
    parsedLook !== null && parsedLook >= 0 && parsedLook < 5 ? parsedLook : 2;

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (parsedLook !== null && parsedLook >= 0 && parsedLook < 5) {
      setActiveIndex(parsedLook);
    }
  }, [parsedLook]);
  const [likedItems, setLikedItems] = useState({});
  const [selectedShades, setSelectedShades] = useState({});
  const customConfig = useStorefrontStore((state) => state.config.beauty);

  const products = BEAUTY_PRODUCTS.map((item, idx) => {
    const customLook = customConfig?.looks?.[idx];
    if (customLook) {
      return {
        ...item,
        title: customLook.title || item.title,
        shortTitle: customLook.title || item.shortTitle,
        price: customLook.rawPrice || customLook.price || item.price,
        originalPrice: customLook.originalPrice || item.originalPrice,
        image: customLook.image || item.image,
        tagline: customLook.tagline || item.tagline,
        badge: customLook.badge || item.badge,
        tag: customLook.tag || customLook.badge || item.tag,
        formula: customLook.fabric || item.formula,
        finish: customLook.silhouette || item.finish,
        care: customLook.care || item.care,
      };
    }
    return item;
  });

  const activeProduct = products[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? BEAUTY_PRODUCTS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      prev === BEAUTY_PRODUCTS.length - 1 ? 0 : prev + 1
    );
  };

  const toggleLike = (id) => {
    setLikedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShadeSelect = (prodId, shade) => {
    setSelectedShades((prev) => ({ ...prev, [prodId]: shade }));
  };

  const handleScrollToDetail = () => {
    const el = document.getElementById("beauty-product-spotlight");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="girls-fashion-wrapper beauty-fashion-wrapper animate-fadeIn">
      {/* ========================================================
          1. BEAUTY HERO SECTION (PRISTINE WHITE CANVAS WITH 5 ARCHES)
      ======================================================== */}
      <section className="girls-hero-canvas beauty-hero-canvas">
        <div className="girls-hero-inner">
          {/* Top Tag Pill */}
          <div className="girls-hero-tag-pill">
            <span className="girls-tag-dot" />
            <span className="girls-tag-text">{customConfig?.tagPill || "NEW BEAUTY COLLECTION • 2026"}</span>
            <span className="girls-tag-dot" />
          </div>

          {/* Headline */}
          <h1 className="girls-hero-headline">
            {customConfig?.headline || (
              <>Where Radiance Meets Fine Fragrance & <br className="hidden-mobile" /> Botanical Artistry</>
            )}
          </h1>

          <p className="girls-hero-description">
            {customConfig?.description || "Experience curated luxury cosmetics defined by velvet matte lipsticks, 24K gold cellular serums, and bespoke fine perfumes engineered for timeless beauty."}
          </p>

          {/* Action CTAs */}
          <div className="girls-cta-bar">
            <button
              type="button"
              onClick={handleScrollToDetail}
              className="btn-girls-collection"
            >
              <span>{customConfig?.primaryCtaText || "Explore Elixirs"}</span>
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
            <div className="girls-arch-gallery" role="region" aria-label="Beauty Lookbook">
              {products.map((prod, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <div
                    key={prod.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`girls-arch-card ${prod.heightTier} ${
                      isSelected ? "selected" : ""
                    }`}
                  >
                    <div className="arch-image-wrap">
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="arch-img"
                        loading="eager"
                      />
                      <div className="arch-overlay-gradient" />
                    </div>

                    <div className="arch-card-caption">
                      <span className="arch-pill-badge">{prod.tag}</span>
                      <h4 className="arch-card-title">
                        {prod.shortTitle || prod.title}
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
                aria-label="Previous beauty product"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="zevana-arrow-btn"
                aria-label="Next beauty product"
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
          {products.map((prod, idx) => {
            const isSelected = idx === activeIndex;
            const isLiked = likedItems[prod.id];
            return (
              <div
                key={prod.id}
                onClick={() => setActiveIndex(idx)}
                className={`filmstrip-card ${isSelected ? "active" : ""}`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(prod.id);
                  }}
                  className={`filmstrip-like-btn ${isLiked ? "liked" : ""}`}
                  aria-label="Save to wishlist"
                >
                  <Heart size={14} fill={isLiked ? "#ff4757" : "none"} />
                </button>

                <div className="filmstrip-thumb-box">
                  <img
                    src={prod.image}
                    alt={prod.title}
                    className="filmstrip-thumb-img"
                  />
                </div>

                <div className="filmstrip-info">
                  <h4 className="filmstrip-title">{prod.title}</h4>
                  <div className="filmstrip-meta">
                    <span className="filmstrip-price">₹{prod.price}</span>
                    <div className="filmstrip-rating">
                      <Star size={11} fill="#FFA502" color="#FFA502" />
                      <span>{prod.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          3. ACTIVE BEAUTY DETAIL SPOTLIGHT & ORDERING
      ======================================================== */}
      <section id="beauty-product-spotlight" className="zevana-details-section girls-details-section">
        <div className="container zevana-spotlight-grid">
          <div className="spotlight-left-media">
            <div className="spotlight-frame">
              <img
                src={activeProduct.image}
                alt={activeProduct.title}
                className="spotlight-main-img"
              />
              <span className="spotlight-badge">{activeProduct.badge}</span>
            </div>
          </div>

          <div className="spotlight-right-content">
            <span className="spotlight-sub">{customConfig?.spotlightSubtitle || "FRENCH BOTANICAL ALCHEMY • 2026 HARVEST"}</span>
            <h2 className="spotlight-title">{activeProduct.title}</h2>
            <p className="spotlight-tagline">{activeProduct.tagline}</p>

            <div className="spotlight-price-row">
              <span className="spotlight-price">₹{activeProduct.price}</span>
              <span className="spotlight-orig-price">₹{activeProduct.originalPrice}</span>
              <span className="spotlight-tax-tag">{customConfig?.guaranteeText || "VAT Included • Complimentary Global Courier"}</span>
            </div>

            {/* Formula Specification Sheet */}
            <div className="spotlight-specs-box">
              <div className="spec-row">
                <span className="spec-key">Formula:</span>
                <span className="spec-val">{activeProduct.formula}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Finish & Scent:</span>
                <span className="spec-val">{activeProduct.finish}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Product Origin:</span>
                <span className="spec-val">Pure European Botanicals</span>
              </div>
            </div>

            {/* Shade / Size Selector */}
            <div className="spotlight-size-section">
              <div className="size-header-row">
                <span className="size-title">Select Shade / Size:</span>
                <span className="size-guide-link">Ingredient & Purity Guide</span>
              </div>

              <div className="size-buttons-row">
                {activeProduct.shades.map((sh) => {
                  const isChosen =
                    selectedShades[activeProduct.id] === sh ||
                    (!selectedShades[activeProduct.id] && sh === activeProduct.shades[0]);
                  return (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => handleShadeSelect(activeProduct.id, sh)}
                      className={`spotlight-size-btn ${isChosen ? "chosen" : ""}`}
                      style={{ width: "auto", padding: "0 14px", height: "38px" }}
                    >
                      {sh}
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
                    id: activeProduct.id,
                    name: activeProduct.title,
                    price: activeProduct.price,
                  })
                }
                className="btn-zevana-add"
              >
                <ShoppingBag size={18} />
                <span>Add to Bag • ₹{activeProduct.price}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleLike(activeProduct.id)}
                className={`btn-zevana-wishlist ${
                  likedItems[activeProduct.id] ? "liked" : ""
                }`}
                aria-label="Save to wishlist"
              >
                <Heart
                  size={18}
                  fill={likedItems[activeProduct.id] ? "#ff4757" : "none"}
                />
              </button>
            </div>

            <div className="spotlight-perks-row">
              <span>✓ Handcrafted with Pure Luxury Botanicals</span>
              <span>✓ Dermatologist Tested • 100% Clean Formulation</span>
              <span>✓ Custom Luxury Presentation Gift Box with Silk Ribbon</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BeautyView;
