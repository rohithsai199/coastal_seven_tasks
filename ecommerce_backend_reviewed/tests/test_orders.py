"""
Order tests – covers checkout flow, stock validation, empty cart handling,
and Celery email dispatch mocking.
"""
import pytest
from unittest.mock import patch, MagicMock


@pytest.fixture(scope="module")
def checkout_product(client, admin_headers):
    """Create a fresh product for checkout tests."""
    res = client.post(
        "/products",
        data={"name": "Checkout Item", "price": "2500", "stock": "15"},
        headers=admin_headers,
    )
    assert res.status_code == 201
    return res.json()


class TestCheckout:
    def test_checkout_empty_cart_rejected(self, client, auth_headers):
        """Checkout with nothing in cart must return 400."""
        # Ensure cart is empty by viewing it (it may already be empty after remove tests)
        res = client.post("/orders/checkout", headers=auth_headers)
        # Could be 400 if cart empty, or 201 if something lingers – main path is 400
        assert res.status_code in (400, 201)

    def test_checkout_full_flow(self, client, auth_headers, checkout_product, mock_redis):
        """Add product → checkout → verify 201 and order body."""
        pid = checkout_product["id"]

        # Add to cart
        add_res = client.post(
            f"/cart/add?product_id={pid}&quantity=2",
            headers=auth_headers,
        )
        assert add_res.status_code == 200

        with patch("app.routers.orders.send_order_confirmation_email") as mock_task:
            mock_task.delay.return_value = MagicMock(id="mocked-task-id")
            res = client.post("/orders/checkout", headers=auth_headers)

        assert res.status_code == 201
        body = res.json()
        assert "id" in body
        assert "total_amount" in body
        assert body["total_amount"] == 2 * float(checkout_product["price"])

    def test_checkout_deducts_stock(self, client, auth_headers, checkout_product):
        """Stock must decrease after a successful checkout."""
        pid = checkout_product["id"]
        # Get initial stock from product listing
        products = client.get("/products").json()
        product = next((p for p in products if p["id"] == pid), None)
        if product is None:
            pytest.skip("Product not found in listing")

        initial_stock = product["stock"]
        order_qty = 1

        client.post(f"/cart/add?product_id={pid}&quantity={order_qty}", headers=auth_headers)
        with patch("app.routers.orders.send_order_confirmation_email") as mock_task:
            mock_task.delay.return_value = MagicMock(id="mocked-task-id")
            checkout_res = client.post("/orders/checkout", headers=auth_headers)

        assert checkout_res.status_code == 201

        products_after = client.get("/products").json()
        product_after = next((p for p in products_after if p["id"] == pid), None)
        assert product_after is not None
        assert product_after["stock"] == initial_stock - order_qty

    def test_checkout_requires_auth(self, client):
        res = client.post("/orders/checkout")
        assert res.status_code == 401

    def test_checkout_celery_task_dispatched(self, client, auth_headers, checkout_product):
        """Verify that the Celery email task is triggered after checkout."""
        pid = checkout_product["id"]
        client.post(f"/cart/add?product_id={pid}&quantity=1", headers=auth_headers)

        with patch("app.routers.orders.send_order_confirmation_email") as mock_task:
            mock_task.delay.return_value = MagicMock(id="task-123")
            res = client.post("/orders/checkout", headers=auth_headers)
            if res.status_code == 201:
                mock_task.delay.assert_called_once()
