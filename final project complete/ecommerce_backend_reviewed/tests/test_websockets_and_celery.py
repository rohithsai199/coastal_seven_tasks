import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.ai.governance import AIGovernanceService, FREE_TIER_LIMITS
from app.services.websocket_manager import manager
from app.utils.security import create_access_token

client = TestClient(app)


# ==============================================================================
# 1. AI Cost Governance & $0 Budget Tests
# ==============================================================================

def test_ai_governance_report_unauthorized(client):
    res = client.get("/ai/governance")
    assert res.status_code in (401, 403)


def test_ai_governance_report_endpoint(client, admin_headers):
    res = client.get("/ai/governance", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["budget_target_usd"] == 0.0
    assert data["actual_spend_usd"] == 0.0
    assert data["total_savings_usd"] >= 0.0
    assert "providers_quota" in data
    assert "groq" in data["providers_quota"]
    assert "gemini" in data["providers_quota"]
    assert "mistral" in data["providers_quota"]
    assert data["providers_quota"]["groq"]["daily_limit"] == 14400
    assert data["providers_quota"]["gemini"]["daily_limit"] == 1500
    assert "today_requests" in data["providers_quota"]["groq"]
    assert "remaining_requests" in data["providers_quota"]["groq"]


def test_ai_governance_record_usage():
    AIGovernanceService.record_usage(
        provider="groq",
        prompt_tokens=200,
        completion_tokens=300,
        cached=False,
    )
    AIGovernanceService.record_usage(
        provider="groq",
        cached=True,
    )

    report = AIGovernanceService.get_governance_report()
    assert report["total_requests_today"] > 0
    assert report["cache_hits_today"] > 0


# ==============================================================================
# 2. Celery Asynchronous AI Tasks Tests
# ==============================================================================

@patch("app.tasks.ai_tasks.async_reindex_catalogue_task.delay")
def test_celery_async_reindex_task_dispatch(mock_delay, client, admin_headers):
    mock_task = MagicMock()
    mock_task.id = "mock-reindex-task-uuid-1234"
    mock_delay.return_value = mock_task

    res = client.post("/ai/tasks/reindex", headers=admin_headers)
    assert res.status_code == 202
    data = res.json()
    assert data["task_id"] == "mock-reindex-task-uuid-1234"
    assert data["status"] == "PENDING"
    mock_delay.assert_called_once()


@patch("app.tasks.ai_tasks.async_audit_quota_usage_task.delay")
def test_celery_async_quota_audit_task_dispatch(mock_delay, client, admin_headers):
    mock_task = MagicMock()
    mock_task.id = "mock-audit-task-uuid-9999"
    mock_delay.return_value = mock_task

    res = client.post("/ai/tasks/audit-quotas", headers=admin_headers)
    assert res.status_code == 202
    data = res.json()
    assert data["task_id"] == "mock-audit-task-uuid-9999"
    assert data["status"] == "PENDING"
    mock_delay.assert_called_once()


@patch("app.tasks.ai_tasks.async_generate_description_task.delay")
def test_celery_async_description_task_dispatch(mock_delay):
    mock_task = MagicMock()
    mock_task.id = "mock-gen-desc-task-uuid-5678"
    mock_delay.return_value = mock_task

    payload = {
        "name": "Titanium Smartwatch Pro",
        "category": "Wearables",
        "features": ["Heart Rate", "GPS"],
        "tone": "tech",
    }
    res = client.post("/ai/tasks/generate-description", json=payload)
    assert res.status_code == 202
    data = res.json()
    assert data["task_id"] == "mock-gen-desc-task-uuid-5678"
    assert data["status"] == "PENDING"
    mock_delay.assert_called_once()


# ==============================================================================
# 3. Real-Time Order Tracking & WebSocket Notification Tests
# ==============================================================================

@patch.object(manager, "send_personal_message")
def test_orders_advance_status_triggers_websocket(mock_ws, client, auth_headers, test_db):
    from app.models import Order, User
    from decimal import Decimal

    user = test_db.query(User).filter(User.email == "testuser@example.com").first()
    order = Order(user_id=user.id, total_amount=Decimal("99.99"), status="PENDING")
    test_db.add(order)
    test_db.commit()
    test_db.refresh(order)

    # Advance stage: PENDING -> PROCESSING
    res = client.post(f"/orders/{order.id}/advance-status", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PROCESSING"

    # Verify WebSocket message was dispatched
    mock_ws.assert_called()
    call_args = mock_ws.call_args[0]
    payload = call_args[0]
    assert payload["type"] == "order.status.updated"
    assert payload["order_id"] == order.id
    assert payload["status"] == "PROCESSING"


@patch.object(manager, "send_personal_message")
def test_orders_cancel_triggers_websocket(mock_ws, client, auth_headers, test_db):
    from app.models import Order, User
    from decimal import Decimal

    user = test_db.query(User).filter(User.email == "testuser@example.com").first()
    order = Order(user_id=user.id, total_amount=Decimal("49.99"), status="PENDING")
    test_db.add(order)
    test_db.commit()
    test_db.refresh(order)

    res = client.patch(f"/orders/{order.id}/cancel", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "CANCELLED"

    mock_ws.assert_called()
    call_args = mock_ws.call_args[0]
    payload = call_args[0]
    assert payload["type"] == "order.status.updated"
    assert payload["order_id"] == order.id
    assert payload["status"] == "CANCELLED"
