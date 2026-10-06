import json
import os
import shutil
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product, User
from app.schemas import ProductResponse, ProductUpdate
from app.utils.redis_client import get_redis
from app.dependencies import require_admin

router = APIRouter(prefix="/products", tags=["Products"])
CACHE_KEY_PRODUCTS = "products:all"


def _product_dict(p: Product):
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price": float(p.price),
        "stock": p.stock,
        "image_url": p.image_url,
    }


@router.get("", response_model=List[ProductResponse])
def get_products(
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    in_stock: bool = False,
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc|name)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    # Cache only the unfiltered first page; filtered queries stay DB-backed.
    if not any([q, min_price is not None, max_price is not None, in_stock]) and sort == "newest" and page == 1:
        try:
            from app.utils.redis_client import get_redis
            r = get_redis()
            cached = r.get(CACHE_KEY_PRODUCTS)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    query = db.query(Product)
    if q:
        term = f"%{q}%"
        query = query.filter((Product.name.ilike(term)) | (Product.description.ilike(term)))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if in_stock:
        query = query.filter(Product.stock > 0)

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "name":
        query = query.order_by(Product.name.asc())
    else:
        query = query.order_by(Product.id.desc())

    products = query.offset((page - 1) * page_size).limit(page_size).all()
    serialized = [_product_dict(p) for p in products]

    if not any([q, min_price is not None, max_price is not None, in_stock]) and sort == "newest" and page == 1:
        try:
            from app.utils.redis_client import get_redis
            get_redis().setex(CACHE_KEY_PRODUCTS, 300, json.dumps(serialized))
        except Exception:
            pass
    return serialized


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    stock: int = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    image_path = None
    if image and image.filename:
        allowed = {".jpg", ".jpeg", ".png", ".webp"}
        ext = os.path.splitext(image.filename)[1].lower()
        if ext not in allowed:
            raise HTTPException(status_code=400, detail="Unsupported image type")
        os.makedirs("static/uploads", exist_ok=True)
        safe_name = f"{os.urandom(8).hex()}{ext}"
        file_location = os.path.join("static", "uploads", safe_name)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_path = f"/{file_location.replace(os.sep, '/')}"

    product = Product(name=name, description=description, price=price, stock=stock, image_url=image_path)
    db.add(product)
    db.commit()
    db.refresh(product)
    try:
        from app.utils.redis_client import get_redis
        get_redis().delete(CACHE_KEY_PRODUCTS)
    except Exception:
        pass
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    try:
        from app.utils.redis_client import get_redis
        get_redis().delete(CACHE_KEY_PRODUCTS)
    except Exception:
        pass
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    try:
        from app.utils.redis_client import get_redis
        get_redis().delete(CACHE_KEY_PRODUCTS)
    except Exception:
        pass
