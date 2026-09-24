from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from app.schemas.user import UserResponse


class ProductBase(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    price: float = Field(gt=0, description="Price must be greater than zero")
    stock: int = Field(ge=0, description="Stock cannot be negative")


class ProductCreate(ProductBase):
    @model_validator(mode="after")
    def check_clearance_pricing(self):
        if self.stock == 0 and self.price > 1000:
            raise ValueError("Out of stock luxury products must be explicitly flagged")
        return self


class ProductUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)


class ProductResponse(ProductBase):
    id: int
    owner_id: int
    owner: UserResponse
    created_at: datetime

    model_config = {"from_attributes": True}
    