from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_current_user
from app.models import User, Product
from app.database import get_db
from app.utils.redis_client import get_redis

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])

@router.post("/add")
def add_to_cart(
    product_id: int, 
    quantity: int = 1, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db), 
    r = Depends(get_redis)
):
    # 1. Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cart_key = f"cart:{current_user.id}"

    try:
        # 2. Fetch current quantity safely
        current_qty_raw = r.hget(cart_key, str(product_id))
        
        # Decode bytes if needed (Upstash sometimes returns bytes)
        if isinstance(current_qty_raw, bytes):
            current_qty_raw = current_qty_raw.decode("utf-8")
            
        current_qty = int(current_qty_raw) if current_qty_raw else 0
        new_qty = current_qty + quantity

        # 3. Check stock constraint
        if new_qty > product.stock:
            raise HTTPException(
                status_code=400, 
                detail=f"Requested quantity ({new_qty}) exceeds available stock ({product.stock})"
            )

        # 4. Save to Redis
        r.hset(cart_key, str(product_id), new_qty)
        return {
            "message": "Cart updated successfully", 
            "product_id": product_id, 
            "quantity": new_qty
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Redis Cart Error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to update cart due to background Redis issue"
        )


@router.get("")
def view_cart(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db), 
    r = Depends(get_redis)
):
    cart_key = f"cart:{current_user.id}"

    try:
        raw_cart = r.hgetall(cart_key)
    except Exception as e:
        print(f"Redis Cart Fetch Error: {e}")
        raw_cart = {}

    items = []
    total = 0.0

    for prod_id_raw, qty_raw in raw_cart.items():
        # Decode bytes if Upstash returns byte strings
        prod_id_str = prod_id_raw.decode("utf-8") if isinstance(prod_id_raw, bytes) else str(prod_id_raw)
        qty_str = qty_raw.decode("utf-8") if isinstance(qty_raw, bytes) else str(qty_raw)

        product = db.query(Product).filter(Product.id == int(prod_id_str)).first()
        if product:
            qty = int(qty_str)
            item_total = float(product.price) * qty
            total += item_total
            items.append({
                "product_id": product.id, 
                "name": product.name, 
                "price": float(product.price), 
                "quantity": qty, 
                "total": item_total
            })

    return {"cart": items, "grand_total": total}


@router.delete("/remove/{product_id}")
def remove_from_cart(
    product_id: int, 
    current_user: User = Depends(get_current_user), 
    r = Depends(get_redis)
):
    cart_key = f"cart:{current_user.id}"
    try:
        r.hdel(cart_key, str(product_id))
    except Exception as e:
        print(f"Redis Cart Remove Error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to remove item from cart due to background Redis issue"
        )

    return {"message": f"Product {product_id} removed from cart"}