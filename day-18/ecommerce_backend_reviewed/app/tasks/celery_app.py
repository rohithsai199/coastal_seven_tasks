from celery import Celery
from app.config import settings

broker_url = settings.CELERY_BROKER_URL
if broker_url and broker_url.startswith("rediss://") and "ssl_cert_reqs" not in broker_url:
    separator = "&" if "?" in broker_url else "?"
    broker_url = f"{broker_url}{separator}ssl_cert_reqs=CERT_REQUIRED"

backend_url = settings.CELERY_RESULT_BACKEND
if backend_url and backend_url.startswith("rediss://") and "ssl_cert_reqs" not in backend_url:
    separator = "&" if "?" in backend_url else "?"
    backend_url = f"{backend_url}{separator}ssl_cert_reqs=CERT_REQUIRED"

celery_app = Celery(
    "ecommerce_tasks",
    broker=broker_url,
    backend=backend_url,
    include=[
        "app.tasks.email_tasks",
        "app.tasks.invoice_tasks",
        "app.tasks.csv_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Explicitly import task modules so they are always registered when this module is loaded.
from app.tasks import email_tasks  # noqa: F401, E402
from app.tasks import invoice_tasks  # noqa: F401, E402
from app.tasks import csv_tasks  # noqa: F401, E402
