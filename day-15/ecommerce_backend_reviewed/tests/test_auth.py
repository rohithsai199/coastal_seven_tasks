"""
Authentication tests – covers signup, login, duplicate-email guard,
bad-credential rejection, and token-protected endpoint access.
"""
import pytest


# ---------------------------------------------------------------------------
# Signup tests
# ---------------------------------------------------------------------------

class TestSignup:
    def test_signup_success(self, client):
        res = client.post(
            "/auth/signup",
            json={"email": "signup_new@example.com", "password": "Secure123"},
        )
        assert res.status_code == 201
        body = res.json()
        assert body["email"] == "signup_new@example.com"
        assert "id" in body
        assert "role" in body

    def test_signup_default_role_is_customer(self, client):
        res = client.post(
            "/auth/signup",
            json={"email": "customer_role@example.com", "password": "Secure123"},
        )
        assert res.status_code == 201
        assert res.json()["role"] == "customer"

    def test_signup_duplicate_email_rejected(self, client):
        email = "dup_check@example.com"
        client.post("/auth/signup", json={"email": email, "password": "Pass123"})
        res = client.post("/auth/signup", json={"email": email, "password": "Pass456"})
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"].lower()

    def test_signup_invalid_email_format(self, client):
        res = client.post(
            "/auth/signup",
            json={"email": "not-an-email", "password": "Pass123"},
        )
        assert res.status_code == 422  # pydantic validation error

    def test_signup_missing_password(self, client):
        res = client.post("/auth/signup", json={"email": "nopw@example.com"})
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# Login tests
# ---------------------------------------------------------------------------

class TestLogin:
    def test_login_success_returns_token(self, client):
        client.post(
            "/auth/signup",
            json={"email": "login_ok@example.com", "password": "LoginPass1"},
        )
        res = client.post(
            "/auth/login",
            data={"username": "login_ok@example.com", "password": "LoginPass1"},
        )
        assert res.status_code == 200
        body = res.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post(
            "/auth/signup",
            json={"email": "wrong_pw@example.com", "password": "RealPass1"},
        )
        res = client.post(
            "/auth/login",
            data={"username": "wrong_pw@example.com", "password": "WrongPass"},
        )
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        res = client.post(
            "/auth/login",
            data={"username": "ghost@nowhere.com", "password": "Pass123"},
        )
        assert res.status_code == 401

    def test_protected_endpoint_without_token(self, client):
        res = client.get("/cart")
        assert res.status_code == 401

    def test_protected_endpoint_with_valid_token(self, client, auth_headers):
        res = client.get("/cart", headers=auth_headers)
        assert res.status_code == 200