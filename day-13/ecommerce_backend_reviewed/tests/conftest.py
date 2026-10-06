import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.utils.redis_client import get_redis

# ---------------------------------------------------------------------------
# Test database – use SQLite so tests never touch Postgres
# ---------------------------------------------------------------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def mock_redis():
    """In-memory dict-based Redis mock so tests never call Upstash."""
    store: dict = {}

    r = MagicMock()

    def hset(key, field, value):
        store.setdefault(key, {})[str(field)] = str(value)

    def hget(key, field):
        return store.get(key, {}).get(str(field))

    def hgetall(key):
        return store.get(key, {})

    def hdel(key, *fields):
        for f in fields:
            store.get(key, {}).pop(str(f), None)

    def delete(*keys):
        for k in keys:
            store.pop(k, None)

    def get(key):
        return store.get(key)

    def setex(key, ttl, value):
        store[key] = value

    r.hset.side_effect = hset
    r.hget.side_effect = hget
    r.hgetall.side_effect = hgetall
    r.hdel.side_effect = hdel
    r.delete.side_effect = delete
    r.get.side_effect = get
    r.setex.side_effect = setex

    return r


@pytest.fixture(scope="module")
def client(test_db, mock_redis):
    def _get_test_db():
        try:
            yield test_db
        finally:
            pass

    def _get_mock_redis():
        return mock_redis

    app.dependency_overrides[get_db] = _get_test_db
    app.dependency_overrides[get_redis] = _get_mock_redis

    # Run Celery tasks eagerly (synchronously) in tests
    with patch("app.tasks.email_tasks.send_order_confirmation_email.delay") as mock_delay:
        mock_delay.return_value = MagicMock(id="test-task-id")
        with TestClient(app) as c:
            yield c

    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def auth_headers(client):
    """Register + login and return Bearer auth headers."""
    client.post("/auth/signup", json={"email": "testuser@example.com", "password": "TestPass123"})
    res = client.post("/auth/login", data={"username": "testuser@example.com", "password": "TestPass123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_headers(client):
    """Register an admin user and return Bearer auth headers."""
    client.post("/auth/signup", json={"email": "admin@example.com", "password": "AdminPass123"})
    from app.models import User
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        user.role = "admin"
        db.commit()
    finally:
        db.close()
    res = client.post("/auth/login", data={"username": "admin@example.com", "password": "AdminPass123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def sample_product(client, auth_headers):
    """Create and return a sample product for use in tests."""
    res = client.post(
        "/products",
        data={"name": "Test Laptop", "description": "A test laptop", "price": "50000", "stock": "10"},
        headers=auth_headers,
    )
    return res.json()