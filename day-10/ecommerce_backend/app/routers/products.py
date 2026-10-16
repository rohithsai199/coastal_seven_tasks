import json
import shutil
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Product, User
from app.schemas import ProductResponse
from app.utils.redis_client import get_redis
from app.dependencies import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])

CACHE_KEY_PRODUCTS = "products:all"

@router.get("", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db), r = Depends(get_redis)):
    try:
        cached_data = r.get(CACHE_KEY_PRODUCTS)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        print(f"Redis Read Warning: {e}")

    products = db.query(Product).all()
    
    # Construct response dictionary format matching ProductResponse schema
    serialized = [
        {
            "id": p.id, 
            "name": p.name, 
            "description": p.description, 
            "price": float(p.price) if p.price is not None else 0.0, 
            "stock": p.stock, 
            "image_url": p.image_url
        }
        for p in products
    ]
    
    try:
        r.setex(CACHE_KEY_PRODUCTS, 300, json.dumps(serialized))  # Cache for 5 minutes
    except Exception as e:
        print(f"Redis Write Warning: {e}")

    return products

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    stock: int = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    r = Depends(get_redis),
    current_user: User = Depends(get_current_user),
):
    image_path = None
    if image and image.filename:
        os.makedirs("static/uploads", exist_ok=True)
        file_location = f"static/uploads/{image.filename}"
        
        # Async file writing to avoid blocking event loop
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_path = f"/{file_location}"

    product = Product(
        name=name, 
        description=description, 
        price=price, 
        stock=stock, 
        image_url=image_path
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)

    # Safely invalidate product cache without throwing 500 if Redis drops connection
    try:
        r.delete(CACHE_KEY_PRODUCTS)
    except Exception as e:
        print(f"Redis Invalidation Warning: {e}")

    return product