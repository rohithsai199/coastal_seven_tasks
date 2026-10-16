"""
Advanced FastAPI Application Package
"""
# Ensure redis-py uses RESP2 (protocol 2) across the entire application
import redis.utils
import redis.connection

redis.utils.DEFAULT_RESP_VERSION = 2
redis.connection.DEFAULT_RESP_VERSION = 2

# Ensure Celery instance is registered as the current app for all @shared_task calls
from app.celery_app import celery

__all__ = ["celery"]
