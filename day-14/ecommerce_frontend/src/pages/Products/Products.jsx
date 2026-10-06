import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Search,
  Sparkles,
  RotateCcw,
  Layers,
  ChevronDown,
} from "lucide-react";
import { getProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import ProductCard from "../../components/product/ProductCard";

function Products() {
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSubmittedSearch(searchQuery);
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
          <span className="catalog-badge">Full Collection</span>
          <h1 className="catalog-title">Explore Premium Catalog</h1>
          <p className="catalog-subtitle">
            Discover precision-crafted tech, active acoustics, smart
            biometrics, and everyday carry.
          </p>
        </div>

        {/* Control Bar */}
        <div className="catalog-control-panel">
          {/* Search */}
          <form
            className="catalog-search-form"
            onSubmit={handleSearchSubmit}
          >
            <Search size={18} className="search-icon" />

            <input
              type="text"
              placeholder="Search gear by name, spec, or feature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="catalog-search-input"
            />

            <button type="submit" className="btn-search-submit">
              Search
            </button>
          </form>

          {/* Filters */}
          <form
            className="catalog-filter-bar"
            onSubmit={handleFilterSubmit}
          >
            <div className="filter-select-group">
              <label htmlFor="sort" className="filter-label">
                Sort By:
              </label>

              <select
                id="sort"
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="newest">✨ Newest First</option>
                <option value="price_asc">💵 Price: Low to High</option>
                <option value="price_desc">💎 Price: High to Low</option>
                <option value="name">🔤 Name A-Z</option>
              </select>
            </div>

            {/* Items Per Page Selector */}
            <div className="filter-select-group">
              <label htmlFor="pageSize" className="filter-label">
                Per Page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="filter-select"
              >
                <option value={6}>6 items (4 Pages)</option>
                <option value={8}>8 items (3 Pages)</option>
                <option value={12}>12 items (2 Pages)</option>
                <option value={24}>24 items (All)</option>
              </select>
            </div>

            {/* Price Filters */}
            <div className="filter-price-inputs">
              <input
                type="number"
                name="min_price"
                min="0"
                placeholder="Min $"
                value={filters.min_price}
                onChange={handleFilterChange}
                className="filter-price-field"
              />

              <span className="price-dash">-</span>

              <input
                type="number"
                name="max_price"
                min="0"
                placeholder="Max $"
                value={filters.max_price}
                onChange={handleFilterChange}
                className="filter-price-field"
              />
            </div>

            {/* Stock Filter */}
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filters.in_stock}
                onChange={handleStockToggle}
              />
              <span>In Stock Only</span>
            </label>

            <button type="submit" className="btn-apply-filters">
              Apply
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-reset-filters"
              title="Reset all filters"
            >
              <RotateCcw size={16} />
            </button>
          </form>
        </div>

        {/* Catalog Body */}
        {isLoading ? (
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
              <div
                style={{
                  textAlign: "center",
                  marginTop: "48px",
                  marginBottom: "40px",
                }}
              >
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="btn-hero-primary"
                  style={{ padding: '16px 36px', fontSize: '16px' }}
                >
                  {isFetchingNextPage ? (
                    "Loading next page..."
                  ) : (
                    <>
                      <span>Load More Products (Page {loadedPagesCount + 1})</span>
                      <ChevronDown size={18} />
                    </>
                  )}
                </button>
                <p style={{ marginTop: '12px', fontSize: '13px', color: '#808E9B' }}>
                  Click to fetch next {pageSize} items via backend pagination API
                </p>
              </div>
            )}

            {/* End of Products Notice */}
            {!hasNextPage && products.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "48px",
                  marginBottom: "40px",
                  color: "#808E9B",
                  fontSize: "14px",
                  background: "#F8F9FA",
                  padding: "16px",
                  borderRadius: "12px",
                  maxWidth: "400px",
                  margin: "48px auto 40px"
                }}
              >
                ✓ All {products.length} products loaded. You've reached the end of the catalog!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
