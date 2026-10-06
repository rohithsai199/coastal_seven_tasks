from upstash_redis import Redis
from app.config import settings

redis_client = None

if settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN:
    redis_client = Redis(
        url=settings.UPSTASH_REDIS_REST_URL,
        token=settings.UPSTASH_REDIS_REST_TOKEN,
    )


def get_redis():
    if redis_client is None:
        raise RuntimeError("Redis is not configured")
    return redis_client
