import gzip
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.rate_limiter import limiter


def test_owasp_security_headers(client):
    """Verify OWASP recommended security headers are injected into API responses."""
    res = client.get("/health")
    assert res.status_code == 200
    headers = res.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert "strict-transport-security" in headers
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "content-security-policy" in headers
    assert "default-src 'self'" in headers["content-security-policy"]
    assert "permissions-policy" in headers


def test_response_compression_gzip(client):
    """Verify GZipMiddleware compresses response payloads >= 1000 bytes when requested."""
    # /openapi.json is well above 1000 bytes
    res = client.get("/openapi.json", headers={"Accept-Encoding": "gzip"})
    assert res.status_code == 200
    assert res.headers.get("content-encoding") == "gzip"

    # HTTPX transparently decodes gzipped body for caller
    assert "openapi" in res.text


def test_rate_limiting_slowapi(client):
    """Verify slowapi rate limiting triggers HTTP 429 when threshold is exceeded."""
    # Ensure rate limiting is enabled during test
    limiter.enabled = True

    try:
        # Call a rate-limited endpoint repeatedly until it triggers 429 or succeeds within limits
        responses = []
        for _ in range(35):
            r = client.post(
                "/auth/login",
                data={"username": "nonexistent@example.com", "password": "WrongPassword123"},
            )
            responses.append(r.status_code)
            if r.status_code == 429:
                break

        assert 429 in responses, "Expected 429 Too Many Requests after rapid consecutive requests"

        # Find the 429 response and verify headers and body structure
        blocked_response = next(r for r in [client.post(
            "/auth/login",
            data={"username": "nonexistent@example.com", "password": "WrongPassword123"},
        )] if r.status_code == 429)
        data = blocked_response.json()
        assert "error" in data or "detail" in data
        assert "Retry-After" in blocked_response.headers or "retry-after" in blocked_response.headers
    finally:
        limiter.reset()
