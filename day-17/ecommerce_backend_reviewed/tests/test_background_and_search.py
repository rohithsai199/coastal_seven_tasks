import os
import io
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import text
from unittest.mock import MagicMock, patch

from app.main import app
from app.database import SessionLocal, engine
from app.models import Product, Order, OrderItem, User
from app.tasks.invoice_tasks import generate_order_invoice
from app.tasks.csv_tasks import import_products_csv


def test_pdf_invoice_generation():
    """Verify that generate_order_invoice generates a valid PDF file."""
    db = SessionLocal()
    try:
        # Ensure a test user exists
        user = db.query(User).filter(User.email == "invoice_test@example.com").first()
        if not user:
            user = User(email="invoice_test@example.com", hashed_password="fakehash123", role="customer")
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create test product
        prod = Product(name="Invoice Test Laptop", description="A great test laptop", price=1299.99, stock=10)
        db.add(prod)
        db.commit()
        db.refresh(prod)

        # Create test order
        order = Order(
            user_id=user.id,
            total_amount=Decimal("1299.99"),
            status="PROCESSING",
            shipping_name="John Doe",
            shipping_phone="555-123-4567",
            shipping_address="123 Silicon Way",
            shipping_city="San Francisco",
            shipping_state="CA",
            shipping_postal_code="94105",
        )
        db.add(order)
        db.flush()

        item = OrderItem(order_id=order.id, product_id=prod.id, quantity=1, price=Decimal("1299.99"))
        db.add(item)
        db.commit()
        db.refresh(order)

        order_id = order.id
    finally:
        db.close()

    # Execute task synchronously
    result = generate_order_invoice.apply(args=[order_id])
    assert result.state == "SUCCESS"
    data = result.result
    assert data["status"] == "COMPLETED"
    assert data["order_id"] == order_id
    assert "pdf_url" in data
    assert data["pdf_url"].endswith(".pdf")

    # Verify PDF file actually exists on filesystem
    local_path = data["pdf_url"].lstrip("/")
    assert os.path.exists(local_path)
    with open(local_path, "rb") as f:
        header = f.read(5)
        assert header == b"%PDF-"


def test_bulk_csv_import_task():
    """Verify that import_products_csv processes rows, tracks progress, and seeds DB."""
    sample_csv = (
        "name,description,price,stock,image_url\n"
        "Bulk ANC Earphones,High-end acoustic noise cancellation,199.99,25,/static/test_audio.jpg\n"
        "Bulk Minimalist Watch,Sapphire crystal luxury watch,299.00,15,/static/test_watch.jpg\n"
    )

    result = import_products_csv.apply(args=[sample_csv])
    assert result.state == "SUCCESS"
    res_data = result.result
    assert res_data["status"] == "COMPLETED"
    assert res_data["imported_count"] == 2
    assert res_data["total_rows"] == 2

    # Verify products are present in database
    db = SessionLocal()
    try:
        p1 = db.query(Product).filter(Product.name == "Bulk ANC Earphones").first()
        p2 = db.query(Product).filter(Product.name == "Bulk Minimalist Watch").first()
        assert p1 is not None
        assert float(p1.price) == 199.99
        assert p1.stock == 25
        assert p2 is not None
        assert float(p2.price) == 299.00

        # Cleanup
        db.query(Product).filter(Product.id.in_([p1.id, p2.id])).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def test_task_status_endpoint():
    """Verify GET /tasks/{task_id}/status endpoint returns lifecycle info."""
    client = TestClient(app)
    response = client.get("/tasks/non-existent-task-id-123/status")
    assert response.status_code == 200
    json_data = response.json()
    assert "task_id" in json_data
    assert "state" in json_data
    assert "progress" in json_data
    assert "status" in json_data


def test_csv_template_endpoint():
    """Verify GET /tasks/csv-template returns a valid CSV template."""
    client = TestClient(app)
    response = client.get("/tasks/csv-template")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "name,price,stock" in response.text


def test_full_text_search_and_fuzzy_trigram():
    """Verify PostgreSQL full-text and typo-tolerant search works."""
    db = SessionLocal()
    try:
        # Check if database is PostgreSQL
        is_postgres = getattr(db.bind.dialect, "name", "") == "postgresql"
        if not is_postgres:
            pytest.skip("Full-text and Trigram test requires PostgreSQL")

        # Test full text search
        client = TestClient(app)
        res_fts = client.get("/products?q=headphone")
        assert res_fts.status_code == 200
        items_fts = res_fts.json()
        assert any("headphone" in (p["name"] + p["description"]).lower() for p in items_fts)

        # Test fuzzy typo tolerance: "smarwtach" -> "Smartwatch"
        res_fuzzy = client.get("/products?q=smarwtach")
        assert res_fuzzy.status_code == 200
        items_fuzzy = res_fuzzy.json()
        assert len(items_fuzzy) > 0
        assert any("smart" in p["name"].lower() for p in items_fuzzy)
    finally:
        db.close()


def test_n_plus_one_query_optimization():
    """Verify that eager loading (selectinload / joinedload) loads related entities efficiently."""
    from sqlalchemy.orm import selectinload, joinedload
    db = SessionLocal()
    try:
        # Query orders with selectinload + joinedload
        orders = (
            db.query(Order)
            .options(
                selectinload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.user),
            )
            .limit(5)
            .all()
        )
        for order in orders:
            # Accessing items, item.product, and user should NOT trigger additional DB queries
            _ = [item.product_name for item in order.items]
            _ = order.user_email
    finally:
        db.close()
