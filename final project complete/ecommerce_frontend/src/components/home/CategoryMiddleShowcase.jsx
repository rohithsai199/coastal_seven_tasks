import React, { useState, useEffect, useRef, useCallback } from "react";
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { handleImageError } from "../../utils/imageUrl";
import { useCategoryStore } from "../../stores/categoryStore";
import { useStorefrontStore } from "../../stores/storefrontStore";
import "./CategoryMiddleShowcase.css";

// The single middle product (3rd of 5) from each category in exact sequence
const CATEGORY_MIDDLE_PRODUCTS = [
  {
    id: "boys-middle",
    indexNum: "01",
    categoryId: "boys",
    categoryName: "Boys",
    collectionName: "Atelier Tailoring",
    headline: "Tailored Terracotta Clay Blazer",
    badgeText: "Boys Centerpiece",
    price: "₹220.00",
    rawPrice: 220,
    productId: 3,
    image: "/images/boys_arch3.jpg",
    accentBg: "linear-gradient(135deg, #eef4f1 0%, #f7faf8 45%, #ffffff 100%)",
    description:
      "Crafted with architectural precision from an Italian wool-silk blend draped in warm terracotta earth pigment dye. Featuring natural roll notched lapels, deconstructed single-breasted silhouette, and silky cupro lining for timeless comfort and sartorial elegance.",
    highlights: ["Italian Wool-Silk Blend", "Earth Pigment Dye", "Cupro Breathable Lining"],
  },
  {
    id: "girls-middle",
    indexNum: "02",
    categoryId: "girls",
    categoryName: "Girls",
    collectionName: "Runway Couture",
    headline: "Siren Slit Velvet Runway Gown",
    badgeText: "Girls Centerpiece",
    price: "₹220.00",
    rawPrice: 220,
    productId: 8,
    image: "/images/girls_model3.jpg",
    accentBg: "linear-gradient(135deg, #f7f1f3 0%, #fbf7f8 45%, #ffffff 100%)",
    description:
      "A dramatic silhouette of high glamour sculpted in midnight crushed silk velvet. Featuring an iconic off-shoulder neckline, handcrafted interior boning corset, and a cascading sweep train engineered for unforgettable evening majesty.",
    highlights: ["Crushed Silk Velvet", "Handcrafted Corset", "Cascading Sweep Train"],
  },
  {
    id: "kids-middle",
    indexNum: "03",
    categoryId: "kids",
    categoryName: "Kids",
    collectionName: "Heritage Tailoring",
    headline: "Petit Prince Velvet Tailored Blazer",
    badgeText: "Kids Centerpiece",
    price: "₹230.00",
    rawPrice: 230,
    productId: 13,
    image: "/images/kids_arch3.jpg",
    accentBg: "linear-gradient(135deg, #f2f5f1 0%, #f9fbf8 45%, #ffffff 100%)",
    description:
      "Rich hunter green Italian silk-velvet tailored into an exquisite double-breasted mini tuxedo. Adorned with handcrafted crested heraldic gold buttons, pure satin peaked lapels, and hypoallergenic silk lining for supreme royal comfort.",
    highlights: ["Italian Silk-Velvet", "Crested Heraldic Gold Buttons", "Pure Satin Peaked Lapels"],
  },
  {
    id: "accessories-middle",
    indexNum: "04",
    categoryId: "accessories",
    categoryName: "Accessories",
    collectionName: "Haute Horlogerie",
    headline: "Aura Chronometer Royal Timepiece",
    badgeText: "Accessories Centerpiece",
    price: "₹680.00",
    rawPrice: 680,
    productId: 18,
    image: "/images/acc_arch3.jpg",
    accentBg: "linear-gradient(135deg, #edf4f8 0%, #f6fafe 45%, #ffffff 100%)",
    description:
      "A masterpiece of Swiss precision horology featuring an iconic octagonal bezel with micro-tapisserie ice-blue sunburst dial. Forged from 316L surgical stainless steel with sapphire crystal and exhibition automatic movement.",
    highlights: ["316L Surgical Steel", "Ice-Blue Sunburst Dial", "Swiss Automatic Movement"],
  },
  {
    id: "beauty-middle",
    indexNum: "05",
    categoryId: "beauty",
    categoryName: "Beauty",
    collectionName: "Haute Parfumerie",
    headline: "Amber Glow Luxury Crystal Perfume",
    badgeText: "Beauty Centerpiece",
    price: "₹240.00",
    rawPrice: 240,
    productId: 23,
    image: "/images/beauty_prod3.jpg",
    accentBg: "linear-gradient(135deg, #fdf5ec 0%, #fbf8f3 45%, #ffffff 100%)",
    description:
      "An opulent sensory composition housed in a faceted octagonal crystal bottle crowned with hand-engraved filigree gold. Opening with rare Bulgarian Damask rose, warm sensual amber, and luminous white camellia nectar.",
    highlights: ["Rare Bulgarian Rose", "Golden Sensual Amber", "Pure Perfume Extract"],
  },
];

export default function CategoryMiddleShowcase({ onAddToCart }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const setActiveCategory = useCategoryStore((state) => state.setActiveCategory);
  const config = useStorefrontStore((state) => state.config);
  const timerRef = useRef(null);

  const products = CATEGORY_MIDDLE_PRODUCTS.map((prod) => {
    const custom = config[prod.categoryId];
    if (!custom) return prod;
    const customLook = custom.looks?.[2];
    return {
      ...prod,
      collectionName: custom.collectionName || prod.collectionName,
      headline: customLook?.title || custom.centerpieceTitle || prod.headline,
      badgeText: customLook?.badge || custom.centerpieceBadge || prod.badgeText,
      price: customLook?.price
        ? (typeof customLook.price === "number" ? `₹${customLook.price}.00` : customLook.price)
        : (custom.centerpiecePrice || prod.price),
      rawPrice: customLook?.price || custom.centerpieceRawPrice || prod.rawPrice,
      image: customLook?.image || custom.centerpieceImage || prod.image,
      description: customLook?.tagline || custom.centerpieceDescription || prod.description,
      highlights:
        custom.highlights && custom.highlights.length > 0
          ? custom.highlights
          : prod.highlights,
    };
  });

  const totalSlides = products.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
  };

  // Auto-scroll every 2 seconds (2000ms)
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentProduct = products[currentIndex] || products[0];

  return (
    <section
      className="hero-reference-carousel-wrapper"
      aria-label="Featured Category Middle Products Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="hero-reference-card"
        style={{ background: currentProduct.accentBg }}
      >
        {/* Top Floating Category Pill Switcher (Inspired by Investors/Borrowers in Reference) */}
        <div className="hero-top-switcher-row">
          <div className="hero-category-pills">
            {products.map((prod, idx) => (
              <button
                key={prod.id}
                type="button"
                className={`hero-cat-pill-btn ${idx === currentIndex ? "active" : ""}`}
                onClick={() => goToSlide(idx)}
              >
                <span>{prod.categoryName}</span>
                {idx === currentIndex && (
                  <span
                    key={`progress-${currentIndex}`}
                    className={`hero-cat-progress-fill ${isPaused ? "paused" : ""}`}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="hero-slide-counter-badge">
            <span>{currentProduct.indexNum}</span>
            <span className="counter-sep">/</span>
            <span>05</span>
          </div>
        </div>

        {/* Horizontal Slider Track */}
        <div className="hero-carousel-viewport">
          <div
            className="hero-carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {products.map((item, idx) => (
              <div
                key={item.id}
                className="hero-carousel-slide"
                aria-hidden={idx !== currentIndex}
              >
                {/* Left Column: Bold Editorial Typography & Actions */}
                <div className="hero-slide-content">
                  <div className="hero-collection-tag-row">
                    <span className="hero-collection-tag">
                      <Sparkles size={13} className="hero-tag-icon" />
                      {item.collectionName}
                    </span>
                    <span className="hero-tag-divider">•</span>
                    <span className="hero-badge-light">{item.badgeText}</span>
                  </div>

                  <h1 className="hero-slide-headline">
                    {item.headline}
                  </h1>

                  <p className="hero-slide-description">
                    {item.description}
                  </p>

                  {/* Highlights Bar */}
                  <div className="hero-highlights-row">
                    {item.highlights.map((h, hIdx) => (
                      <span key={hIdx} className="hero-highlight-pill">
                        ✓ {h}
                      </span>
                    ))}
                  </div>

                  {/* Dual Pill Action Buttons (Matching Reference INTRA Style) */}
                  <div className="hero-actions-group">
                    <button
                      type="button"
                      className="btn-hero-dark-pill"
                      onClick={() =>
                        onAddToCart({
                          id: item.productId,
                          name: item.headline,
                          price: item.rawPrice,
                          image_url: item.image,
                        })
                      }
                    >
                      <ShoppingBag size={17} />
                      <span>Add to Bag</span>
                      <span className="hero-pill-price-sep">|</span>
                      <span className="hero-pill-price">{item.price}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-hero-light-pill"
                      onClick={() => handleCategoryClick(item.categoryId)}
                    >
                      <span>Explore {item.categoryName}</span>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>

                {/* Right Column: Clean Luxury Product Photo Showcase */}
                <div className="hero-slide-visual-col">
                  <div
                    className="hero-image-frame"
                    onClick={() => handleCategoryClick(item.categoryId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleCategoryClick(item.categoryId);
                    }}
                  >
                    <img
                      src={item.image}
                      alt={`${item.categoryName} - ${item.headline}`}
                      onError={(e) => handleImageError(e)}
                      className="hero-product-img"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />

                    {/* Subtle Overlay Badge on Image */}
                    <div className="hero-img-glass-badge">
                      <span className="glass-badge-dot" />
                      <span>{item.categoryName} Atelier</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Floating Navigation Controls */}
        <div className="hero-bottom-controls-bar">
          {/* Dot Indicators */}
          <div className="hero-dot-indicators" role="tablist">
            {products.map((prod, idx) => (
              <button
                key={prod.id}
                type="button"
                role="tab"
                aria-selected={idx === currentIndex}
                aria-label={`Go to slide ${idx + 1}: ${prod.categoryName}`}
                className={`hero-dot ${idx === currentIndex ? "active" : ""}`}
                onClick={() => goToSlide(idx)}
              />
            ))}
          </div>

          {/* Prev / Next Arrows */}
          <div className="hero-arrow-btns">
            <button
              type="button"
              className="hero-nav-arrow-btn"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="hero-nav-arrow-btn"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
