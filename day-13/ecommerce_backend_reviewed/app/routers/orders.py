from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Order, OrderItem, Product, User
from app.schemas import OrderResponse, CheckoutRequest
from app.dependencies import get_current_user, require_admin
from app.utils.redis_client import get_redis
from app.services.websocket_manager import manager
from app.tasks.email_tasks import send_order_confirmation_email

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=List[OrderResponse])
def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

@router.get("/admin/all", response_model=List[OrderResponse])
def admin_list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc()).all()

@router.patch("/admin/{order_id}/status", response_model=OrderResponse)
def admin_update_order_status(
    order_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    allowed = {"PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"}
    if new_status not in allowed:
        raise HTTPException(status_code=422, detail=f"Status must be one of: {', '.join(sorted(allowed))}")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order

@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    r=Depends(get_redis),
):
    cart_key = f"cart:{current_user.id}"
    cart_data = r.hgetall(cart_key) or {}
    if not cart_data:
        raise HTTPException(status_code=400, detail="Cart is empty")

    try:
        cart_items = [
            {
                "product_id": int(pid.decode() if isinstance(pid, bytes) else pid),
                "quantity": int(qty.decode() if isinstance(qty, bytes) else qty),
            }
            for pid, qty in cart_data.items()
        ]

        # Lock rows during stock validation/update to avoid overselling under concurrency.
        total_amount = 0.0
        items_to_create = []
        for item in cart_items:
            if item["quantity"] < 1:
                raise HTTPException(status_code=400, detail="Invalid cart quantity")
            product = (
                db.query(Product)
                .filter(Product.id == item["product_id"])
                .with_for_update()
                .first()
            )
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item['product_id']} not found")
            if product.stock < item["quantity"]:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
            product.stock -= item["quantity"]
            total_amount += float(product.price) * item["quantity"]
            items_to_create.append(
                {"product_id": product.id, "quantity": item["quantity"], "price": product.price}
            )

        order = Order(
            user_id=current_user.id,
            total_amount=total_amount,
            status="PENDING",
            shipping_name=payload.shipping_name,
            shipping_phone=payload.shipping_phone,
            shipping_address=payload.shipping_address,
            shipping_city=payload.shipping_city,
            shipping_state=payload.shipping_state,
            shipping_postal_code=payload.shipping_postal_code,
        )
        db.add(order)
        db.flush()
        for item in items_to_create:
            db.add(OrderItem(order_id=order.id, **item))
        db.commit()
        db.refresh(order)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Checkout failed")

    r.delete(cart_key)
    try:
        r.delete("products:all")
    except Exception:
        pass

    # Email is a confirmation of order placement, not proof of payment.
    try:
        send_order_confirmation_email.delay(
            recipient_email=current_user.email,
            order_id=order.id,
            total_amount=order.total_amount,
        )
    except Exception:
        pass

    await manager.send_personal_message(
        {"type": "order.created", "order_id": order.id, "status": order.status},
        current_user.id,
    )
    return order

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.patch("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in {"PENDING", "PROCESSING"}:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")
    order.status = "CANCELLED"
    db.commit()
    db.refresh(order)
    return order

