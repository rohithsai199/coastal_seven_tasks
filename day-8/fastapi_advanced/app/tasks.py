import time
import random
from app.celery_app import celery
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@celery.task(
    bind=True,
    name="app.tasks.process_heavy_report",
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
    retry_backoff=True
)
def process_heavy_report(self, report_name: str, total_items: int) -> dict:
    """
    Simulates a heavy CPU or I/O job: PDF generation, bulk data export, ML inference.
    Demonstrates task progress updates and automatic exponential retries.
    """
    logger.info(f"Starting Task {self.request.id} for report '{report_name}' with {total_items} items.")
    
    for i in range(1, total_items + 1):
        time.sleep(0.5)  # Simulate chunk processing
        # Update progress state accessible via Celery inspect / Flower / polling endpoint
        self.update_state(
            state="PROGRESS",
            meta={"current": i, "total": total_items, "percent": round((i / total_items) * 100, 1)}
        )
    
    # 5% chance of simulated intermittent failure to showcase Celery auto-retry
    if random.random() < 0.05:
        logger.warning("Simulated intermittent error occurred. Triggering auto-retry...")
        raise ConnectionResetError("Remote processing service timed out.")

    logger.info(f"Task {self.request.id} completed successfully.")
    return {
        "status": "COMPLETED",
        "report_name": report_name,
        "processed_count": total_items,
        "download_url": f"https://s3.amazonaws.com/exports/{report_name}.pdf"
    }

@celery.task(name="app.tasks.cleanup_stale_cache_task")
def cleanup_stale_cache_task() -> str:
    """
    Periodic task triggered by Celery Beat every 60 seconds.
    """
    logger.info("Celery Beat Triggered: Cleaning up stale entries and orphaned keys.")
    return "Cleanup routine complete."

@celery.task(name="app.tasks.generate_daily_analytics_report")
def generate_daily_analytics_report() -> str:
    """
    Periodic task triggered by Celery Beat at midnight UTC.
    """
    logger.info("Celery Beat Triggered: Generating daily analytics summary.")
    return "Daily report successfully generated and archived."
