import asyncio
from fastapi import APIRouter, BackgroundTasks
from celery.result import AsyncResult
from app.celery_app import celery
from app.tasks import process_heavy_report
from app.schemas import TaskResponse

router = APIRouter(prefix="/tasks-demo", tags=["BackgroundTasks vs Celery"])

# 1. FastAPI BackgroundTasks Demo (In-Process)
async def log_audit_in_background(user_email: str, action: str):
    await asyncio.sleep(1.0)  # Simulates lightweight DB or analytics write
    print(f"[AUDIT LOG - BackgroundTasks]: User {user_email} performed {action}")

@router.post("/in-process-audit")
async def trigger_in_process_audit(email: str, background_tasks: BackgroundTasks):
    """
    FastAPI BackgroundTasks: Lightweight, in-process task execution.
    Runs in the event loop / threadpool. Ideal for non-critical logging & metrics.
    """
    background_tasks.add_task(log_audit_in_background, email, "VIEW_DASHBOARD")
    return {"status": "accepted", "message": "Audit task queued in-process"}


# 2. Celery Distributed Task Demo (Out-of-Process)
@router.post("/heavy-report", response_model=TaskResponse)
async def trigger_celery_report(report_name: str, count: int = 10):
    """
    Celery: Offloads heavy computation to independent Celery worker processes.
    Task is queued in Redis broker and survives API server crashes.
    """
    task = process_heavy_report.delay(report_name=report_name, total_items=count)
    return TaskResponse(
        task_id=task.id,
        status="QUEUED",
        message="Heavy task successfully dispatched to Celery worker."
    )

@router.get("/celery-status/{task_id}")
async def get_celery_task_status(task_id: str):
    """
    Polls task status from Celery Result Backend (Redis).
    """
    res = AsyncResult(task_id, app=celery)
    response_data = {
        "task_id": task_id,
        "state": res.state,  # PENDING, STARTED, PROGRESS, SUCCESS, FAILURE, RETRY
    }

    if res.state == "PROGRESS":
        response_data["meta"] = res.info
    elif res.state == "SUCCESS":
        response_data["result"] = res.result
    elif res.state == "FAILURE":
        response_data["error"] = str(res.info)

    return response_data
