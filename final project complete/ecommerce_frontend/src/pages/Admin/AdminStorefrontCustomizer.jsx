import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Palette,
  Sparkles,
  Check,
  RotateCcw,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Layers,
  Tag,
  Type,
  DollarSign,
  FileText,
  Sliders,
  CheckCircle2,
  Flame,
  Mail,
  Shirt,
  ShieldCheck,
} from "lucide-react";
import { useStorefrontStore, DEFAULT_STOREFRONT_CONFIG } from "../../stores/storefrontStore";
import { handleImageError } from "../../utils/imageUrl";
import "./adminStorefront.css";

const PRESET_GALLERY = [
  { label: "Boys Terracotta Blazer", url: "/images/boys_arch3.jpg" },
  { label: "Boys Utility Overshirt", url: "/images/boys_arch1.jpg" },
  { label: "Boys Waffle Knit Vest", url: "/images/boys_arch2.jpg" },
  { label: "Boys Oatmeal Pullover", url: "/images/boys_arch4.jpg" },
  { label: "Boys Charcoal Overcoat", url: "/images/boys_arch5.jpg" },
  { label: "Girls Velvet Runway Gown", url: "/images/girls_model3.jpg" },
  { label: "Girls Noir High-Neck", url: "/images/girls_model1.jpg" },
  { label: "Girls Midnight Silk", url: "/images/girls_model2.jpg" },
  { label: "Girls Origami Mini Dress", url: "/images/girls_model4.jpg" },
  { label: "Girls Geometric Cutout", url: "/images/girls_model5.jpg" },
  { label: "Kids Heritage Velvet Tuxedo", url: "/images/kids_arch3.jpg" },
  { label: "Kids Cable-Knit Pullover", url: "/images/kids_arch1.jpg" },
  { label: "Kids Quilted Barn Jacket", url: "/images/kids_arch2.jpg" },
  { label: "Kids Cashmere Cardigan", url: "/images/kids_arch4.jpg" },
  { label: "Kids Wool Duffle Coat", url: "/images/kids_arch5.jpg" },
  { label: "Accessories Ice-Blue Watch", url: "/images/acc_arch3.jpg" },
  { label: "Accessories Titanium Optics", url: "/images/acc_arch1.jpg" },
  { label: "Accessories Saffiano Duffel", url: "/images/acc_arch2.jpg" },
  { label: "Accessories Carbon Wallet", url: "/images/acc_arch4.jpg" },
  { label: "Accessories Palladium Belt", url: "/images/acc_arch5.jpg" },
  { label: "Beauty Amber Crystal Perfume", url: "/images/beauty_prod3.jpg" },
  { label: "Beauty Velvet Crimson Lip", url: "/images/beauty_prod1.jpg" },
  { label: "Beauty 24K Cellular Serum", url: "/images/beauty_prod2.jpg" },
  { label: "Beauty Rose Petal Powder", url: "/images/beauty_prod4.jpg" },
  { label: "Beauty Night Repair Cream", url: "/images/beauty_prod5.jpg" },
];

const SECTIONS = [
  { id: "home", label: "Home Page", icon: "🏠", path: "/" },
  { id: "boys", label: "Boys Fashion", icon: "👔", path: "/?cat=boys" },
  { id: "girls", label: "Girls Fashion", icon: "👗", path: "/?cat=girls" },
  { id: "kids", label: "Kids Couture", icon: "🧸", path: "/?cat=kids" },
  { id: "accessories", label: "Accessories", icon: "👓", path: "/?cat=accessories" },
  { id: "beauty", label: "Beauty", icon: "💄", path: "/?cat=beauty" },
];

export default function AdminStorefrontCustomizer() {
  const { config, updateSection, updateLook, resetSection, resetAll } = useStorefrontStore();
  const [activeTab, setActiveTab] = useState("home");
  const [activeLookIndex, setActiveLookIndex] = useState(2); // Centerpiece Look 03 by default
  const [publishedToast, setPublishedToast] = useState("");

  const currentSectionData = config[activeTab] || {};
  const currentLooks =
    currentSectionData.looks && currentSectionData.looks.length > 0
      ? currentSectionData.looks
      : DEFAULT_STOREFRONT_CONFIG[activeTab]?.looks || [];
  const currentSelectedLook = currentLooks[activeLookIndex] || currentLooks[0] || {};

  const handleFieldChange = (field, value) => {
    updateSection(activeTab, { [field]: value });
  };

  const handleLookFieldChange = (field, value) => {
    updateLook(activeTab, activeLookIndex, { [field]: value });
  };

  const handlePublish = () => {
    setPublishedToast(`Published changes to ${SECTIONS.find((s) => s.id === activeTab)?.label}!`);
    setTimeout(() => setPublishedToast(""), 3500);
  };

  const handleResetCurrent = () => {
    if (window.confirm(`Reset ${activeTab.toUpperCase()} to luxury handcrafted defaults?`)) {
      resetSection(activeTab);
      setPublishedToast(`Reset ${activeTab} to default.`);
      setTimeout(() => setPublishedToast(""), 3000);
    }
  };

  const handleResetEverything = () => {
    if (window.confirm("Reset all 6 pages (Home, Boys, Girls, Kids, Accessories, Beauty) to original defaults?")) {
      resetAll();
      setPublishedToast("Reset entire storefront to default.");
      setTimeout(() => setPublishedToast(""), 3000);
    }
  };

  return (
    <div className="admin-storefront-container">
      {/* Toast Feedback */}
      {publishedToast && (
        <div className="modern-toast-notification">
          <Sparkles size={16} />
          <span>{publishedToast}</span>
        </div>
      )}

      {/* Header Strip */}
      <div className="storefront-header-strip">
        <div className="storefront-title-meta">
          <h2>
            <Palette size={22} />
            Storefront Visual CMS & Theme Editor
          </h2>
          <p className="storefront-subtitle">
            Curate hero editorial headlines, promotional banners, centerpiece highlights, and imagery across all 6 collections.
          </p>
        </div>

        <div className="storefront-actions-group">
          <button
            type="button"
            onClick={handleResetCurrent}
            className="btn-cms-reset"
            title="Reset this section to default"
          >
            <RotateCcw size={14} />
            <span>Reset {SECTIONS.find((s) => s.id === activeTab)?.label}</span>
          </button>

          <button
            type="button"
            onClick={handleResetEverything}
            className="btn-cms-reset"
            style={{ color: "#E11D48", borderColor: "#FECDD3" }}
            title="Reset all sections to default"
          >
            <span>Reset All</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            className="btn-cms-publish"
          >
            <Check size={15} />
            <span>Publish Changes</span>
          </button>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="storefront-section-nav" role="tablist">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            role="tab"
            aria-selected={activeTab === sec.id}
            onClick={() => {
              setActiveTab(sec.id);
              setActiveLookIndex(2);
            }}
            className={`storefront-nav-pill-btn ${activeTab === sec.id ? "active" : ""}`}
          >
            <span>{sec.icon}</span>
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {/* Split Grid: Editor Left, Live Preview Right */}
      <div className="storefront-split-grid">
        {/* LEFT COLUMN: EDIT CONTROLS */}
        <div className="storefront-form-card">
          {activeTab === "home" ? (
            /* ========================================================
               HOME PAGE EDIT CONTROLS
            ======================================================== */
            <>
              {/* 1. Curated Collections Carousel Guide */}
              <div className="form-group-block">
                <h4 className="group-block-title">
                  <Sparkles size={13} />
                  Home Hero Carousel (5 Curated Collections)
                </h4>
                <p style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", margin: "0 0 12px", lineHeight: "1.5" }}>
                  The Home page showcase displays the centerpiece highlights from your 5 collections. Click below to customize the titles, prices, descriptions, and imagery shown on the carousel:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
                  {SECTIONS.filter((s) => s.id !== "home").map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(sec.id);
                        setActiveLookIndex(2);
                      }}
                      className="btn-cms-reset"
                      style={{ fontSize: "11.5px", padding: "8px 10px", justifyContent: "center" }}
                    >
                      <span>{sec.icon} {sec.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Optional Announcement Bar */}
              <div className="form-group-block">
                <h4 className="group-block-title">
                  <Tag size={13} />
                  Top Announcement Strip (Optional)
                </h4>
                <div className="cms-field-row" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    id="home-show-announcement"
                    type="checkbox"
                    checked={Boolean(currentSectionData.showAnnouncement)}
                    onChange={(e) => handleFieldChange("showAnnouncement", e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#000000" }}
                  />
                  <label htmlFor="home-show-announcement" style={{ margin: 0, cursor: "pointer", fontWeight: 600 }}>
                    Enable Announcement Strip at top of Home page
                  </label>
                </div>
                {currentSectionData.showAnnouncement && (
                  <div className="cms-field-row" style={{ marginTop: "10px" }}>
                    <label htmlFor="home-announcement">Announcement Message</label>
                    <input
                      id="home-announcement"
                      type="text"
                      value={currentSectionData.announcementText || ""}
                      onChange={(e) => handleFieldChange("announcementText", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. COMPLIMENTARY WHITE-GLOVE COURIER DELIVERY ON ALL ORDERS OVER ₹500"
                    />
                  </div>
                )}
              </div>

              {/* 3. Trending Curated Grid */}
              <div className="form-group-block">
                <h4 className="group-block-title">
                  <Sliders size={13} />
                  Best Sellers / Trending Section
                </h4>
                <div className="cms-fields-grid-2">
                  <div className="cms-field-row">
                    <label htmlFor="home-trending-badge">Section Badge</label>
                    <input
                      id="home-trending-badge"
                      type="text"
                      value={currentSectionData.trendingBadge || ""}
                      onChange={(e) => handleFieldChange("trendingBadge", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. Trending Now"
                    />
                  </div>
                  <div className="cms-field-row">
                    <label htmlFor="home-trending-heading">Section Heading</label>
                    <input
                      id="home-trending-heading"
                      type="text"
                      value={currentSectionData.trendingHeading || ""}
                      onChange={(e) => handleFieldChange("trendingHeading", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. Curated Best Sellers"
                    />
                  </div>
                </div>

                <div className="cms-field-row">
                  <label htmlFor="home-trending-sub">Section Subtitle</label>
                  <textarea
                    id="home-trending-sub"
                    value={currentSectionData.trendingSubtitle || ""}
                    onChange={(e) => handleFieldChange("trendingSubtitle", e.target.value)}
                    className="cms-textarea"
                    placeholder="Subtitle description..."
                  />
                </div>
              </div>

              {/* 4. Flash Sale / Mid-Season Drop Banner */}
              <div className="form-group-block">
                <h4 className="group-block-title">
                  <Flame size={13} />
                  Flash Sale Promo Banner
                </h4>
                <div className="cms-fields-grid-2">
                  <div className="cms-field-row">
                    <label htmlFor="home-flash-badge">Badge Label</label>
                    <input
                      id="home-flash-badge"
                      type="text"
                      value={currentSectionData.flashBadge || ""}
                      onChange={(e) => handleFieldChange("flashBadge", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. LIMITED TIME DROP"
                    />
                  </div>
                  <div className="cms-field-row">
                    <label htmlFor="home-flash-discount">Discount Tag</label>
                    <input
                      id="home-flash-discount"
                      type="text"
                      value={currentSectionData.flashDiscountTag || ""}
                      onChange={(e) => handleFieldChange("flashDiscountTag", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. 30% OFF TODAY"
                    />
                  </div>
                </div>

                <div className="cms-field-row">
                  <label htmlFor="home-flash-title">Banner Headline</label>
                  <input
                    id="home-flash-title"
                    type="text"
                    value={currentSectionData.flashTitle || ""}
                    onChange={(e) => handleFieldChange("flashTitle", e.target.value)}
                    className="cms-text-input"
                    placeholder="Mid-Season Atelier Drop: Save Up To 30%..."
                  />
                </div>

                <div className="cms-field-row">
                  <label htmlFor="home-flash-desc">Banner Description</label>
                  <textarea
                    id="home-flash-desc"
                    value={currentSectionData.flashDescription || ""}
                    onChange={(e) => handleFieldChange("flashDescription", e.target.value)}
                    className="cms-textarea"
                    placeholder="Promotional banner description..."
                  />
                </div>

                <div className="cms-field-row">
                  <label htmlFor="home-flash-cta">CTA Button Label</label>
                  <input
                    id="home-flash-cta"
                    type="text"
                    value={currentSectionData.flashCtaText || ""}
                    onChange={(e) => handleFieldChange("flashCtaText", e.target.value)}
                    className="cms-text-input"
                    placeholder="e.g. Claim Your Discount Now"
                  />
                </div>
              </div>

              {/* 5. VIP Club Newsletter Section */}
              <div className="form-group-block">
                <h4 className="group-block-title">
                  <Mail size={13} />
                  VIP Club Newsletter Banner
                </h4>
                <div className="cms-fields-grid-2">
                  <div className="cms-field-row">
                    <label htmlFor="home-vip-badge">Pill Kicker</label>
                    <input
                      id="home-vip-badge"
                      type="text"
                      value={currentSectionData.vipBadge || ""}
                      onChange={(e) => handleFieldChange("vipBadge", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. VIP CLUB ACCESS"
                    />
                  </div>
                  <div className="cms-field-row">
                    <label htmlFor="home-vip-btn">Button Label</label>
                    <input
                      id="home-vip-btn"
                      type="text"
                      value={currentSectionData.vipButtonText || ""}
                      onChange={(e) => handleFieldChange("vipButtonText", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. Join & Get 15% OFF"
                    />
                  </div>
                </div>

                <div className="cms-field-row">
                  <label htmlFor="home-vip-title">Card Title</label>
                  <input
                    id="home-vip-title"
                    type="text"
                    value={currentSectionData.vipTitle || ""}
                    onChange={(e) => handleFieldChange("vipTitle", e.target.value)}
                    className="cms-text-input"
                    placeholder="e.g. Unlock 15% Off Your Next Order"
                  />
                </div>

                <div className="cms-field-row">
                  <label htmlFor="home-vip-sub">Card Subtitle</label>
                  <textarea
                    id="home-vip-sub"
                    value={currentSectionData.vipSubtitle || ""}
                    onChange={(e) => handleFieldChange("vipSubtitle", e.target.value)}
                    className="cms-textarea"
                    placeholder="VIP club perks description..."
                  />
                </div>
              </div>
            </>
          ) : (
            /* ========================================================
               CATEGORY VIEWS (BOYS, GIRLS, KIDS, ACCESSORIES, BEAUTY)
            ======================================================== */
            <>
              {/* 1. Category Runway Header */}
              <div className="form-group-block">
                <h4 className="group-block-title">
                  <Type size={13} />
                  1. Runway Header & Hero Stage
                </h4>
                <div className="cms-field-row">
                  <label htmlFor="cat-tag-pill">Top Pill / Kicker Tag</label>
                  <input
                    id="cat-tag-pill"
                    type="text"
                    value={currentSectionData.tagPill || ""}
                    onChange={(e) => handleFieldChange("tagPill", e.target.value)}
                    className="cms-text-input"
                    placeholder="e.g. NEW BOYS COLLECTION • 2026"
                  />
                </div>

                <div className="cms-field-row">
                  <label htmlFor="cat-headline">Runway Headline</label>
                  <input
                    id="cat-headline"
                    type="text"
                    value={currentSectionData.headline || ""}
                    onChange={(e) => handleFieldChange("headline", e.target.value)}
                    className="cms-text-input"
                    placeholder="Runway headline..."
                  />
                </div>

                <div className="cms-field-row">
                  <label htmlFor="cat-description">Curated Runway Description</label>
                  <textarea
                    id="cat-description"
                    value={currentSectionData.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    className="cms-textarea"
                    placeholder="Category description..."
                  />
                </div>

                <div className="cms-fields-grid-2">
                  <div className="cms-field-row">
                    <label htmlFor="cat-cta-primary">Primary Button Label</label>
                    <input
                      id="cat-cta-primary"
                      type="text"
                      value={currentSectionData.primaryCtaText || ""}
                      onChange={(e) => handleFieldChange("primaryCtaText", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. New Collection"
                    />
                  </div>
                  <div className="cms-field-row">
                    <label htmlFor="cat-cta-secondary">Secondary Button Label</label>
                    <input
                      id="cat-cta-secondary"
                      type="text"
                      value={currentSectionData.secondaryCtaText || ""}
                      onChange={(e) => handleFieldChange("secondaryCtaText", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. Back to All Gear"
                    />
                  </div>
                </div>
              </div>

              {/* 2. All 5 Runway Looks Selector & Editor */}
              <div className="form-group-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 className="group-block-title" style={{ margin: 0 }}>
                    <Shirt size={13} />
                    2. Curate 5 Runway Looks & Centerpiece
                  </h4>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#10B981" }}>
                    Editing Look {String(activeLookIndex + 1).padStart(2, "0")} {activeLookIndex === 2 ? "★ Centerpiece" : ""}
                  </span>
                </div>

                {/* Look Selector Pill Bar */}
                <div className="cms-looks-pill-row">
                  {currentLooks.map((look, lIdx) => (
                    <button
                      key={lIdx}
                      type="button"
                      onClick={() => setActiveLookIndex(lIdx)}
                      className={`cms-look-pill-btn ${activeLookIndex === lIdx ? "active" : ""}`}
                    >
                      {activeLookIndex === lIdx && <span className="cms-look-pill-dot" />}
                      <span>Look 0{lIdx + 1}</span>
                      {lIdx === 2 && <span style={{ opacity: 0.8, fontSize: "10px" }}>(Centerpiece)</span>}
                    </button>
                  ))}
                </div>

                {/* Active Look Fields */}
                <div className="cms-fields-grid-2">
                  <div className="cms-field-row">
                    <label htmlFor="look-title">Look Title / Name</label>
                    <input
                      id="look-title"
                      type="text"
                      value={currentSelectedLook.title || ""}
                      onChange={(e) => handleLookFieldChange("title", e.target.value)}
                      className="cms-text-input"
                      placeholder="Look title..."
                    />
                  </div>

                  <div className="cms-field-row">
                    <label htmlFor="look-price">Price (₹)</label>
                    <input
                      id="look-price"
                      type="text"
                      value={currentSelectedLook.price !== undefined ? currentSelectedLook.price : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        handleLookFieldChange("price", raw ? Number(raw) : "");
                      }}
                      className="cms-text-input"
                      placeholder="e.g. 350"
                    />
                  </div>
                </div>

                <div className="cms-fields-grid-2">
                  <div className="cms-field-row">
                    <label htmlFor="look-orig-price">Original / Strikethrough Price (₹)</label>
                    <input
                      id="look-orig-price"
                      type="text"
                      value={currentSelectedLook.originalPrice !== undefined ? currentSelectedLook.originalPrice : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        handleLookFieldChange("originalPrice", raw ? Number(raw) : "");
                      }}
                      className="cms-text-input"
                      placeholder="e.g. 260"
                    />
                  </div>

                  <div className="cms-field-row">
                    <label htmlFor="look-badge">Badge / Tag Pill</label>
                    <input
                      id="look-badge"
                      type="text"
                      value={currentSelectedLook.badge || ""}
                      onChange={(e) => {
                        handleLookFieldChange("badge", e.target.value);
                        handleLookFieldChange("tag", e.target.value);
                      }}
                      className="cms-text-input"
                      placeholder="e.g. Signature Look"
                    />
                  </div>
                </div>

                <div className="cms-field-row">
                  <label htmlFor="look-image-url">Look Image URL</label>
                  <input
                    id="look-image-url"
                    type="text"
                    value={currentSelectedLook.image || ""}
                    onChange={(e) => handleLookFieldChange("image", e.target.value)}
                    className="cms-text-input"
                    placeholder="/images/boys_arch3.jpg or https://..."
                  />
                </div>

                {/* Image Presets Picker */}
                <div className="cms-field-row">
                  <label>Quick Preset Images</label>
                  <div className="cms-preset-gallery">
                    {PRESET_GALLERY.filter((p) =>
                      activeTab === "boys"
                        ? p.url.includes("boys")
                        : activeTab === "girls"
                        ? p.url.includes("girls")
                        : activeTab === "kids"
                        ? p.url.includes("kids")
                        : activeTab === "accessories"
                        ? p.url.includes("acc")
                        : p.url.includes("beauty")
                    ).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLookFieldChange("image", preset.url)}
                        className={`btn-preset-img ${currentSelectedLook.image === preset.url ? "selected" : ""}`}
                        title={preset.label}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          onError={(e) => handleImageError(e)}
                          className="preset-thumb"
                        />
                        <span>{preset.label.split(" ").slice(1).join(" ")}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cms-field-row">
                  <label htmlFor="look-tagline">Editorial Tagline</label>
                  <textarea
                    id="look-tagline"
                    value={currentSelectedLook.tagline || ""}
                    onChange={(e) => handleLookFieldChange("tagline", e.target.value)}
                    className="cms-textarea"
                    placeholder="Tagline or short architectural summary..."
                  />
                </div>

                <div className="cms-fields-grid-2">
                  <div className="cms-field-row">
                    <label htmlFor="look-fabric">Fabric / Formula</label>
                    <input
                      id="look-fabric"
                      type="text"
                      value={currentSelectedLook.fabric || ""}
                      onChange={(e) => handleLookFieldChange("fabric", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. Italian Wool-Silk Blend"
                    />
                  </div>

                  <div className="cms-field-row">
                    <label htmlFor="look-silhouette">Silhouette / Finish</label>
                    <input
                      id="look-silhouette"
                      type="text"
                      value={currentSelectedLook.silhouette || ""}
                      onChange={(e) => handleLookFieldChange("silhouette", e.target.value)}
                      className="cms-text-input"
                      placeholder="e.g. Deconstructed Single-Breasted"
                    />
                  </div>
                </div>

                <div className="cms-field-row">
                  <label htmlFor="look-care">Care Instructions</label>
                  <input
                    id="look-care"
                    type="text"
                    value={currentSelectedLook.care || ""}
                    onChange={(e) => handleLookFieldChange("care", e.target.value)}
                    className="cms-text-input"
                    placeholder="e.g. Dry Clean Specialist Only"
                  />
                </div>
              </div>

              {/* 3. Spotlight Archive & Guarantees */}
              <div className="form-group-block">
                <h4 className="group-block-title">
                  <ShieldCheck size={13} />
                  3. Spotlight Archive & Guarantee Info
                </h4>
                <div className="cms-field-row">
                  <label htmlFor="cat-spotlight-sub">Spotlight Archive Subtitle</label>
                  <input
                    id="cat-spotlight-sub"
                    type="text"
                    value={currentSectionData.spotlightSubtitle || ""}
                    onChange={(e) => handleFieldChange("spotlightSubtitle", e.target.value)}
                    className="cms-text-input"
                    placeholder="e.g. AURA MENSWEAR ATELIER • 2026 ARCHIVE"
                  />
                </div>

                <div className="cms-field-row">
                  <label htmlFor="cat-guarantee">Tax & Guarantee Notice</label>
                  <input
                    id="cat-guarantee"
                    type="text"
                    value={currentSectionData.guaranteeText || ""}
                    onChange={(e) => handleFieldChange("guaranteeText", e.target.value)}
                    className="cms-text-input"
                    placeholder="e.g. VAT Included • Complimentary Global Courier"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW */}
        <div className="storefront-preview-card">
          <div className="preview-header-row">
            <span className="preview-indicator-badge">
              <span className="live-pulse-dot" />
              Live Interactive Preview
            </span>
            <Link
              to={activeTab === "home" ? "/" : `/?cat=${activeTab}&look=${activeLookIndex}`}
              target="_blank"
              className="btn-cms-reset"
              style={{ padding: "4px 10px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              title={`Open ${SECTIONS.find((s) => s.id === activeTab)?.label} in new tab`}
            >
              <span>View Live {SECTIONS.find((s) => s.id === activeTab)?.label}</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="preview-mockup-frame">
            {activeTab === "home" ? (
              /* ========================================================
                 HOME PREVIEW MOCKUP
              ======================================================== */
              <>
                {currentSectionData.showAnnouncement && currentSectionData.announcementText && (
                  <div
                    style={{
                      background: "#000000",
                      color: "#FFFFFF",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      marginBottom: "14px",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <span>✦</span>
                    <span>{currentSectionData.announcementText}</span>
                    <span>✦</span>
                  </div>
                )}

                {/* Hero Carousel Preview */}
                <div style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "16px", padding: "16px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span className="preview-hero-kicker-pill" style={{ margin: 0 }}>
                      HOME HERO SHOWCASE
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748B" }}>01 / 05</span>
                  </div>
                  <h3 className="preview-headline" style={{ fontSize: "18px", margin: "6px 0" }}>
                    {config?.boys?.looks?.[2]?.title || "Tailored Terracotta Clay Blazer"}
                  </h3>
                  <p className="preview-subline" style={{ fontSize: "12px", margin: 0 }}>
                    {config?.boys?.looks?.[2]?.tagline || "Curated luxury menswear and architectural couture."}
                  </p>
                  <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ background: "#000000", color: "#FFFFFF", padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>
                      Add to Bag · ₹{config?.boys?.looks?.[2]?.price || 220}
                    </span>
                  </div>
                </div>

                {/* Best Sellers Section Preview */}
                <div style={{ padding: "14px", background: "rgba(0,0,0,0.03)", borderRadius: "14px", marginBottom: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "#10B981", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    {currentSectionData.trendingBadge || "Trending Now"}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
                    {currentSectionData.trendingHeading || "Curated Best Sellers"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#6B7280", lineHeight: "1.4" }}>
                    {currentSectionData.trendingSubtitle || "Hand-picked essentials crafted with bespoke tailoring..."}
                  </div>
                </div>

                {/* Flash Sale Banner Preview */}
                <div style={{ padding: "14px", background: "#111111", color: "#FFFFFF", borderRadius: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#F59E0B", letterSpacing: "0.08em" }}>
                      ⚡ {currentSectionData.flashBadge || "LIMITED TIME DROP"}
                    </span>
                    <span style={{ background: "#F59E0B", color: "#000000", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800 }}>
                      {currentSectionData.flashDiscountTag || "30% OFF"}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "4px" }}>
                    {currentSectionData.flashTitle || "Mid-Season Atelier Drop"}
                  </div>
                  <div style={{ fontSize: "11px", opacity: 0.8, lineHeight: "1.4" }}>
                    {currentSectionData.flashDescription || "Elevate your look with handcrafted Swiss chronometers..."}
                  </div>
                </div>
              </>
            ) : (
              /* ========================================================
                 CATEGORY VIEW PREVIEW MOCKUP
              ======================================================== */
              <>
                <div className="preview-hero-kicker-pill">
                  {currentSectionData.tagPill || "NEW ARRIVAL • 2026"}
                </div>
                <h3 className="preview-headline">
                  {currentSectionData.headline || "Curated Fashion Lookbook"}
                </h3>
                <p className="preview-subline">
                  {currentSectionData.description || "Architectural silhouettes engineered for elegance."}
                </p>

                {/* 5 Arche Mini Strip */}
                <div className="preview-arche-strip">
                  {currentLooks.map((look, lIdx) => (
                    <div
                      key={lIdx}
                      onClick={() => setActiveLookIndex(lIdx)}
                      className={`preview-arche-card ${activeLookIndex === lIdx ? "active" : ""}`}
                    >
                      <img
                        src={look.image}
                        alt={look.title}
                        onError={(e) => handleImageError(e)}
                        className="preview-arche-thumb"
                      />
                      <span className="preview-arche-label">0{lIdx + 1}</span>
                    </div>
                  ))}
                </div>

                {/* Spotlight Detail Card */}
                <div className="preview-centerpiece-media" style={{ marginTop: "12px" }}>
                  <img
                    src={currentSelectedLook.image}
                    alt={currentSelectedLook.title}
                    onError={(e) => handleImageError(e)}
                    className="preview-product-img"
                  />
                  <div className="preview-centerpiece-meta">
                    <span className="preview-centerpiece-badge">
                      {currentSelectedLook.badge || "Signature"}
                    </span>
                    <h4 className="preview-centerpiece-title">
                      {currentSelectedLook.title || "Look Name"}
                    </h4>
                    <div className="preview-price-tag">
                      <span className="preview-price">₹{currentSelectedLook.price}</span>
                      {currentSelectedLook.originalPrice && (
                        <span style={{ textDecoration: "line-through", color: "#9CA3AF", fontSize: "12px", marginLeft: "6px" }}>
                          ₹{currentSelectedLook.originalPrice}
                        </span>
                      )}
                    </div>
                    <p className="preview-centerpiece-desc">
                      {currentSelectedLook.tagline || currentSelectedLook.fabric || "Curated runway look."}
                    </p>
                    <div style={{ fontSize: "10.5px", color: "#64748B", marginTop: "6px" }}>
                      <strong>Fabric:</strong> {currentSelectedLook.fabric || "Atelier Special"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
