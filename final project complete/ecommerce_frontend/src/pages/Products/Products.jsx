import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Search,
  Sparkles,
  RotateCcw,
  Layers,
  ChevronDown,
  X,
} from "lucide-react";
import { getProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { semanticSearch } from "../../services/aiService";
import ProductCard from "../../components/product/ProductCard";
import { useCategoryStore } from "../../stores/categoryStore";

function Products() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setActiveCategory = useCategoryStore((state) => state.setActiveCategory);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (
      cat === "beauty" ||
      cat === "boys" ||
      cat === "girls" ||
      cat === "kids" ||
      cat === "accessories"
    ) {
      setActiveCategory(cat);
      navigate("/", { replace: true });
    } else if (cat) {
      setActiveCategory(cat);
    }
  }, [searchParams, setActiveCategory, navigate]);

  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [pageSize, setPageSize] = useState(6);

  const [filters, setFilters] = useState({
    sort: "newest",
    in_stock: false,
    min_price: "",
    max_price: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    sort: "newest",
    in_stock: false,
    min_price: "",
    max_price: "",
  });

  const [toastMessage, setToastMessage] = useState("");

  const {
    data,
    isLoading,
    isError,
    error: queryError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      "products",
      submittedSearch,
      appliedFilters.sort,
      appliedFilters.in_stock,
      appliedFilters.min_price,
      appliedFilters.max_price,
      pageSize,
    ],

    queryFn: ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        page_size: pageSize,
        sort: appliedFilters.sort,
      };

      if (submittedSearch) {
        params.q = submittedSearch;
      }

      if (appliedFilters.in_stock) {
        params.in_stock = true;
      }

      if (appliedFilters.min_price !== "") {
        params.min_price = Number(appliedFilters.min_price);
      }

      if (appliedFilters.max_price !== "") {
        params.max_price = Number(appliedFilters.max_price);
      }

      return getProducts(params);
    },

    initialPageParam: 1,

    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < pageSize) {
        return undefined;
      }
      return allPages.length + 1;
    },
  });

  // Combine all loaded pages into one products array
  const products = data?.pages.flat() ?? [];
  const loadedPagesCount = data?.pages.length ?? 0;

  const error =
    queryError?.response?.data?.detail ||
    (isError ? "Failed to load products from store." : "");

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStockToggle = (e) => {
    setFilters((prev) => ({
      ...prev,
      in_stock: e.target.checked,
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAppliedFilters(filters);
  };

  const [isSemanticMode, setIsSemanticMode] = useState(false);
  const [semanticResults, setSemanticResults] = useState(null);
  const [semanticLoading, setSemanticLoading] = useState(false);

  const executeSemanticSearch = async (term) => {
    if (!term || !term.trim()) {
      setSemanticResults(null);
      return;
    }
    setSemanticLoading(true);
    try {
      const data = await semanticSearch(term.trim(), {
        limit: 12,
        min_score: 0.35,
        max_price: appliedFilters.max_price !== "" ? Number(appliedFilters.max_price) : undefined,
        in_stock_only: appliedFilters.in_stock,
      });
      setSemanticResults(data.results || []);
    } catch (err) {
      console.error("Semantic search failed:", err);
      setToastMessage("Semantic search unavailable. Showing keyword results.");
      setTimeout(() => setToastMessage(""), 4000);
      setSemanticResults(null);
    } finally {
      setSemanticLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSubmittedSearch(searchQuery);
    if (isSemanticMode) {
      executeSemanticSearch(searchQuery);
    } else {
      setSemanticResults(null);
    }
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      sort: "newest",
      in_stock: false,
      min_price: "",
      max_price: "",
    };

    setSearchQuery("");
    setSubmittedSearch("");
    setSemanticResults(null);
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      setToastMessage(`Added "${product.name}" to cart!`);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      setToastMessage(
        err.response?.data?.detail ||
          "Please log in to add items to your cart."
      );
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  return (
    <div className="products-catalog-page">
      <div className="container">
        {/* Toast */}
        {toastMessage && (
          <div className="modern-toast-notification">
            <Sparkles size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="catalog-header-banner">
          <span className="catalog-badge">Curated Collection</span>
          <h1 className="catalog-title">Explore Premium Catalog</h1>
          <p className="catalog-subtitle">
            Discover couture tailoring, evening gowns, artisanal knitwear, fine timepieces, and luxury beauty.
          </p>
        </div>

        {/* Control Bar */}
        <div className="catalog-control-panel">
          {/* Search */}
          <form
            className="catalog-search-form"
            onSubmit={handleSearchSubmit}
          >
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder={
                  isSemanticMode
                    ? "Describe what you seek (e.g. 'regal evening gown for gala', 'tailored double-breasted jacket')..."
                    : "Search couture, gowns, blazers, timepieces, beauty..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="catalog-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSubmittedSearch("");
                    setSemanticResults(null);
                  }}
                  className="catalog-search-clear-btn"
                  title="Clear search input"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const nextMode = !isSemanticMode;
                setIsSemanticMode(nextMode);
                if (nextMode && searchQuery) {
                  executeSemanticSearch(searchQuery);
                } else {
                  setSemanticResults(null);
                }
              }}
              className={`btn-semantic-toggle ${isSemanticMode ? "active" : ""}`}
              title="Toggle ChromaDB Vector Semantic Search"
            >
              <Sparkles size={14} className={isSemanticMode ? "sparkle-mist" : ""} />
              <span>{isSemanticMode ? "AI Semantic Active" : "Semantic Mode"}</span>
            </button>

            <button type="submit" className="btn-search-submit">
              {semanticLoading ? "Searching..." : "Search"}
            </button>
          </form>

          {/* Filters */}
          <form
            className="catalog-filter-bar"
            onSubmit={handleFilterSubmit}
          >
            <div className="filter-select-group">
              <label htmlFor="sort" className="filter-label">
                Sort:
              </label>

              <select
                id="sort"
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="relevance">Best Match</option>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Items Per Page Selector */}
            <div className="filter-select-group">
              <label htmlFor="pageSize" className="filter-label">
                Show:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="filter-select"
              >
                <option value={6}>6 per page</option>
                <option value={8}>8 per page</option>
                <option value={12}>12 per page</option>
                <option value={24}>All items</option>
              </select>
            </div>

            {/* Price Filters */}
            <div className="filter-select-group filter-price-group">
              <label className="filter-label">Price:</label>
              <div className="filter-price-inputs">
                <div className="price-input-box">
                  <span className="currency-sign">$</span>
                  <input
                    type="number"
                    name="min_price"
                    min="0"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={handleFilterChange}
                    className="filter-price-field"
                  />
                </div>

                <span className="price-dash">—</span>

                <div className="price-input-box">
                  <span className="currency-sign">$</span>
                  <input
                    type="number"
                    name="max_price"
                    min="0"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={handleFilterChange}
                    className="filter-price-field"
                  />
                </div>
              </div>
            </div>

            {/* Stock Filter */}
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filters.in_stock}
                onChange={handleStockToggle}
                className="filter-checkbox"
              />
              <span>In Stock Only</span>
            </label>

            <div className="filter-actions-group">
              <button type="submit" className="btn-apply-filters">
                Apply
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-reset-filters"
                title="Reset all filters"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search Status & Intent Suggestions Banner */}
        <div className="catalog-status-banner">
          <div className="status-banner-left">
            <span className={`status-mode-pill ${isSemanticMode ? "semantic" : "fuzzy"}`}>
              <Sparkles size={13} className={isSemanticMode ? "sparkle-mist" : ""} />
              {isSemanticMode
                ? "ChromaDB AI Semantic Retrieval"
                : "PostgreSQL FTS + pg_trgm Search"}
            </span>

            {submittedSearch ? (
              <span className="status-results-text">
                {isSemanticMode ? "Semantic intent: " : "Results matching: "}
                <strong>"{submittedSearch}"</strong>
              </span>
            ) : (
              <span className="status-hint-text">
                {isSemanticMode ? "Try luxury semantic queries:" : "Quick catalogue tags:"}
              </span>
            )}

            {/* Quick Test / Intent Chips */}
            <div className="catalog-tag-chips">
              {(isSemanticMode
                ? [
                    "italian tailored blazer",
                    "velvet runway gown",
                    "titanium chronometer watch",
                    "pure crystal perfume",
                  ]
                : ["blazer", "gown", "overcoat", "sunglasses", "perfume"]
              ).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchQuery(term);
                    setSubmittedSearch(term);
                    if (isSemanticMode) {
                      executeSemanticSearch(term);
                    }
                  }}
                  className={`catalog-tag-chip ${submittedSearch === term ? "active" : ""}`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {submittedSearch && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSubmittedSearch("");
                setSemanticResults(null);
              }}
              className="btn-clear-search-pill"
            >
              <X size={13} />
              <span>Clear Search</span>
            </button>
          )}
        </div>

        {/* Catalog Body */}
        {isSemanticMode && semanticLoading ? (
          <div className="catalog-loading-wrapper">
            <div className="modern-spinner"></div>
            <p style={{ marginTop: "12px", fontWeight: 600 }}>
              Vectorizing query with embedding model & querying ChromaDB...
            </p>
          </div>
        ) : isSemanticMode && semanticResults !== null ? (
          semanticResults.length === 0 ? (
            <div className="catalog-empty-state">
              <div className="empty-icon-circle">
                <Sparkles size={40} color="#7C3AED" />
              </div>
              <h3>No semantic matches found</h3>
              <p>
                We could not find products matching "{submittedSearch}". Try describing the product by use-case or features.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSemanticMode(false);
                  setSemanticResults(null);
                }}
                className="btn-hero-primary"
              >
                Switch to Keyword Search
              </button>
            </div>
          ) : (
            <div className="catalog-results-wrapper">
              <div
                className="results-header-info"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <span>
                  Found <strong>{semanticResults.length}</strong> semantic matches ranked by embedding cosine similarity
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#7C3AED",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Sparkles size={14} /> Redis Vector Cache Active
                </span>
              </div>

              <div className="products-grid-modern">
                {semanticResults.map((product) => (
                  <div key={product.id} style={{ position: "relative" }}>
                    <span className="semantic-score-pill">
                      <Sparkles size={11} /> {Math.round((product.similarity_score ?? 0.8) * 100)}% Match
                    </span>
                    <ProductCard product={product} onAddToCart={handleAddToCart} />
                  </div>
                ))}
              </div>
            </div>
          )
        ) : isLoading ? (
          <div className="catalog-loading-wrapper">
            <div className="modern-spinner"></div>
            <p>Loading catalog items...</p>
          </div>
        ) : error ? (
          <div className="catalog-error-box">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-primary-small"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="catalog-empty-state">
            <div className="empty-icon-circle">
              <Search size={40} />
            </div>

            <h3>No products found</h3>
            <p>
              Try searching for something else or reset your filters.
            </p>

            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-hero-primary"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="catalog-results-wrapper">
            {/* Results Header */}
            <div className="results-header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span>
                Showing <strong>{products.length}</strong> items loaded across <strong>{loadedPagesCount}</strong> page{loadedPagesCount > 1 ? 's' : ''} ({pageSize} per page)
              </span>
              <span style={{ fontSize: '13px', color: '#808E9B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} className="text-purple" /> Pagination active
              </span>
            </div>

            {/* Products Grid */}
            <div className="products-grid-modern">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Pagination / Load More Controls */}
            {hasNextPage && (
              <div className="catalog-pagination-wrap">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="btn-load-more"
                >
                  {isFetchingNextPage ? (
                    "Loading next collection..."
                  ) : (
                    <>
                      <span>Load More Products (Page {loadedPagesCount + 1})</span>
                      <ChevronDown size={17} />
                    </>
                  )}
                </button>
                <p className="catalog-pagination-note">
                  Showing {products.length} items • Click to discover more pieces
                </p>
              </div>
            )}

            {/* End of Products Notice */}
            {!hasNextPage && products.length > 0 && (
              <div className="catalog-end-notice">
                <span>✓</span>
                <span>You have viewed all {products.length} pieces in the collection</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
