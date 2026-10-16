-- Run this once against an existing PostgreSQL database before deploying
-- the revised API. Fresh databases get these columns from SQLAlchemy metadata.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR;
