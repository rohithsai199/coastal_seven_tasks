import { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  Filter,
  RotateCcw,
} from "lucide-react";
import { getProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import ProductCard from "../../components/product/ProductCard";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    sort: "newest",
    in_stock: false,
    min_price: "",
    max_price: "",
  });
  const [toastMessage, setToastMessage] = useState("");

  const loadProducts = async (search = searchQuery) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        sort: filters.sort,
        page: 1,
        page_size: 24,
      };

      if (filters.in_stock) {
        params.in_stock = true;
      }

      if (search.trim()) {
        params.q = search.trim();
      }

      if (filters.min_price) {
        params.min_price = Number(filters.min_price);
      }

      if (filters.max_price) {
        params.max_price = Number(filters.max_price);
      }

      const data = await getProducts(params);
      setProducts(data || []);
    } catch (err) {
      console.error("Products load error:", err);
      setError(
        err.response?.data?.detail || "Failed to load products from store."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters.sort, filters.in_stock]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockToggle = (e) => {
    setFilters((prev) => ({ ...prev, in_stock: e.target.checked }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts(searchQuery);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilters({
      sort: "newest",
      in_stock: false,
      min_price: "",
      max_price: "",
    });
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      setToastMessage(`Added "${product.name}" to cart!`);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      setToastMessage(
        err.response?.data?.detail || "Please log in to add items to your cart."
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
            Discover precision-crafted tech, active acoustics, smart biometrics, and everyday carry.
          </p>
        </div>

        {/* Control Bar: Search & Quick Filters */}
        <div className="catalog-control-panel">
          <form className="catalog-search-form" onSubmit={handleSearchSubmit}>
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

          <form className="catalog-filter-bar" onSubmit={handleFilterSubmit}>
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
        {loading ? (
          <div className="catalog-loading-wrapper">
            <div className="modern-spinner"></div>
            <p>Loading catalog items...</p>
          </div>
        ) : error ? (
          <div className="catalog-error-box">
            <p>{error}</p>
            <button
              onClick={() => loadProducts()}
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
            <p>Try searching for something else or reset your filters.</p>
            <button onClick={handleResetFilters} className="btn-hero-primary">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="catalog-results-wrapper">
            <div className="results-header-info">
              <span>Showing <strong>{products.length}</strong> premium items</span>
            </div>

            <div className="products-grid-modern">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;