from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

def get_user_or_ip_key(request: Request) -> str:
    """
    Extracts authenticated user identifier from JWT for per-user rate limiting.
    Falls back to client IP address for unauthenticated requests.
    """
    # 1. Try Cookie
    cookies = getattr(request, "cookies", None)
    token = None
    if isinstance(cookies, dict):
        token = cookies.get("access_token")

    # 2. Try Authorization header
    if not token:
        headers = getattr(request, "headers", None)
        if isinstance(headers, dict) or hasattr(headers, "get"):
            auth_header = headers.get("Authorization")
            if auth_header and isinstance(auth_header, str) and auth_header.startswith("Bearer "):
                token = auth_header[7:].strip()

    if token:
        try:
            from app.utils.security import decode_access_token
            payload = decode_access_token(token)
            user_identifier = payload.get("sub")
            if user_identifier:
                return f"user:{user_identifier}"
        except Exception:
            pass

    return f"ip:{get_remote_address(request)}"


# Centralized general slowapi limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["120/minute"],
    headers_enabled=False,
)

# Dedicated AI rate limiter keyed by User ID (or IP)
ai_limiter = Limiter(
    key_func=get_user_or_ip_key,
    default_limits=["30/minute"],
    headers_enabled=True,
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    OWASP API Top 10 Hardened 429 response.
    Provides clear error semantics without leaking internal system topologies.
    """
    retry_after = getattr(exc, "retry_after", 60)
    response = JSONResponse(
        status_code=429,
        content={
            "detail": f"Rate limit exceeded: {exc.detail}",
            "error": "too_many_requests",
            "message": "Too many requests. Please slow down and try again later.",
        },
    )
    response.headers["Retry-After"] = str(retry_after)
    return response
