from celery import Celery
from app.config import settings

broker_url = settings.CELERY_BROKER_URL
if broker_url and broker_url.startswith("rediss://") and "ssl_cert_reqs" not in broker_url:
    separator = "&" if "?" in broker_url else "?"
    broker_url = f"{broker_url}{separator}ssl_cert_reqs=CERT_NONE"

backend_url = settings.CELERY_RESULT_BACKEND
if backend_url and backend_url.startswith("rediss://") and "ssl_cert_reqs" not in backend_url:
    separator = "&" if "?" in backend_url else "?"
    backend_url = f"{backend_url}{separator}ssl_cert_reqs=CERT_NONE"

celery_app = Celery(
    "ecommerce_tasks",
    broker=broker_url,
    backend=backend_url,
    include=["app.tasks.email_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Explicitly import task modules so they are always registered when this module is loaded.
# This prevents "Received unregistered task" errors regardless of how the worker is started.
from app.tasks import email_tasks  # noqa: F401, E402