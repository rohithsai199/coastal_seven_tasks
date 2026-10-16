import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useStorefrontStore } from "../../stores/storefrontStore";

export const ACCESSORIES_LOOKS = [
  {
    id: 201,
    title: "AeroTitanium Polarized Navigator Sunglasses",
    price: 285,
    originalPrice: 340,
    rating: 4.9,
    reviews: 168,
    badge: "Aerospace Grade",
    image: "/images/acc_arch1.jpg",
    fabric: "Grade-5 Aerospace Titanium & Nylon Polyamide Optics",
    silhouette: "Architectural Double-Bridge Aviator with Matte DLC Finish",
    care: "Microfiber Polish • Protective Hydrophobic Coating",
    sizes: ["Standard (54mm)", "Large (58mm)"],
    tagline: "Ultra-lightweight 18g titanium construction with custom flex hinges and distortion-free glaucous lenses.",
    heightTier: "arch-sm",
    tag: "Titanium Optics",
  },
  {
    id: 202,
    title: "Saffiano Leather Grand Weekender Duffel",
    price: 420,
    originalPrice: 495,
    rating: 5.0,
    reviews: 142,
    badge: "Italian Leather",
    image: "/images/acc_arch2.jpg",
    fabric: "Full-Grain Italian Saffiano Calfskin & Water-Resistant Twill",
    silhouette: "Structured Weekender with Solid Palladium Hardware",
    care: "Leather Balm Specialist Care • Dust Bag Storage",
    sizes: ["Cabin 45L", "Grand 55L"],
    tagline: "Cross-hatch scratch-resistant saffiano calfskin in slate-blue with reinforced base and detachable strap.",
    heightTier: "arch-md",
    tag: "Grand Travel",
  },
  {
    id: 203,
    title: "Aura Chronometer Royal Edition Ice-Blue Timepiece",
    price: 680,
    originalPrice: 790,
    rating: 5.0,
    reviews: 420,
    badge: "Haute Horlogerie",
    image: "/images/acc_arch3.jpg",
    fabric: "316L Surgical Stainless Steel • Sapphire Crystal • Swiss Automatic",
    silhouette: "41mm Integrated Steel Bracelet with Micro-Tapisserie Dial",
    care: "10 ATM Water Resistant • 5-Year International Atelier Warranty",
    sizes: ["41mm Steel", "38mm Midsize"],
    tagline: "Iconic octagonal bezel with micro-tapisserie ice-blue sunburst dial and exhibition caseback.",
    heightTier: "arch-lg",
    isHero: true,
    tag: "Masterpiece",
  },
  {
    id: 204,
    title: "CarbonShield RFID Titanium Money Clip & Bifold",
    price: 165,
    originalPrice: 195,
    rating: 4.9,
    reviews: 215,
    badge: "Minimalist Luxe",
    image: "/images/acc_arch4.jpg",
    fabric: "Aerospace 3K Carbon Fiber & Slate Vegetable-Tanned Leather",
    silhouette: "Ultra-Slim 8mm Profile with Spring Titanium Money Clip",
    care: "RFID Anti-Skimming Shield • Wipe Clean with Damp Cloth",
    sizes: ["Compact Bifold"],
    tagline: "Ultra-slim profile combining bulletproof carbon weave with buttery Italian leather linings.",
    heightTier: "arch-md",
    tag: "Smart Carry",
  },
  {
    id: 205,
    title: "Reversible Full-Grain Calfskin & Palladium Belt",
    price: 195,
    originalPrice: 230,
    rating: 4.8,
    reviews: 134,
    badge: "Bespoke Atelier",
    image: "/images/acc_arch5.jpg",
    fabric: "Dual-Sided French Calfskin (Glaucous Blue & Deep Charcoal)",
    silhouette: "35mm Reversible Belt with Hand-Polished Palladium Buckle",
    care: "Gentle Leather Conditioner • Store Rolled",
    sizes: ["32\"", "34\"", "36\"", "38\"", "40\""],
    tagline: "Twist-and-turn reversible buckle mechanism transitioning seamlessly from boardroom to evening.",
    heightTier: "arch-sm",
    tag: "Reversible Belt",
  },
];

function AccessoriesView({ onAddToCart, onBackToNormal }) {
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
  const customConfig = useStorefrontStore((state) => state.config.accessories);

  const looks = ACCESSORIES_LOOKS.map((item, idx) => {
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
      prev === 0 ? ACCESSORIES_LOOKS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveModelIndex((prev) =>
      prev === ACCESSORIES_LOOKS.length - 1 ? 0 : prev + 1
    );
  };

  const toggleLike = (id) => {
    setLikedLooks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSizeSelect = (lookId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [lookId]: size }));
  };

  const handleScrollToDetail = () => {
    const el = document.getElementById("accessories-look-spotlight");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="accessories-fashion-wrapper animate-fadeIn">
      {/* ========================================================
          1. ACCESSORIES HERO SECTION (GLAUCOUS CANVAS WITH 5 ARCHES)
      ======================================================== */}
      <section className="accessories-hero-canvas">
        <div className="accessories-hero-inner">
          {/* Top Pill / Tag */}
          <div className="accessories-hero-tag-pill">
            <span className="accessories-tag-dot" />
            <span className="accessories-tag-text">{customConfig?.tagPill || "NEW ACCESSORIES ATELIER • 2026"}</span>
            <span className="accessories-tag-dot" />
          </div>

          {/* Video Replica Headline in Glaucous Luxury Style */}
          <h1 className="accessories-hero-headline">
            {customConfig?.headline || (
              <>Where precision craftsmanship meets <br className="hidden-mobile" /> enduring luxury accessories</>
            )}
          </h1>

          <p className="accessories-hero-description">
            {customConfig?.description || "Experience curated accessories defined by aerospace titanium, Swiss haute horlogerie, and hand-stitched Italian leather engineered in timeless glaucous slate tones."}
          </p>

          {/* Action CTAs */}
          <div className="accessories-cta-bar">
            <button
              type="button"
              onClick={handleScrollToDetail}
              className="btn-accessories-collection"
            >
              <span>{customConfig?.primaryCtaText || "Explore Collection"}</span>
              <span className="btn-accessories-circle-dot" />
            </button>

            <button
              type="button"
              onClick={onBackToNormal}
              className="btn-accessories-ghost"
              title="Return to standard shop"
            >
              <span>{customConfig?.secondaryCtaText || "Back to All Gear"}</span>
            </button>
          </div>

          {/* 5 ARCHED WINDOWS GALLERY */}
          <div className="accessories-stage-container">
            <div className="accessories-arch-gallery" role="region" aria-label="Accessories Atelier Lookbook">
              {looks.map((model, idx) => {
                const isSelected = idx === activeModelIndex;
                return (
                  <div
                    key={model.id}
                    onClick={() => setActiveModelIndex(idx)}
                    className={`accessories-arch-card ${model.heightTier} ${
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
                      <div className="arch-overlay-gradient accessories-arch-overlay" />
                    </div>

                    <div className="arch-card-caption">
                      <span className="arch-pill-badge accessories-pill-badge">{model.tag}</span>
                      <h4 className="arch-card-title">
                        {model.title.split(" ")[0]} {model.title.split(" ")[1] || ""}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Runway Arrow Navigation */}
            <div className="zevana-nav-arrows accessories-nav-arrows">
              <button
                type="button"
                onClick={handlePrev}
                className="zevana-arrow-btn accessories-arrow-btn"
                aria-label="Previous accessory"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="zevana-arrow-btn accessories-arrow-btn"
                aria-label="Next accessory"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. FILMSTRIP TRAY CAROUSEL (GLAUCOUS PALETTE)
      ======================================================== */}
      <div className="zevana-filmstrip-tray accessories-filmstrip-tray">
        <div className="filmstrip-inner-grid">
          {looks.map((look, idx) => {
            const isSelected = idx === activeModelIndex;
            const isLiked = likedLooks[look.id];
            return (
              <div
                key={look.id}
                onClick={() => setActiveModelIndex(idx)}
                className={`filmstrip-card accessories-filmstrip-card ${isSelected ? "active" : ""}`}
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
          3. ACTIVE ACCESSORY DETAIL SPOTLIGHT
      ======================================================== */}
      <section id="accessories-look-spotlight" className="zevana-details-section accessories-details-section">
        <div className="container zevana-spotlight-grid">
          <div className="spotlight-left-media">
            <div className="spotlight-frame accessories-spotlight-frame">
              <img
                src={activeLook.image}
                alt={activeLook.title}
                className="spotlight-main-img"
              />
              <span className="spotlight-badge accessories-spotlight-badge">{activeLook.badge}</span>
            </div>
          </div>

          <div className="spotlight-right-content">
            <span className="spotlight-sub accessories-spotlight-sub">
              {customConfig?.spotlightSubtitle || "SWISS HOROLOGY & LEATHER ATELIER • 2026"}
            </span>
            <h2 className="spotlight-title">{activeLook.title}</h2>
            <p className="spotlight-tagline">{activeLook.tagline}</p>

            <div className="spotlight-price-row">
              <span className="spotlight-price accessories-spotlight-price">₹{activeLook.price}</span>
              <span className="spotlight-orig-price">₹{activeLook.originalPrice}</span>
              <span className="spotlight-tax-tag">{customConfig?.guaranteeText || "VAT Included • Complimentary Global Courier"}</span>
            </div>

            {/* Spec Sheet in English */}
            <div className="spotlight-specs-box">
              <div className="spec-row">
                <span className="spec-key">Material:</span>
                <span className="spec-val">{activeLook.fabric}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Craftsmanship:</span>
                <span className="spec-val">{activeLook.silhouette}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Care & Warranty:</span>
                <span className="spec-val">{activeLook.care}</span>
              </div>
            </div>

            {/* Variant / Size Selector */}
            <div className="spotlight-size-section">
              <div className="size-header-row">
                <span className="size-title">Select Edition / Size:</span>
                <span className="size-guide-link">Accessory Specification Guide</span>
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
                      className={`spotlight-size-btn accessories-size-btn ${isChosen ? "chosen" : ""}`}
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
                className="btn-zevana-add btn-accessories-add"
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
              <span>✓ Swiss & Italian Master Craftsman Certified</span>
              <span>✓ Lifetime Authenticity Guarantee & Certificate</span>
              <span>✓ Signature Velvet Presentation Box & Ribbon</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AccessoriesView;
