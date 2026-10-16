import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Plus,
  Sparkles,
  UploadCloud,
  X,
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Eye,
} from "lucide-react";
import { getProductImageUrl, handleImageError } from "../../utils/imageUrl";
import { generateProductDescription } from "../../services/aiService";
import "./adminProducts.css";

function AdminProductManagement({
  products = [],
  form,
  setForm,
  editingId,
  setEditingId,
  saveMutation,
  deleteMutation,
  handleSubmit,
  handleEdit,
  handleCancelEdit,
  handleDelete,
  handleImageChange,
  handleRemoveImage,
  productFileInputRef,
  EMPTY_FORM,
}) {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [aiGenerating, setAiGenerating] = useState(false);

  const editorRef = useRef(null);

  // 1. Executive Catalog KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = products.length;
    const totalValuation = products.reduce(
      (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
      0
    );
    const totalUnits = products.reduce(
      (sum, p) => sum + Number(p.stock || 0),
      0
    );
    const lowStockCount = products.filter(
      (p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 15
    ).length;
    const outOfStockCount = products.filter(
      (p) => Number(p.stock || 0) === 0
    ).length;
    const avgPrice =
      totalCount > 0
        ? products.reduce((sum, p) => sum + Number(p.price || 0), 0) /
          totalCount
        : 0;

    return {
      totalCount,
      totalValuation,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      avgPrice,
    };
  }, [products]);

  // 2. Status Counts for Filters
  const filterCounts = useMemo(() => {
    return {
      ALL: products.length,
      IN_STOCK: products.filter((p) => Number(p.stock || 0) > 15).length,
      LOW_STOCK: products.filter(
        (p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 15
      ).length,
      OUT_OF_STOCK: products.filter((p) => Number(p.stock || 0) === 0).length,
    };
  }, [products]);

  // 3. Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const stock = Number(product.stock || 0);

        if (selectedFilter === "IN_STOCK" && stock <= 15) return false;
        if (selectedFilter === "LOW_STOCK" && (stock === 0 || stock > 15)) {
          return false;
        }
        if (selectedFilter === "OUT_OF_STOCK" && stock > 0) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();

        const matchId = String(product.id).includes(q);
        const matchName = product.name?.toLowerCase().includes(q);
        const matchDesc = product.description?.toLowerCase().includes(q);
        const matchPrice = String(product.price).includes(q);

        return matchId || matchName || matchDesc || matchPrice;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return Number(b.id) - Number(a.id);
        if (sortBy === "oldest") return Number(a.id) - Number(b.id);
        if (sortBy === "name_asc") {
          return (a.name || "").localeCompare(b.name || "");
        }
        if (sortBy === "price_high") {
          return Number(b.price || 0) - Number(a.price || 0);
        }
        if (sortBy === "price_low") {
          return Number(a.price || 0) - Number(b.price || 0);
        }
        if (sortBy === "stock_high") {
          return Number(b.stock || 0) - Number(a.stock || 0);
        }
        if (sortBy === "stock_low") {
          return Number(a.stock || 0) - Number(b.stock || 0);
        }
        return 0;
      });
  }, [products, selectedFilter, searchQuery, sortBy]);

  // Open editor and scroll smoothly
  const handleOpenCreate = () => {
    handleCancelEdit();
    setShowEditor(true);
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleEditInternal = (product) => {
    handleEdit(product);
    setShowEditor(true);
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // AI Description Generator
  const handleGenerateAiDescription = async () => {
    if (!form.name || form.name.trim().length < 2) {
      alert("Please enter a product name first so AI can craft a luxury description.");
      return;
    }
    setAiGenerating(true);
    try {
      const result = await generateProductDescription({
        name: form.name.trim(),
        category: "Haute Fashion & Luxury Goods",
        tone: "persuasive",
      });

      const bullets = result.bullet_points?.length
        ? "\n\nHighlights:\n" +
          result.bullet_points.map((b) => `• ${b}`).join("\n")
        : "";
      const combined =
        `${result.short_hook}\n\n${result.long_description}${bullets}`.trim();

      setForm((prev) => ({
        ...prev,
        description: combined,
      }));
    } catch (err) {
      console.error("AI description error:", err);
      alert("Could not generate description. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  // Infer Category Name from Product Name/Desc
  const inferCategory = (name = "", desc = "") => {
    const text = (name + " " + desc).toLowerCase();
    if (text.includes("cream") || text.includes("serum") || text.includes("perfume") || text.includes("powder") || text.includes("beauty")) {
      return "Beauty & Skincare";
    }
    if (text.includes("sunglasses") || text.includes("watch") || text.includes("wallet") || text.includes("belt") || text.includes("bag") || text.includes("accessory")) {
      return "Accessories";
    }
    if (text.includes("boy") || text.includes("suit") || text.includes("blazer") || text.includes("trench") || text.includes("men")) {
      return "Boys Atelier";
    }
    if (text.includes("girl") || text.includes("dress") || text.includes("silk") || text.includes("women")) {
      return "Girls Atelier";
    }
    if (text.includes("kid") || text.includes("quilted") || text.includes("merino") || text.includes("cashmere")) {
      return "Kids Collection";
    }
    return "Haute Edition";
  };

  return (
    <div className="admin-products-container" id="admin-products-section">
      {/* 1. Section Header */}
      <div className="products-header-row">
        <div className="products-title-group">
          <h2>
            <span>Catalog Management</span>
            <span className="products-total-badge">{products.length} Products</span>
          </h2>
          <p className="products-subtitle">
            Curate luxury product catalog, stock inventory, pricing, and AI-generated highlights
          </p>
        </div>

        <div className="products-actions-header">
          <button
            type="button"
            onClick={() => {
              if (showEditor && !editingId) {
                setShowEditor(false);
              } else {
                handleOpenCreate();
              }
            }}
            className="btn-new-product-cta"
            title="Create a new catalog product"
          >
            <Plus size={16} />
            <span>{showEditor && !editingId ? "Close Editor" : "Create Product"}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Catalog KPI Metrics Strip */}
      <div className="products-kpi-grid">
        {/* Metric 1: Total Catalog Pieces */}
        <div className="product-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Active Catalog</span>
            <div className="kpi-icon-wrap kpi-icon-blue">
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-main-metric">{metrics.totalCount} Items</div>
          <div className="kpi-sub-text text-emerald">
            <CheckCircle2 size={13} />
            <span>Live on Storefront</span>
          </div>
        </div>

        {/* Metric 2: Total Valuation */}
        <div className="product-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Catalog Valuation</span>
            <div className="kpi-icon-wrap kpi-icon-emerald">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-main-metric">
            ₹{metrics.totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-sub-text">
            <span>Avg Price: ₹{metrics.avgPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Metric 3: Total Stock Units */}
        <div className="product-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Stock Available</span>
            <div className="kpi-icon-wrap kpi-icon-purple">
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-main-metric">{metrics.totalUnits} Units</div>
          <div className="kpi-sub-text">
            <span>Total warehouse inventory</span>
          </div>
        </div>

        {/* Metric 4: Inventory Health */}
        <div className="product-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Inventory Alerts</span>
            <div className="kpi-icon-wrap kpi-icon-amber">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-main-metric">
            {metrics.lowStockCount} Low
          </div>
          <div className="kpi-sub-text">
            <span>{metrics.outOfStockCount} sold out items</span>
          </div>
        </div>
      </div>

      {/* 3. Create / Edit Product Form (Collapsible / Modal Drawer Card) */}
      {(showEditor || editingId) && (
        <div className="product-editor-card animate-scaleUp" ref={editorRef}>
          <div className="editor-card-header">
            <div className="editor-title-wrap">
              <div className="editor-icon-badge">
                <Package size={20} />
              </div>
              <div>
                <h3>{editingId ? `Edit Product #${editingId}` : "Create New Product"}</h3>
                <p>
                  {editingId
                    ? "Update pricing, inventory units, description, and hero media."
                    : "Add an haute couture piece to your collections with automated AI descriptions."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowEditor(false);
                handleCancelEdit();
              }}
              className="btn-modal-close"
              title="Close Editor"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="editor-form-grid">
              <div className="form-field-group">
                <label className="form-field-label">Product Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Tailored Terracotta Clay Blazer"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Retail Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Inventory Stock Units *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="Available units"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Description & AI Generator */}
            <div className="form-field-group">
              <div className="desc-label-row">
                <label className="form-field-label">Product Description</label>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={aiGenerating}
                  className="btn-ai-sparkle-desc"
                  title="Generate converting luxury description using AI"
                >
                  <Sparkles size={13} />
                  <span>{aiGenerating ? "Generating Copy..." : "✨ AI Generate"}</span>
                </button>
              </div>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Detailed description, fabric blend, artisan craftsmanship, or click ✨ AI Generate above..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Image Upload Area */}
            <div className="form-field-group">
              <label className="form-field-label">Product Image (High Resolution)</label>
              <input
                ref={productFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />

              {!form.imagePreview ? (
                <div
                  className="editor-image-dropzone"
                  onClick={() => productFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleImageChange({ target: { files: [file] } });
                    }
                  }}
                >
                  <div className="dropzone-icon-circle">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>
                      Click to upload product image
                    </strong>
                    <span style={{ fontSize: "12.5px", color: "#64748B" }}> or drag & drop</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8" }}>
                    Supports PNG, JPG, or WebP up to 5 MB
                  </p>
                </div>
              ) : (
                <div className="editor-image-preview-bar">
                  <div className="preview-thumbnail-box">
                    <img
                      src={form.imagePreview}
                      alt="Selected preview"
                      className="preview-thumb-img"
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>
                      {form.image ? form.image.name : "Active Product Media"}
                    </p>
                    <p style={{ margin: 0, fontSize: "11.5px", color: "#64748B" }}>
                      {form.image
                        ? `${(form.image.size / (1024 * 1024)).toFixed(2)} MB · Ready to save`
                        : "Current image preserved"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => productFileInputRef.current?.click()}
                      className="btn-prod-action btn-prod-edit"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="btn-prod-action btn-prod-delete"
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="editor-btn-row">
              <button
                type="submit"
                disabled={saveMutation?.isPending}
                className="btn-editor-submit"
              >
                {saveMutation?.isPending
                  ? "Saving to Catalog..."
                  : editingId
                  ? "Update Product"
                  : "Publish to Catalog"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEditor(false);
                  handleCancelEdit();
                }}
                className="btn-editor-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Filter & Search Control Panel */}
      <div className="products-control-panel">
        <div className="products-filter-tabs-row" role="tablist">
          {[
            { id: "ALL", label: "All Products" },
            { id: "IN_STOCK", label: "In Stock" },
            { id: "LOW_STOCK", label: "Low Stock" },
            { id: "OUT_OF_STOCK", label: "Sold Out" },
          ].map((tab) => {
            const count = filterCounts[tab.id] || 0;
            const isActive = selectedFilter === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`product-filter-tab ${isActive ? "active" : ""}`}
                role="tab"
                aria-selected={isActive}
              >
                <span>{tab.label}</span>
                <span className="tab-count-bubble">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="orders-search-sort-row">
          <div className="orders-search-input-wrap">
            <Search size={15} className="search-icon-fixed" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product title, description, SKU, or price..."
              className="orders-search-field"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="btn-clear-search"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="orders-sort-select"
            aria-label="Sort products"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="name_asc">Sort: Name (A to Z)</option>
            <option value="price_high">Sort: Price (High to Low)</option>
            <option value="price_low">Sort: Price (Low to High)</option>
            <option value="stock_high">Sort: Stock (Highest)</option>
            <option value="stock_low">Sort: Stock (Lowest)</option>
          </select>
        </div>
      </div>

      {/* 5. Luxury Products List Dossier */}
      <div className="products-list-wrapper">
        {filteredProducts.length === 0 ? (
          <div className="orders-empty-state">
            <div className="empty-orders-icon-wrap">
              <Package size={28} />
            </div>
            <h3 className="empty-orders-title">No matching products found</h3>
            <p className="empty-orders-desc">
              {searchQuery
                ? `No products found matching "${searchQuery}". Try searching with different keywords.`
                : `There are currently no products under the "${selectedFilter}" filter.`}
            </p>
            {(searchQuery || selectedFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFilter("ALL");
                  setSearchQuery("");
                }}
                className="btn-reset-filters"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stock = Number(product.stock || 0);
            const isLowStock = stock > 0 && stock <= 15;
            const isOutOfStock = stock === 0;

            const categoryName = inferCategory(product.name, product.description);

            return (
              <div key={product.id} className="luxury-product-row-card">
                {/* Left Block: Image & Details */}
                <div className="product-left-dossier">
                  <div className="product-image-frame">
                    {product.image_url ? (
                      <img
                        src={getProductImageUrl(product.image_url)}
                        alt={product.name}
                        onError={handleImageError}
                        className="product-thumb-image"
                      />
                    ) : (
                      <Package size={24} color="#94A3B8" />
                    )}
                  </div>

                  <div className="product-info-block">
                    <div className="product-header-line">
                      <span className="product-sku-tag">
                        #SKU-{String(product.id).padStart(4, "0")}
                      </span>
                      <span className="product-category-pill">
                        {categoryName}
                      </span>
                    </div>

                    <h4 className="product-title-text">{product.name}</h4>

                    {product.description && (
                      <p className="product-desc-line" title={product.description}>
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Block: Price, Stock & Actions */}
                <div className="product-right-dossier">
                  <div className="product-valuation-box">
                    <span className="product-price-hero">
                      ₹{Number(product.price || 0).toFixed(2)}
                    </span>

                    {/* Stock status indicator */}
                    <span
                      className={`product-stock-badge ${
                        isOutOfStock
                          ? "stock-out"
                          : isLowStock
                          ? "stock-low"
                          : "stock-in"
                      }`}
                    >
                      <span className="badge-dot" />
                      <span>
                        {isOutOfStock
                          ? "Sold Out"
                          : isLowStock
                          ? `Low Stock (${stock})`
                          : `In Stock (${stock})`}
                      </span>
                    </span>
                  </div>

                  {/* Actions Group */}
                  <div className="product-actions-group">
                    {/* View on storefront */}
                    <Link
                      to={`/products/${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-prod-action btn-prod-view"
                      title="View product live in storefront"
                    >
                      <ExternalLink size={14} />
                    </Link>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleEditInternal(product)}
                      className="btn-prod-action btn-prod-edit"
                      title="Edit product details"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleteMutation?.isPending}
                      className="btn-prod-action btn-prod-delete"
                      title="Delete product from catalog"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminProductManagement;
