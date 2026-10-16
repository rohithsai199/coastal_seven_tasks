# E-Commerce Backend API — UI-ready version

FastAPI backend for a real-world e-commerce frontend.

## Main frontend flows

- Authentication: signup, login, current-user session
- Storefront: product listing, search, filters, sorting, pagination, product detail
- Cart: add, update quantity, remove, clear, cart totals
- Checkout: shipping information + order creation
- Orders: order history, order detail, cancellation
- Admin: product create/update/delete and order status management
- Realtime: authenticated order WebSocket
- Health check: `/health`

## Important setup

1. Copy `.env.example` to `.env`.
2. Fill in your own database, JWT, Redis and optional SMTP credentials.
3. Never commit `.env` or service credentials.
4. Run database migrations in production instead of relying on `create_all`.
5. Add a real payment provider before exposing a "Pay now" flow. The checkout endpoint currently creates an order; it does not process a payment.

## API examples

- `GET /products?q=laptop&min_price=1000&max_price=100000&sort=price_asc&page=1&page_size=20`
- `GET /products/{id}`
- `GET /auth/me`
- `GET /cart`
- `PATCH /cart/{product_id}` with `{"quantity": 2}`
- `DELETE /cart`
- `POST /orders/checkout` with shipping fields
- `GET /orders`
- `GET /orders/{id}`
- `PATCH /orders/{id}/cancel`
- `GET /orders/admin/all` (admin)
- `PATCH /orders/admin/{id}/status?new_status=SHIPPED` (admin)

## Admin users

Signup always creates a customer. Create/promote admin users through a controlled database migration/seed process; do not allow the public signup API to select a role.

## Production notes

The existing database schema is kept compatible in this revision. For a full production build, add Alembic migrations and then introduce product categories, addresses, wishlists, reviews, coupons and payment records as separate domain tables.


## Security hardening in this release

- Browser authentication uses an HttpOnly `access_token` cookie; the frontend no longer stores JWTs in `localStorage`.
- WebSocket authentication uses the cookie instead of putting JWTs in the URL.
- The WebSocket connection manager no longer calls `accept()` twice.
- Order cancellation restores reserved inventory transactionally. Cancelled orders cannot be reopened through the admin status endpoint.
- Currency columns use `NUMERIC(12,2)` at the ORM layer. Apply `migrations/002_hardening.sql` to existing PostgreSQL databases before deployment.
- Celery Redis TLS URLs require certificate verification.
- Product uploads enforce extension/content-type matching, file-size limits, and basic file-signature checks.
- Admin product create/update frontend calls now match the backend (`multipart/form-data` POST and `PATCH`).

The login response still includes a token for non-browser API clients. The React frontend intentionally ignores it and relies on the HttpOnly cookie.
