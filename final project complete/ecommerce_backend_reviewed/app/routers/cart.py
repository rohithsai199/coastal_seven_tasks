from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.dependencies import get_current_user
from app.models import User, Product
from app.database import get_db
from app.schemas import CartQuantityUpdate
from app.utils.redis_client import get_redis
from app.utils.rate_limiter import limiter

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


@router.post("/add")
@limiter.limit("60/minute")
def add_to_cart(
    request: Request,
    product_id: int,
    quantity: int = 1,
    size: str = "M",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    r=Depends(get_redis),
):
    if quantity < 1:
        raise HTTPException(status_code=422, detail="Quantity must be at least 1")
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    clean_size = (size or "M").strip().upper()
    cart_key = f"cart:{current_user.id}"
    cart_field = f"{product_id}:{clean_size}"

    raw = r.hget(cart_key, cart_field)
    if raw is None and clean_size == "M":
        raw = r.hget(cart_key, str(product_id))
        if raw is not None:
            r.hdel(cart_key, str(product_id))

    current_qty = int(raw.decode() if isinstance(raw, bytes) else raw or 0)
    total_requested = current_qty + quantity
    if total_requested > product.stock:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity ({total_requested}) exceeds available stock ({product.stock})",
        )
    r.hset(cart_key, cart_field, total_requested)
    return {
        "message": "Cart updated successfully",
        "product_id": product_id,
        "quantity": total_requested,
        "size": clean_size,
    }


@router.get("")
@limiter.limit("60/minute")
def view_cart(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    r=Depends(get_redis),
):
    raw_cart = r.hgetall(f"cart:{current_user.id}") or {}
    items, total, count = [], 0.0, 0
    for field_raw, qty_raw in raw_cart.items():
        field_str = field_raw.decode() if isinstance(field_raw, bytes) else str(field_raw)
        qty = int(qty_raw.decode() if isinstance(qty_raw, bytes) else qty_raw)
        if qty < 1:
            continue

        if ":" in field_str:
            parts = field_str.split(":", 1)
            try:
                prod_id = int(parts[0])
            except ValueError:
                continue
            size = parts[1]
        else:
            try:
                prod_id = int(field_str)
            except ValueError:
                continue
            size = "M"

        product = db.query(Product).filter(Product.id == prod_id).first()
        if not product:
            continue
        item_total = float(product.price) * qty
        total += item_total
        count += qty
        items.append({
            "product_id": product.id,
            "name": product.name,
            "price": float(product.price),
            "image_url": product.image_url,
            "quantity": qty,
            "size": size,
            "total": item_total,
        })
    return {"cart": items, "item_count": count, "grand_total": total}


@router.patch("/{product_id}")
def update_cart_quantity(
    product_id: int,
    payload: CartQuantityUpdate,
    size: str = "M",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    r=Depends(get_redis),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    clean_size = (payload.size or size or "M").strip().upper()
    cart_key = f"cart:{current_user.id}"
    cart_field = f"{product_id}:{clean_size}"

    if payload.quantity < 1:
        r.hdel(cart_key, cart_field)
        r.hdel(cart_key, str(product_id))
        return {"product_id": product_id, "quantity": 0, "size": clean_size}

    if payload.quantity > product.stock:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity ({payload.quantity}) exceeds available stock ({product.stock})",
        )

    r.hset(cart_key, cart_field, payload.quantity)
    return {"product_id": product_id, "quantity": payload.quantity, "size": clean_size}


@router.delete("/remove/{product_id}")
def remove_from_cart(
    product_id: int,
    size: str = None,
    current_user: User = Depends(get_current_user),
    r=Depends(get_redis),
):
    cart_key = f"cart:{current_user.id}"
    if size:
        r.hdel(cart_key, f"{product_id}:{size.strip().upper()}")
    else:
        raw_cart = r.hgetall(cart_key) or {}
        for k in list(raw_cart.keys()):
            k_str = k.decode() if isinstance(k, bytes) else str(k)
            if k_str == str(product_id) or k_str.startswith(f"{product_id}:"):
                r.hdel(cart_key, k)
    return {"message": f"Product {product_id} removed from cart"}


@router.delete("")
def clear_cart(current_user: User = Depends(get_current_user), r=Depends(get_redis)):
    r.delete(f"cart:{current_user.id}")
    return {"message": "Cart cleared"}

