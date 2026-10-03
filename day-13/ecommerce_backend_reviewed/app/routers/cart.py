from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_user
from app.models import User, Product
from app.database import get_db
from app.schemas import CartQuantityUpdate
from app.utils.redis_client import get_redis

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


def _set_quantity(r, cart_key: str, product: Product, quantity: int):
    if quantity < 1:
        r.hdel(cart_key, str(product.id))
        return 0
    if quantity > product.stock:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity ({quantity}) exceeds available stock ({product.stock})",
        )
    r.hset(cart_key, str(product.id), quantity)
    return quantity


@router.post("/add")
def add_to_cart(
    product_id: int,
    quantity: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    r=Depends(get_redis),
):
    if quantity < 1:
        raise HTTPException(status_code=422, detail="Quantity must be at least 1")
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    cart_key = f"cart:{current_user.id}"
    raw = r.hget(cart_key, str(product_id))
    current_qty = int(raw.decode() if isinstance(raw, bytes) else raw or 0)
    new_qty = _set_quantity(r, cart_key, product, current_qty + quantity)
    return {"message": "Cart updated successfully", "product_id": product_id, "quantity": new_qty}


@router.get("")
def view_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    r=Depends(get_redis),
):
    raw_cart = r.hgetall(f"cart:{current_user.id}") or {}
    items, total, count = [], 0.0, 0
    for prod_id_raw, qty_raw in raw_cart.items():
        prod_id = int(prod_id_raw.decode() if isinstance(prod_id_raw, bytes) else prod_id_raw)
        qty = int(qty_raw.decode() if isinstance(qty_raw, bytes) else qty_raw)
        product = db.query(Product).filter(Product.id == prod_id).first()
        if not product or qty < 1:
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
            "total": item_total,
        })
    return {"cart": items, "item_count": count, "grand_total": total}


@router.patch("/{product_id}")
def update_cart_quantity(
    product_id: int,
    payload: CartQuantityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    r=Depends(get_redis),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    new_qty = _set_quantity(r, f"cart:{current_user.id}", product, payload.quantity)
    return {"product_id": product_id, "quantity": new_qty}


@router.delete("/remove/{product_id}")
def remove_from_cart(
    product_id: int,
    current_user: User = Depends(get_current_user),
    r=Depends(get_redis),
):
    r.hdel(f"cart:{current_user.id}", str(product_id))
    return {"message": f"Product {product_id} removed from cart"}


@router.delete("")
def clear_cart(current_user: User = Depends(get_current_user), r=Depends(get_redis)):
    r.delete(f"cart:{current_user.id}")
    return {"message": "Cart cleared"}
