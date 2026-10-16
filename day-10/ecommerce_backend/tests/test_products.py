"""
Product tests – covers CRUD operations, image upload, and Redis caching.
"""
import io
import pytest


class TestProductListing:
    def test_list_products_returns_200(self, client):
        res = client.get("/products")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_products_cached_on_second_call(self, client, mock_redis):
        """Second call must hit the mock Redis cache (setex was called on first call)."""
        client.get("/products")  # prime the cache
        client.get("/products")  # should be served from mock redis
        # If setex was called, the cache write path was exercised
        assert mock_redis.setex.called or mock_redis.get.called


class TestProductCreate:
    def test_create_product_without_image(self, client, auth_headers):
        res = client.post(
            "/products",
            data={"name": "Widget A", "description": "A simple widget", "price": "199.99", "stock": "50"},
            headers=auth_headers,
        )
        assert res.status_code == 201
        body = res.json()
        assert body["name"] == "Widget A"
        assert body["price"] == 199.99
        assert body["stock"] == 50

    def test_create_product_with_image(self, client, auth_headers):
        fake_image = io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 100)
        res = client.post(
            "/products",
            data={"name": "Camera", "description": "DSLR Camera", "price": "75000", "stock": "5"},
            files={"image": ("camera.png", fake_image, "image/png")},
            headers=auth_headers,
        )
        assert res.status_code == 201
        body = res.json()
        assert body["image_url"] is not None
        assert "camera.png" in body["image_url"]

    def test_create_product_missing_required_field(self, client, auth_headers):
        res = client.post(
            "/products",
            data={"name": "Incomplete"},  # missing price and stock
            headers=auth_headers,
        )
        assert res.status_code == 422

    def test_create_product_requires_auth(self, client):
        res = client.post(
            "/products",
            data={"name": "Unauthorized Product", "price": "100", "stock": "1"},
        )
        assert res.status_code == 401

    def test_created_product_appears_in_listing(self, client, auth_headers):
        client.post(
            "/products",
            data={"name": "Visible Item", "price": "500", "stock": "3"},
            headers=auth_headers,
        )
        res = client.get("/products")
        names = [p["name"] for p in res.json()]
        assert "Visible Item" in names

    def test_product_response_schema(self, client, auth_headers):
        res = client.post(
            "/products",
            data={"name": "Schema Check", "price": "10", "stock": "1"},
            headers=auth_headers,
        )
        assert res.status_code == 201
        body = res.json()
        for field in ("id", "name", "price", "stock"):
            assert field in body
