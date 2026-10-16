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

export const KIDS_LOOKS = [
  {
    id: 101,
    title: "Royal Highland Merino Cable-Knit Pullover & Chinos",
    price: 145,
    originalPrice: 175,
    rating: 4.9,
    reviews: 124,
    badge: "Atelier Softness",
    image: "/images/kids_arch1.jpg",
    fabric: "100% Extrafine Australian Merino Wool & Pima Twill",
    silhouette: "Classic Junior Tailored Fit with Reinforced Elbow Patches",
    care: "Delicate Wool Hand Wash • Flat Air Dry",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-12Y"],
    tagline: "Heirloom cable-stitch detailing knit from hypoallergenic non-itch merino fibers for tender skin.",
    heightTier: "arch-sm",
    tag: "Cable Knit",
  },
  {
    id: 102,
    title: "Heritage Hunter Green Quilted Barn Jacket & Corduroys",
    price: 185,
    originalPrice: 215,
    rating: 5.0,
    reviews: 98,
    badge: "British Heritage",
    image: "/images/kids_arch2.jpg",
    fabric: "Water-Repellent Micro-Diamond Quilt with Corduroy Collar",
    silhouette: "Traditional Equestrian Silhouette with Brass Snap Hardware",
    care: "Gentle Machine Wash Cold • Tumble Dry Low",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-12Y"],
    tagline: "Timeless country-estate barn jacket lined with brushed organic tartan cotton for thermal comfort.",
    heightTier: "arch-md",
    tag: "Quilted Jacket",
  },
  {
    id: 103,
    title: "Petit Prince Double-Breasted Velvet Tailored Blazer",
    price: 230,
    originalPrice: 275,
    rating: 5.0,
    reviews: 312,
    badge: "Signature Couture",
    image: "/images/kids_arch3.jpg",
    fabric: "Italian Silk-Velvet with Satin Peaked Lapels & Silk Lining",
    silhouette: "Impeccably Tailored Mini Tuxedo Blazer with Crest Buttons",
    care: "Specialist Eco Dry Clean Only",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-12Y"],
    tagline: "Lustrous hunter green silk velvet adorned with handcrafted crested heraldic gold buttons.",
    heightTier: "arch-lg",
    isHero: true,
    tag: "Signature Look",
  },
  {
    id: 104,
    title: "Organic Oatmeal Cashmere-Blend Cardigan & Linen Set",
    price: 160,
    originalPrice: 190,
    rating: 4.9,
    reviews: 156,
    badge: "Cloud Comfort",
    image: "/images/kids_arch4.jpg",
    fabric: "70% Organic Pima Cotton, 30% Grade-A Mongolian Cashmere",
    silhouette: "Relaxed Dropped-Shoulder Cardigan with Mother-of-Pearl Buttons",
    care: "Gentle Cold Hand Wash • Lay Flat to Dry",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-12Y"],
    tagline: "Whisper-soft breathable knit offering temperature-regulating luxury for play and formal celebrations.",
    heightTier: "arch-md",
    tag: "Cashmere Knit",
  },
  {
    id: 105,
    title: "Mayfair Classic Wool Duffle Coat with Horn Toggles",
    price: 210,
    originalPrice: 250,
    rating: 4.8,
    reviews: 89,
    badge: "Winter Luxe",
    image: "/images/kids_arch5.jpg",
    fabric: "Double-Faced Melton Wool with Windproof Storm Shield",
    silhouette: "Hooded Mid-Length Traditional Duffle Silhouette",
    care: "Dry Clean Only",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-12Y"],
    tagline: "Authentic British heritage wool outerwear equipped with genuine polished buffalo horn toggles.",
    heightTier: "arch-sm",
    tag: "Melton Wool",
  },
];

function KidsFashionView({ onAddToCart, onBackToNormal }) {
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
  const customConfig = useStorefrontStore((state) => state.config.kids);

  const looks = KIDS_LOOKS.map((item, idx) => {
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
      prev === 0 ? KIDS_LOOKS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveModelIndex((prev) =>
      prev === KIDS_LOOKS.length - 1 ? 0 : prev + 1
    );
  };

  const toggleLike = (id) => {
    setLikedLooks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSizeSelect = (lookId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [lookId]: size }));
  };

  const handleScrollToDetail = () => {
    const el = document.getElementById("kids-look-spotlight");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="kids-fashion-wrapper animate-fadeIn">
      {/* ========================================================
          1. KIDS HERO SECTION (REGAL HUNTER GREEN CANVAS WITH 5 ARCHES)
      ======================================================== */}
      <section className="kids-hero-canvas">
        <div className="kids-hero-inner">
          {/* Top Pill / Tag */}
          <div className="kids-hero-tag-pill">
            <span className="kids-tag-dot" />
            <span className="kids-tag-text">{customConfig?.tagPill || "NEW KIDS ATELIER COLLECTION • 2026"}</span>
            <span className="kids-tag-dot" />
          </div>

          {/* Video Replica Headline in Hunter Green Luxury Style */}
          <h1 className="kids-hero-headline">
            {customConfig?.headline || (
              <>Where young charm meets innovative ways of <br className="hidden-mobile" /> meeting new fashion</>
            )}
          </h1>

          <p className="kids-hero-description">
            {customConfig?.description || "Experience curated junior luxury defined by royal hunter green hues, hypoallergenic cashmere waffle knits, and bespoke British tailoring engineered for little pioneers."}
          </p>

          {/* Action CTAs */}
          <div className="kids-cta-bar">
            <button
              type="button"
              onClick={handleScrollToDetail}
              className="btn-kids-collection"
            >
              <span>{customConfig?.primaryCtaText || "New Junior Collection"}</span>
              <span className="btn-kids-circle-dot" />
            </button>

            <button
              type="button"
              onClick={onBackToNormal}
              className="btn-kids-ghost"
              title="Return to standard shop"
            >
              <span>{customConfig?.secondaryCtaText || "Back to All Gear"}</span>
            </button>
          </div>

          {/* 5 ARCHED WINDOWS GALLERY */}
          <div className="kids-stage-container">
            <div className="kids-arch-gallery" role="region" aria-label="Kids Fashion Lookbook">
              {looks.map((model, idx) => {
                const isSelected = idx === activeModelIndex;
                return (
                  <div
                    key={model.id}
                    onClick={() => setActiveModelIndex(idx)}
                    className={`kids-arch-card ${model.heightTier} ${
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
                      <div className="arch-overlay-gradient kids-arch-overlay" />
                    </div>

                    <div className="arch-card-caption">
                      <span className="arch-pill-badge kids-pill-badge">{model.tag}</span>
                      <h4 className="arch-card-title">
                        {model.title.split(" ")[0]} {model.title.split(" ")[1] || ""}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Runway Arrow Navigation */}
            <div className="zevana-nav-arrows kids-nav-arrows">
              <button
                type="button"
                onClick={handlePrev}
                className="zevana-arrow-btn kids-arrow-btn"
                aria-label="Previous look"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="zevana-arrow-btn kids-arrow-btn"
                aria-label="Next look"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. FILMSTRIP TRAY CAROUSEL (BOYS/GIRLS MATCH IN HUNTER GREEN)
      ======================================================== */}
      <div className="zevana-filmstrip-tray kids-filmstrip-tray">
        <div className="filmstrip-inner-grid">
          {looks.map((look, idx) => {
            const isSelected = idx === activeModelIndex;
            const isLiked = likedLooks[look.id];
            return (
              <div
                key={look.id}
                onClick={() => setActiveModelIndex(idx)}
                className={`filmstrip-card kids-filmstrip-card ${isSelected ? "active" : ""}`}
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
          3. ACTIVE LOOK DETAIL SPOTLIGHT
      ======================================================== */}
      <section id="kids-look-spotlight" className="zevana-details-section kids-details-section">
        <div className="container zevana-spotlight-grid">
          <div className="spotlight-left-media">
            <div className="spotlight-frame kids-spotlight-frame">
              <img
                src={activeLook.image}
                alt={activeLook.title}
                className="spotlight-main-img"
              />
              <span className="spotlight-badge kids-spotlight-badge">{activeLook.badge}</span>
            </div>
          </div>

          <div className="spotlight-right-content">
            <span className="spotlight-sub kids-spotlight-sub">
              {customConfig?.spotlightSubtitle || "ROYAL JUNIOR ATELIER • 2026 ARCHIVE"}
            </span>
            <h2 className="spotlight-title">{activeLook.title}</h2>
            <p className="spotlight-tagline">{activeLook.tagline}</p>

            <div className="spotlight-price-row">
              <span className="spotlight-price kids-spotlight-price">₹{activeLook.price}</span>
              <span className="spotlight-orig-price">₹{activeLook.originalPrice}</span>
              <span className="spotlight-tax-tag">{customConfig?.guaranteeText || "VAT Included • Complimentary Global Courier"}</span>
            </div>

            {/* Spec Sheet in English */}
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

            {/* Kid Size Selector */}
            <div className="spotlight-size-section">
              <div className="size-header-row">
                <span className="size-title">Select Junior Size:</span>
                <span className="size-guide-link">Kids Size & Fit Chart</span>
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
                      className={`spotlight-size-btn kids-size-btn ${isChosen ? "chosen" : ""}`}
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
                className="btn-zevana-add btn-kids-add"
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
              <span>✓ Hand-finished in Royal British & Milanese Ateliers</span>
              <span>✓ Certified 100% Hypoallergenic & Chemical-Free</span>
              <span>✓ Free 30-Day Hassle-Free Returns & Size Exchanges</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default KidsFashionView;
