import json
import time
from typing import Optional, Any
from redis.asyncio import Redis, ConnectionPool
from fastapi import HTTPException, status
from app.config import settings

pool = ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    max_connections=20,
    protocol=2
)

def get_redis_client() -> Redis:
    return Redis(connection_pool=pool)

class CacheService:
    @staticmethod
    async def get_json(redis: Redis, key: str) -> Optional[Any]:
        data = await redis.get(key)
        if data:
            return json.loads(data)
        return None

    @staticmethod
    async def set_json(redis: Redis, key: str, value: Any, ttl_seconds: int = 60) -> None:
        await redis.setex(key, ttl_seconds, json.dumps(value, default=str))

    @staticmethod
    async def delete_key(redis: Redis, key: str) -> None:
        await redis.delete(key)

class SlidingWindowRateLimiter:
    """
    Sliding Window Counter using Redis Sorted Sets (ZSET).
    Maintains timestamps within the active rolling window and limits request count.
    """
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def check_rate_limit(self, redis: Redis, identifier: str) -> None:
        now = time.time()
        window_start = now - self.window_seconds
        key = f"rate_limit:{identifier}"

        # Atomic transaction pipeline
        async with redis.pipeline(transaction=True) as pipe:
            # 1. Remove expired timestamps older than the sliding window
            pipe.zremrangebyscore(key, 0, window_start)
            # 2. Record current request timestamp
            pipe.zadd(key, {str(now): now})
            # 3. Count remaining elements in the sliding window
            pipe.zcard(key)
            # 4. Set TTL on the set to clean up inactive keys
            pipe.expire(key, self.window_seconds + 1)
            
            results = await pipe.execute()

        request_count = results[2]
        if request_count > self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window_seconds}s."
            )
