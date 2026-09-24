from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


async def get_product_by_id(db: AsyncSession, product_id: int) -> Product | None:
    result = await db.execute(select(Product).filter(Product.id == product_id))
    return result.scalars().first()


async def get_products(db: AsyncSession, skip: int = 0, limit: int = 100) -> Sequence[Product]:
    result = await db.execute(select(Product).offset(skip).limit(limit))
    return result.scalars().all()


async def create_product(db: AsyncSession, obj_in: ProductCreate, owner_id: int) -> Product:
    db_obj = Product(
        title=obj_in.title,
        description=obj_in.description,
        price=obj_in.price,
        stock=obj_in.stock,
        owner_id=owner_id,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update_product(
    db: AsyncSession, db_obj: Product, obj_in: ProductUpdate | dict
) -> Product:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def delete_product(db: AsyncSession, product_id: int) -> Product | None:
    db_obj = await get_product_by_id(db, product_id)
    if db_obj:
        await db.delete(db_obj)
        await db.commit()
    return db_obj