import json
import hashlib
import time
import logging
from typing import Optional, Dict, Any
from app.utils.redis_client import get_redis

logger = logging.getLogger(__name__)

# Fallback in-memory cache if Redis is temporarily unreachable
_memory_cache: Dict[str, Dict[str, Any]] = {}
_cache_hits = 0
_cache_misses = 0


def _compute_cache_key(namespace: str, params: Dict[str, Any]) -> str:
    """Generates a deterministic SHA-256 key from request namespace and parameters."""
    normalized_params = json.dumps(params, sort_keys=True)
    param_hash = hashlib.sha256(normalized_params.encode("utf-8")).hexdigest()[:16]
    return f"{namespace}:{param_hash}"


def get_cached_ai_response(namespace: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Retrieves cached AI response from Redis (or in-memory cache).
    Returns None if cache miss or expired.
    """
    global _cache_hits, _cache_misses
    key = _compute_cache_key(namespace, params)

    # 1. Try Redis first
    try:
        r = get_redis()
        cached = r.get(key)
        if cached:
            _cache_hits += 1
            if isinstance(cached, str):
                return json.loads(cached)
            return cached
    except Exception as e:
        logger.debug(f"Redis get note for {key}: {e}")

    # 2. Try in-memory fallback
    now = time.time()
    if key in _memory_cache:
        entry = _memory_cache[key]
        if entry["expires_at"] > now:
            _cache_hits += 1
            return entry["data"]
        else:
            del _memory_cache[key]

    _cache_misses += 1
    return None


def set_cached_ai_response(
    namespace: str,
    params: Dict[str, Any],
    data: Dict[str, Any],
    ttl_seconds: int = 1800  # 30 minutes default
) -> bool:
    """
    Caches AI response in Redis with TTL expiration (and mirrors to in-memory fallback).
    """
    key = _compute_cache_key(namespace, params)
    serialized = json.dumps(data)

    # 1. Store in Redis
    try:
        r = get_redis()
        r.setex(key, ttl_seconds, serialized)
    except Exception as e:
        logger.debug(f"Redis set note for {key}: {e}")

    # 2. Store in in-memory fallback
    _memory_cache[key] = {
        "data": data,
        "expires_at": time.time() + ttl_seconds
    }
    return True


def get_ai_cache_stats() -> Dict[str, Any]:
    """Returns AI caching metrics for diagnostics."""
    return {
        "hits": _cache_hits,
        "misses": _cache_misses,
        "memory_entries": len(_memory_cache),
        "hit_ratio": round(_cache_hits / (_cache_hits + _cache_misses), 3) if (_cache_hits + _cache_misses) > 0 else 0.0,
    }
