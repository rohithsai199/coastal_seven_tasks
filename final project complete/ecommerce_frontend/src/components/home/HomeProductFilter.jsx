import React, { useState, useMemo } from "react";
import { SlidersHorizontal, X, RotateCcw, ChevronDown, Check } from "lucide-react";
import "./HomeProductFilter.css";

// Filter configuration inspired by Allbirds reference photos
const FILTER_CONFIG = {
  sizes: ["XS", "S", "M", "L", "XL", "Cabin 45L", "41mm Steel", "50ml", "100ml"],
  colors: [
    { name: "Black", hex: "#111111", border: "transparent" },
    { name: "Grey", hex: "#636e72", border: "transparent" },
    { name: "White", hex: "#ffffff", border: "#d1d5db" },
    { name: "Beige", hex: "#d4b996", border: "transparent" },
    { name: "Terracotta", hex: "#b94a32", border: "transparent" },
    { name: "Olive", hex: "#556b2f", border: "transparent" },
    { name: "Green", hex: "#10b981", border: "transparent" },
    { name: "Blue", hex: "#2563eb", border: "transparent" },
    { name: "Gold", hex: "#d97706", border: "transparent" },
  ],
  priceRanges: [
    { id: "under-100", label: "Under ₹100", min: 0, max: 99.99 },
    { id: "100-175", label: "₹100 - ₹175", min: 100, max: 175 },
    { id: "176-250", label: "₹176 - ₹250", min: 176, max: 250 },
    { id: "over-250", label: "Over ₹250", min: 250.01, max: 99999 },
  ],
  categories: [
    { id: "boys", label: "Boys Atelier" },
    { id: "girls", label: "Girls Couture" },
    { id: "kids", label: "Kids Heritage" },
    { id: "accessories", label: "Haute Horlogerie & Bags" },
    { id: "beauty", label: "Pure Botanicals & Beauty" },
  ],
  materials: [
    { id: "wool-silk", label: "Italian Wool-Silk Blend" },
    { id: "silk-velvet", label: "Crushed Silk Velvet" },
    { id: "merino", label: "Extrafine Merino Wool" },
    { id: "cashmere", label: "Mongolian Cashmere" },
    { id: "saffiano", label: "Full-Grain Italian Leather" },
    { id: "titanium", label: "Aerospace Titanium / Steel" },
    { id: "botanical", label: "24K Gold & Pure Botanicals" },
  ],
};

const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest Arrivals" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

export default function HomeProductFilter({
  allProducts = [],
  onFilteredProductsChange,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [sortOption, setSortOption] = useState("featured");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Helper to identify category from product
  const getProductCategory = (p) => {
    const img = (p.image_url || "").toLowerCase();
    const name = (p.name || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();

    if (img.includes("boys_") || (p.id >= 1 && p.id <= 5)) return "boys";
    if (img.includes("girls_") || (p.id >= 6 && p.id <= 10)) return "girls";
    if (img.includes("kids_") || (p.id >= 11 && p.id <= 15)) return "kids";
    if (img.includes("acc_") || (p.id >= 16 && p.id <= 20)) return "accessories";
    if (img.includes("beauty_") || (p.id >= 21 && p.id <= 25)) return "beauty";
    return "general";
  };

  // Helper to detect color in product
  const matchProductColor = (p, colorName) => {
    const text = `${p.name} ${p.description}`.toLowerCase();
    const target = colorName.toLowerCase();

    if (target === "black") return text.includes("noir") || text.includes("black") || text.includes("charcoal");
    if (target === "white") return text.includes("white") || text.includes("cream") || text.includes("oatmeal");
    if (target === "grey") return text.includes("grey") || text.includes("charcoal") || text.includes("slate");
    if (target === "beige") return text.includes("beige") || text.includes("oatmeal") || text.includes("clay") || text.includes("linen");
    if (target === "terracotta") return text.includes("terracotta") || text.includes("clay") || text.includes("crimson") || text.includes("red");
    if (target === "olive") return text.includes("olive") || text.includes("earthy") || text.includes("hunter");
    if (target === "green") return text.includes("green") || text.includes("hunter");
    if (target === "blue") return text.includes("blue") || text.includes("navy") || text.includes("ice-blue");
    if (target === "gold") return text.includes("gold") || text.includes("amber") || text.includes("24k") || text.includes("brass");
    return text.includes(target);
  };

  // Helper to detect material in product
  const matchProductMaterial = (p, matId) => {
    const text = `${p.name} ${p.description}`.toLowerCase();
    if (matId === "wool-silk") return text.includes("wool") && (text.includes("silk") || text.includes("cupro") || text.includes("crepe"));
    if (matId === "silk-velvet") return text.includes("velvet") || text.includes("satin");
    if (matId === "merino") return text.includes("merino");
    if (matId === "cashmere") return text.includes("cashmere");
    if (matId === "saffiano") return text.includes("saffiano") || text.includes("leather") || text.includes("calfskin");
    if (matId === "titanium") return text.includes("titanium") || text.includes("steel") || text.includes("chronometer");
    if (matId === "botanical") return text.includes("botanical") || text.includes("serum") || text.includes("perfume") || text.includes("rose");
    return false;
  };

  // Filter and Sort logic
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Category Filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(getProductCategory(p)));
    }

    // 2. Price Range Filter
    if (selectedPriceRanges.length > 0) {
      result = result.filter((p) => {
        const price = Number(p.price);
        return selectedPriceRanges.some((rangeId) => {
          const range = FILTER_CONFIG.priceRanges.find((r) => r.id === rangeId);
          return range && price >= range.min && price <= range.max;
        });
      });
    }

    // 3. Color Filter
    if (selectedColors.length > 0) {
      result = result.filter((p) => selectedColors.some((c) => matchProductColor(p, c)));
    }

    // 4. Material Filter
    if (selectedMaterials.length > 0) {
      result = result.filter((p) => selectedMaterials.some((m) => matchProductMaterial(p, m)));
    }

    // 5. Size Filter (Check if applicable to category or sizes)
    if (selectedSizes.length > 0) {
      result = result.filter((p) => {
        const cat = getProductCategory(p);
        const text = `${p.name} ${p.description}`.toLowerCase();
        return selectedSizes.some((s) => {
          if (["XS", "S", "M", "L", "XL"].includes(s)) {
            return cat === "boys" || cat === "girls" || cat === "kids";
          }
          if (s.includes("Steel") || s.includes("41mm")) {
            return text.includes("timepiece") || text.includes("chronometer") || cat === "accessories";
          }
          if (s.includes("Cabin")) {
            return text.includes("duffel") || text.includes("bag") || cat === "accessories";
          }
          if (s.includes("ml")) {
            return cat === "beauty";
          }
          return true;
        });
      });
    }

    // 6. Sorting
    if (sortOption === "price-asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOption === "price-desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortOption === "newest") {
      result.sort((a, b) => b.id - a.id);
    } else {
      // Featured: default order
      result.sort((a, b) => a.id - b.id);
    }

    return result;
  }, [
    allProducts,
    selectedCategories,
    selectedPriceRanges,
    selectedColors,
    selectedMaterials,
    selectedSizes,
    sortOption,
  ]);

  // Synchronize filtered items with parent whenever filteredProducts changes
  React.useEffect(() => {
    if (onFilteredProductsChange) {
      onFilteredProductsChange(filteredProducts);
    }
  }, [filteredProducts, onFilteredProductsChange]);

  // Active filter count and tags
  const activeFilterTags = useMemo(() => {
    const tags = [];
    selectedCategories.forEach((catId) => {
      const match = FILTER_CONFIG.categories.find((c) => c.id === catId);
      if (match) tags.push({ type: "category", id: catId, label: match.label });
    });
    selectedPriceRanges.forEach((rangeId) => {
      const match = FILTER_CONFIG.priceRanges.find((r) => r.id === rangeId);
      if (match) tags.push({ type: "price", id: rangeId, label: match.label });
    });
    selectedColors.forEach((color) => {
      tags.push({ type: "color", id: color, label: color });
    });
    selectedMaterials.forEach((matId) => {
      const match = FILTER_CONFIG.materials.find((m) => m.id === matId);
      if (match) tags.push({ type: "material", id: matId, label: match.label });
    });
    selectedSizes.forEach((size) => {
      tags.push({ type: "size", id: size, label: `Size: ${size}` });
    });
    return tags;
  }, [selectedCategories, selectedPriceRanges, selectedColors, selectedMaterials, selectedSizes]);

  const removeFilterTag = (tag) => {
    if (tag.type === "category") {
      setSelectedCategories((prev) => prev.filter((id) => id !== tag.id));
    } else if (tag.type === "price") {
      setSelectedPriceRanges((prev) => prev.filter((id) => id !== tag.id));
    } else if (tag.type === "color") {
      setSelectedColors((prev) => prev.filter((c) => c !== tag.id));
    } else if (tag.type === "material") {
      setSelectedMaterials((prev) => prev.filter((m) => m !== tag.id));
    } else if (tag.type === "size") {
      setSelectedSizes((prev) => prev.filter((s) => s !== tag.id));
    }
  };

  const resetAllFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceRanges([]);
    setSelectedCategories([]);
    setSelectedMaterials([]);
  };

  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (colorName) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const togglePriceRange = (rangeId) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(rangeId) ? prev.filter((r) => r !== rangeId) : [...prev, rangeId]
    );
  };

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const toggleMaterial = (matId) => {
    setSelectedMaterials((prev) =>
      prev.includes(matId) ? prev.filter((m) => m !== matId) : [...prev, matId]
    );
  };

  const currentSortLabel = SORT_OPTIONS.find((s) => s.id === sortOption)?.label || "Featured";

  return (
    <div className="home-filter-reference-container">
      {/* ========================================================
          1. COLLAPSED FILTER BAR (Photo 2 Reference)
      ======================================================== */}
      {!isExpanded && (
        <div className="filter-collapsed-capsule-bar">
          <div className="filter-capsule-left">
            <button
              type="button"
              className="btn-trigger-filter-expand"
              onClick={() => setIsExpanded(true)}
            >
              <SlidersHorizontal size={16} />
              <span>FILTER ({filteredProducts.length} products)</span>
            </button>

            {/* Active Filter Chips */}
            <div className="filter-active-chips-inline">
              {activeFilterTags.map((tag) => (
                <button
                  key={`${tag.type}-${tag.id}`}
                  type="button"
                  className="filter-active-pill"
                  onClick={() => removeFilterTag(tag)}
                  title={`Remove ${tag.label}`}
                >
                  <span>{tag.label}</span>
                  <X size={13} />
                </button>
              ))}

              {activeFilterTags.length > 0 && (
                <button
                  type="button"
                  className="btn-reset-text"
                  onClick={resetAllFilters}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Sort Dropdown (Capsule on right) */}
          <div className="filter-capsule-right">
            <div className="sort-dropdown-container">
              <button
                type="button"
                className="btn-sort-toggle-capsule"
                onClick={() => setIsSortOpen((prev) => !prev)}
              >
                <span>{currentSortLabel}</span>
                <ChevronDown size={15} />
              </button>

              {isSortOpen && (
                <div className="sort-menu-popover">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`sort-option-item ${opt.id === sortOption ? "active" : ""}`}
                      onClick={() => {
                        setSortOption(opt.id);
                        setIsSortOpen(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {opt.id === sortOption && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. EXPANDED FILTER DRAWER (Photo 1 Reference)
      ======================================================== */}
      {isExpanded && (
        <div className="filter-expanded-reference-card">
          {/* Header Row */}
          <div className="filter-drawer-header">
            <div className="filter-drawer-header-left">
              <button
                type="button"
                className="btn-collapse-filters"
                onClick={() => setIsExpanded(false)}
              >
                <X size={17} />
                <span>COLLAPSE FILTERS ({filteredProducts.length} products)</span>
              </button>

              {/* Active Filter Tags */}
              <div className="filter-drawer-active-tags">
                {activeFilterTags.map((tag) => (
                  <button
                    key={`${tag.type}-${tag.id}`}
                    type="button"
                    className="filter-active-pill"
                    onClick={() => removeFilterTag(tag)}
                  >
                    <span>{tag.label}</span>
                    <X size={13} />
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-drawer-header-right">
              {activeFilterTags.length > 0 && (
                <button
                  type="button"
                  className="btn-drawer-reset-all"
                  onClick={resetAllFilters}
                >
                  <RotateCcw size={14} />
                  <span>Reset All</span>
                </button>
              )}

              <button
                type="button"
                className="btn-apply-filters-dark"
                onClick={() => setIsExpanded(false)}
              >
                <span>APPLY FILTERS</span>
              </button>
            </div>
          </div>

          {/* 5 Filter Columns Grid (Matching Reference Photo 1) */}
          <div className="filter-columns-grid">
            {/* Column 1: SIZE */}
            <div className="filter-column">
              <h4 className="filter-col-title">SIZE</h4>
              <p className="filter-col-hint">
                Select your tailored atelier size or bespoke dimension.
              </p>
              <div className="filter-size-grid">
                {FILTER_CONFIG.sizes.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`filter-size-btn ${isSelected ? "active" : ""}`}
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: COLOR */}
            <div className="filter-column">
              <h4 className="filter-col-title">COLOR</h4>
              <div className="filter-color-list">
                {FILTER_CONFIG.colors.map((color) => {
                  const isSelected = selectedColors.includes(color.name);
                  return (
                    <button
                      key={color.name}
                      type="button"
                      className={`filter-color-row-btn ${isSelected ? "active" : ""}`}
                      onClick={() => toggleColor(color.name)}
                    >
                      <span
                        className="color-circle-swatch"
                        style={{
                          backgroundColor: color.hex,
                          border: `1px solid ${color.border}`,
                        }}
                      >
                        {isSelected && (
                          <Check
                            size={12}
                            color={color.name === "White" ? "#111111" : "#ffffff"}
                          />
                        )}
                      </span>
                      <span className="color-name-text">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 3: PRICE */}
            <div className="filter-column">
              <h4 className="filter-col-title">PRICE</h4>
              <div className="filter-checkbox-list">
                {FILTER_CONFIG.priceRanges.map((range) => {
                  const isChecked = selectedPriceRanges.includes(range.id);
                  return (
                    <label key={range.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePriceRange(range.id)}
                        className="filter-checkbox-input"
                      />
                      <span className="checkbox-custom-box">
                        {isChecked && <Check size={12} color="#ffffff" />}
                      </span>
                      <span className="checkbox-text">{range.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Column 4: COLLECTION / CATEGORY */}
            <div className="filter-column">
              <h4 className="filter-col-title">PRODUCT TYPE</h4>
              <div className="filter-checkbox-list">
                {FILTER_CONFIG.categories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <label key={cat.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat.id)}
                        className="filter-checkbox-input"
                      />
                      <span className="checkbox-custom-box">
                        {isChecked && <Check size={12} color="#ffffff" />}
                      </span>
                      <span className="checkbox-text">{cat.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Column 5: MATERIAL */}
            <div className="filter-column">
              <div className="filter-col-header-flex">
                <h4 className="filter-col-title">
                  MATERIAL {selectedMaterials.length > 0 ? `(${selectedMaterials.length})` : ""}
                </h4>
                {selectedMaterials.length > 0 && (
                  <button
                    type="button"
                    className="btn-col-reset"
                    onClick={() => setSelectedMaterials([])}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="filter-checkbox-list">
                {FILTER_CONFIG.materials.map((mat) => {
                  const isChecked = selectedMaterials.includes(mat.id);
                  return (
                    <label key={mat.id} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMaterial(mat.id)}
                        className="filter-checkbox-input"
                      />
                      <span className="checkbox-custom-box">
                        {isChecked && <Check size={12} color="#ffffff" />}
                      </span>
                      <span className="checkbox-text">{mat.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
