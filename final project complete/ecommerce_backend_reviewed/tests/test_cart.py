"""
Cart tests – covers add, view, remove, stock validation, and Redis operations.
"""
import pytest


@pytest.fixture(scope="module")
def product_id(client, admin_headers):
    """Create a product and return its id for cart tests."""
    res = client.post(
        "/products",
        data={"name": "Cart Product", "price": "1000", "stock": "20"},
        headers=admin_headers,
    )
    assert res.status_code == 201
    return res.json()["id"]


class TestCartAdd:
    def test_add_item_to_cart(self, client, auth_headers, product_id):
        res = client.post(
            f"/cart/add?product_id={product_id}&quantity=2",
            headers=auth_headers,
        )
        assert res.status_code == 200
        body = res.json()
        assert body["product_id"] == product_id
        assert body["quantity"] == 2

    def test_add_to_cart_accumulates_quantity(self, client, auth_headers, product_id):
        # Add 2 more on top of the previous 2
        res = client.post(
            f"/cart/add?product_id={product_id}&quantity=2",
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.json()["quantity"] == 4

    def test_add_nonexistent_product(self, client, auth_headers):
        res = client.post(
            "/cart/add?product_id=99999&quantity=1",
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_add_exceeds_stock_rejected(self, client, auth_headers, product_id):
        # Stock is 20, already 4 in cart, request 100 more
        res = client.post(
            f"/cart/add?product_id={product_id}&quantity=100",
            headers=auth_headers,
        )
        assert res.status_code == 400
        assert "stock" in res.json()["detail"].lower()

    def test_add_to_cart_requires_auth(self, client, product_id):
        res = client.post(f"/cart/add?product_id={product_id}&quantity=1")
        assert res.status_code == 401


class TestCartView:
    def test_view_cart_returns_items(self, client, auth_headers, product_id):
        res = client.get("/cart", headers=auth_headers)
        assert res.status_code == 200
        body = res.json()
        assert "cart" in body
        assert "grand_total" in body
        assert isinstance(body["cart"], list)
        assert len(body["cart"]) > 0

    def test_view_cart_requires_auth(self, client):
        res = client.get("/cart")
        assert res.status_code == 401


class TestCartRemove:
    def test_remove_item_from_cart(self, client, auth_headers, product_id):
        res = client.delete(f"/cart/remove/{product_id}", headers=auth_headers)
        assert res.status_code == 200
        assert str(product_id) in res.json()["message"]

    def test_remove_requires_auth(self, client, product_id):
        res = client.delete(f"/cart/remove/{product_id}")
        assert res.status_code == 401
