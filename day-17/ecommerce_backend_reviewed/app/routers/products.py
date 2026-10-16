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


from sqlalchemy import func, case, or_, text
from app.tasks.csv_tasks import import_products_csv


@router.get("", response_model=List[ProductResponse])
def get_products(
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    in_stock: bool = False,
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc|name|relevance)$"),
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
    relevance_expr = None

    if q:
        is_postgres = db.bind is not None and getattr(db.bind.dialect, "name", "") == "postgresql"

        if is_postgres:
            # 1. PostgreSQL Full-Text Search using tsvector (with GIN index)
            # 2. pg_trgm for typo-tolerant fuzzy matching (similarity & word_similarity)
            # 3. Dynamic relevance ranking
            clean_q = q.strip()
            exact_match_score = case((Product.name.ilike(f"%{clean_q}%"), 10.0), else_=0.0)
            fts_score = func.coalesce(
                func.ts_rank(
                    func.to_tsvector("english", Product.name + " " + func.coalesce(Product.description, "")),
                    func.plainto_tsquery("english", clean_q),
                ),
                0.0,
            ) * 6.0
            fuzzy_name_score = func.coalesce(func.word_similarity(clean_q, Product.name), 0.0) * 4.0
            fuzzy_desc_score = func.coalesce(
                func.word_similarity(clean_q, func.coalesce(Product.description, "")),
                0.0,
            ) * 2.0

            relevance_expr = exact_match_score + fts_score + fuzzy_name_score + fuzzy_desc_score

            fts_match = func.to_tsvector(
                "english", Product.name + " " + func.coalesce(Product.description, "")
            ).op("@@")(func.plainto_tsquery("english", clean_q))

            fuzzy_match = or_(
                func.word_similarity(clean_q, Product.name) >= 0.3,
                func.similarity(Product.name, clean_q) >= 0.15,
                func.word_similarity(clean_q, func.coalesce(Product.description, "")) >= 0.35,
            )
            exact_match = or_(
                Product.name.ilike(f"%{clean_q}%"),
                Product.description.ilike(f"%{clean_q}%"),
            )

            query = query.filter(or_(fts_match, fuzzy_match, exact_match))
        else:
            # Fallback for SQLite in test suite
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
    elif (sort == "relevance" or (sort == "newest" and q)) and relevance_expr is not None:
        query = query.order_by(relevance_expr.desc(), Product.id.desc())
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


@router.post("/bulk-import-csv", status_code=status.HTTP_202_ACCEPTED)
async def bulk_import_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
):
    """
    Triggers Celery background task for bulk product CSV import.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_str = content_bytes.decode("latin-1")

    task = import_products_csv.delay(content_str)
    return {
        "task_id": task.id,
        "filename": file.filename,
        "message": "Bulk product import queued successfully",
    }


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
        allowed = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
        ext = os.path.splitext(image.filename)[1].lower()
        if ext not in allowed or image.content_type != allowed[ext]:
            raise HTTPException(status_code=400, detail="Unsupported image type")

        max_size = 5 * 1024 * 1024
        content = image.file.read(max_size + 1)
        if len(content) > max_size:
            raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")
        if ext == ".png" and not content.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(status_code=400, detail="Invalid PNG file")
        if ext in {".jpg", ".jpeg"} and not content.startswith(b"\xff\xd8\xff"):
            raise HTTPException(status_code=400, detail="Invalid JPEG file")
        if ext == ".webp" and not (content[:4] == b"RIFF" and content[8:12] == b"WEBP"):
            raise HTTPException(status_code=400, detail="Invalid WebP file")

        os.makedirs("static/uploads", exist_ok=True)
        safe_name = f"{os.urandom(8).hex()}{ext}"
        file_location = os.path.join("static", "uploads", safe_name)
        with open(file_location, "wb") as buffer:
            buffer.write(content)
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
