from upstash_redis import Redis
from app.config import settings

redis_client = None

if settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN:
    try:
        redis_client = Redis(
            url=settings.UPSTASH_REDIS_REST_URL,
            token=settings.UPSTASH_REDIS_REST_TOKEN,
        )
    except Exception:
        redis_client = None


class DummyRedis:
    """Safe fallback Redis client that gracefully handles missing cache connections."""
    def get(self, *args, **kwargs):
        return None

    def set(self, *args, **kwargs):
        pass

    def delete(self, *args, **kwargs):
        pass


def get_redis():
    if redis_client is None:
        return DummyRedis()
    return redis_client
