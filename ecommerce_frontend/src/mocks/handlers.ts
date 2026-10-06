import { http, HttpResponse } from "msw";

const BASE = "http://127.0.0.1:8000";

// ─── Shared mock data ───────────────────────────────────────────────────────
const mockProduct = {
  id: 1,
  name: "Test Laptop",
  price: 30000,
  stock: 10,
  image_url: "/test-laptop.jpg",
  description: "Test product",
};

const mockCartResponse = {
  cart: [
    {
      product_id: 1,
      name: "Test Laptop",
      price: 30000,
      image_url: "/test-laptop.jpg",
      quantity: 2,
      total: 60000,
    },
  ],
  item_count: 2,
  grand_total: 60000,
};

const mockOrder = {
  id: 101,
  status: "pending",
  total_amount: 60000,
  created_at: "2026-10-01T10:00:00Z",
};

const mockUser = { id: 1, email: "test@example.com" };

// ─── Handlers ────────────────────────────────────────────────────────────────
export const handlers = [
  // Products
  http.get(`${BASE}/products`, () => HttpResponse.json([mockProduct])),
  http.get(`${BASE}/products/:id`, ({ params }) =>
    HttpResponse.json({ ...mockProduct, id: Number(params.id) })
  ),

  // Cart
  http.get(`${BASE}/cart`, () => HttpResponse.json(mockCartResponse)),
  http.post(`${BASE}/cart/add`, () =>
    HttpResponse.json({ message: "Item added to cart" })
  ),
  http.patch(`${BASE}/cart/:productId`, () =>
    HttpResponse.json({ message: "Cart updated" })
  ),
  http.delete(`${BASE}/cart/remove/:productId`, () =>
    HttpResponse.json({ message: "Item removed" })
  ),
  http.delete(`${BASE}/cart`, () =>
    HttpResponse.json({ message: "Cart cleared" })
  ),

  // Orders
  http.get(`${BASE}/orders`, () => HttpResponse.json([mockOrder])),
  http.get(`${BASE}/orders/:id`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: Number(params.id) })
  ),
  http.post(`${BASE}/orders/checkout`, () =>
    HttpResponse.json(mockOrder, { status: 201 })
  ),
  http.patch(`${BASE}/orders/:id/cancel`, ({ params }) =>
    HttpResponse.json({ ...mockOrder, id: Number(params.id), status: "cancelled" })
  ),

  // Auth
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ access_token: "mock-jwt-token", token_type: "bearer" })
  ),
  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json(mockUser, { status: 201 })
  ),
  http.get(`${BASE}/auth/me`, () => HttpResponse.json(mockUser)),
];