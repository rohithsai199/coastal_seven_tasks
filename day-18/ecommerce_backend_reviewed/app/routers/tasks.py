from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
from fastapi.responses import PlainTextResponse
from celery.result import AsyncResult
from sqlalchemy.orm import Session

from app.tasks.celery_app import celery_app
from app.tasks.invoice_tasks import generate_order_invoice
from app.tasks.csv_tasks import import_products_csv
from app.database import get_db
from app.models import Order, User
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("/{task_id}/status")
def get_task_status(task_id: str):
    """
    Polls the lifecycle and progress of any Celery background task.
    Returns current state, progress percentage (0-100), status description, and results.
    """
    result = AsyncResult(task_id, app=celery_app)

    state = result.state
    response = {
        "task_id": task_id,
        "state": state,
        "progress": 0,
        "status": "Task queued...",
        "result": None,
        "error": None,
    }

    if state == "PENDING":
        response["status"] = "Task is queued and waiting for worker execution..."
        response["progress"] = 5
    elif state == "PROGRESS":
        info = result.info if isinstance(result.info, dict) else {}
        response["progress"] = info.get("percent", 50)
        response["status"] = info.get("status", "Task is in progress...")
        response["current"] = info.get("current", 0)
        response["total"] = info.get("total", 100)
        response["imported"] = info.get("imported", 0)
        response["skipped"] = info.get("skipped", 0)
    elif state == "SUCCESS":
        response["progress"] = 100
        response["status"] = "Task completed successfully!"
        response["result"] = result.result
    elif state == "FAILURE":
        response["progress"] = 0
        error_msg = str(result.info) if result.info else "Task execution failed"
        response["status"] = error_msg
        response["error"] = error_msg
    else:
        response["status"] = f"Current state: {state}"

    return response


@router.post("/generate-invoice/{order_id}", status_code=status.HTTP_202_ACCEPTED)
def trigger_invoice_generation(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Dispatches an asynchronous Celery background task to generate a PDF invoice.
    Accessible to order owner or store admins.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order #{order_id} not found")

    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this order invoice")

    # Dispatch Celery task
    task = generate_order_invoice.delay(order_id)

    return {
        "task_id": task.id,
        "order_id": order_id,
        "state": "PENDING",
        "message": f"Invoice generation task queued for order #{order_id}",
    }


@router.post("/import-csv", status_code=status.HTTP_202_ACCEPTED)
async def trigger_bulk_csv_import(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
):
    """
    Dispatches an asynchronous Celery background task for bulk product CSV import.
    Tracks row-by-row live progress via Celery result backend.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported for bulk import")

    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_str = content_bytes.decode("latin-1")

    if not content_str.strip():
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty")

    task = import_products_csv.delay(content_str)

    return {
        "task_id": task.id,
        "filename": file.filename,
        "state": "PENDING",
        "message": "Bulk product import task queued successfully",
    }


@router.get("/csv-template")
def get_sample_csv_template():
    """
    Provides a pre-filled sample CSV template for admins to test bulk product imports.
    """
    sample_csv = (
        "name,price,stock,description,image_url\n"
        "AuraSound ANC Wireless Earbuds,129.99,45,\"Premium wireless active noise cancelling earbuds with IPX5 waterproof rating and 30hr battery life.\",/static/headphones.jpg\n"
        "Vanguard Ergonomic Mechanical Keyboard,189.50,30,\"Hot-swappable gasket-mounted mechanical keyboard with RGB backlighting and PBT keycaps.\",/static/speaker.jpg\n"
        "TitanPro MagSafe Wireless Power Bank,79.99,60,\"10000mAh magnetic fast charging wireless power bank with foldable kickstand.\",/static/smartwatch.jpg\n"
        "Voyager Minimalist Carry-On Duffel,94.00,25,\"Waterproof Cordura fabric travel bag with shoe compartment and laptop sleeve.\",/static/backpack.jpg\n"
        "HyperGlide Ultra-Light Gaming Mouse,69.99,50,\"58g ultra-lightweight optical gaming mouse with 26000 DPI sensor and optical switches.\",/static/sneakers.jpg\n"
    )
    return PlainTextResponse(
        content=sample_csv,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="products_import_template.csv"'},
    )
