import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, OrderItem, Product, User
from app.schemas import OrderResponse
from app.dependencies import get_current_user
from app.utils.redis_client import get_redis
from app.services.websocket_manager import manager
from app.tasks.email_tasks import send_order_confirmation_email

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    r = Depends(get_redis)
):
    # Retrieve user cart hash directly from Redis
    cart_key = f"cart:{current_user.id}"
    cart_data = r.hgetall(cart_key)
    
    if not cart_data:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Upstash REST returns hash fields/values. Parse items appropriately.
    # Depending on how your cart router stores fields, format them into a list of dicts:
    cart_items = []
    for product_id, quantity in cart_data.items():
        cart_items.append({
            "product_id": int(product_id),
            "quantity": int(quantity)
        })

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total_amount = 0.0
    items_to_create = []

    # Validate stock and calculate total
    for item in cart_items:
        product_id = item.get("product_id")
        quantity = item.get("quantity", 1)

        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        if product.stock < quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        product.stock -= quantity
        total_amount += product.price * quantity
        items_to_create.append({"product_id": product.id, "quantity": quantity, "price": product.price})

    # Create Order record
    new_order = Order(user_id=current_user.id, total_amount=total_amount)
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Create OrderItem records
    for item_data in items_to_create:
        db.add(OrderItem(order_id=new_order.id, **item_data))

    db.commit()
    db.refresh(new_order)

    # Clear caches
    r.delete("products:all")
    r.delete(cart_key)

    # Dispatch Celery background task to send confirmation email
    send_order_confirmation_email.delay(
        recipient_email=current_user.email,
        order_id=new_order.id,
        total_amount=new_order.total_amount
    )

    # Broadcast WebSocket notification
    await manager.send_personal_message(
        f"Order #{new_order.id} created successfully! Total: ${new_order.total_amount:.2f}",
        current_user.id
    )

    return new_order