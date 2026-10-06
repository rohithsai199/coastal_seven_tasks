# Ensure redis-py uses RESP2 (protocol 2) so Windows Redis does not receive unknown HELLO command
import redis.utils
import redis.connection

redis.utils.DEFAULT_RESP_VERSION = 2
redis.connection.DEFAULT_RESP_VERSION = 2

from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks"]
)
celery.set_default()
celery.set_current()

celery.conf.update(
    broker_connection_retry_on_startup=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 min hard limit
    # Periodic Celery Beat Schedule
    beat_schedule={
        "cleanup-stale-data-every-minute": {
            "task": "app.tasks.cleanup_stale_cache_task",
            "schedule": 60.0,  # runs every 60 seconds
        },
        "daily-midnight-report": {
            "task": "app.tasks.generate_daily_analytics_report",
            "schedule": crontab(hour=0, minute=0),
        }
    }
)
