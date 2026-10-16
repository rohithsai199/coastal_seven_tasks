import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export const CATEGORY_ITEMS = [
  {
    id: "home",
    label: "Home",
    query: "home",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cat-svg-icon"
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: "boys",
    label: "Boys",
    query: "men",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cat-svg-icon"
      >
        <path d="M20.38 4.46 16 3a4 4 0 0 1-8 0L3.62 4.46a1.8 1.8 0 0 0-1.2 2l.5 3.3a1 1 0 0 0 .98.8h1.8v8.6a1.8 1.8 0 0 0 1.8 1.8h8.8a1.8 1.8 0 0 0 1.8-1.8V10.6h1.8a1 1 0 0 0 .98-.8l.5-3.3a1.8 1.8 0 0 0-1.2-2z" />
        <path d="M6.5 17h11" />
      </svg>
    ),
  },
  {
    id: "girls",
    label: "Girls",
    query: "women",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cat-svg-icon"
      >
        <path d="M9 3h6l1.5 5-2.5 1 4 12H6l4-12-2.5-1L9 3z" />
        <path d="M10 3a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    id: "kids",
    label: "Kids",
    query: "kids",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cat-svg-icon"
      >
        <path d="M6.5 4.8 9 3h6l2.5 1.8 2.2 3.8-3 1.4v6a3 3 0 0 1-3 3h-3.4a3 3 0 0 1-3-3v-6L4.3 8.6z" />
        <path d="M10 3a2 2 0 0 0 4 0" />
        <circle cx="12" cy="11.5" r="0.8" fill="currentColor" />
        <circle cx="12" cy="14.5" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "accessories",
    label: "Accessories",
    query: "accessories",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cat-svg-icon"
      >
        <circle cx="6" cy="15" r="4" />
        <circle cx="18" cy="15" r="4" />
        <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
        <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2" />
        <path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2" />
      </svg>
    ),
  },
  {
    id: "beauty",
    label: "Beauty",
    query: "beauty",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cat-svg-icon"
      >
        <path d="M9 11.5h6v9a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 20.5v-9z" />
        <path d="M10 11.5V7.5l4-4.5v8.5" />
        <line x1="9" y1="15.5" x2="15" y2="15.5" />
      </svg>
    ),
  },
  {
    id: "orders",
    label: "Orders",
    query: "orders",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cat-svg-icon"
      >
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
];

function CategoryNavRow({
  activeCategory: initialActive = "home",
  onSelectCategory,
  orientation = "vertical",
}) {
  const [selectedId, setSelectedId] = useState(initialActive);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    setSelectedId(initialActive);
  }, [initialActive]);

  const handleItemClick = (item) => {
    setSelectedId(item.id);
    if (onSelectCategory) {
      onSelectCategory(item);
    } else if (item.id === "orders") {
      navigate("/orders");
    } else if (
      item.id === "home" ||
      item.id === "boys" ||
      item.id === "girls" ||
      item.id === "kids" ||
      item.id === "accessories" ||
      item.id === "beauty"
    ) {
      navigate("/");
    } else {
      navigate(`/products?category=${item.id}&q=${encodeURIComponent(item.query)}`);
    }
  };

  const isVertical = orientation === "vertical";

  return (
    <div
      className={`category-strip-widget ${isVertical ? "vertical" : "horizontal"}`}
      role="navigation"
      aria-label="Product Categories"
    >
      {/* Background sparkling star particles */}
      <div className="cat-sparkles-layer" aria-hidden="true">
        <span className="star-dot dot-1">✦</span>
        <span className="star-dot dot-2">·</span>
        <span className="star-dot dot-3">✦</span>
        <span className="star-dot dot-4">·</span>
        <span className="star-dot dot-5">✦</span>
      </div>

      <div
        className={
          isVertical ? "category-strip-items-col" : "category-strip-items-row"
        }
      >
        {CATEGORY_ITEMS.map((item) => {
          if (item.id === "orders" && isAdmin) {
            return null;
          }
          const isActive = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className={`cat-strip-item-btn ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
            >
              <div className="cat-icon-tile">
                {item.icon}
              </div>

              <span className="cat-item-label">
                <span className="label-full">{item.label}</span>
                {item.shortLabel && (
                  <span className="label-short">{item.shortLabel}</span>
                )}
              </span>

              {/* Active Underline Pill */}
              {isActive && <span className="cat-active-pill-bar" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryNavRow;
