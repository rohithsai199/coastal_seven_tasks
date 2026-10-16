from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    price: float = Field(ge=0)
    stock: int = Field(ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)


class ProductResponse(ProductBase):
    id: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class CartItemResponse(BaseModel):
    product_id: int
    name: str
    price: float
    image_url: Optional[str] = None
    quantity: int
    total: float


class CartResponse(BaseModel):
    cart: List[CartItemResponse]
    item_count: int
    grand_total: float


class CartQuantityUpdate(BaseModel):
    quantity: int = Field(ge=1)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    product_name: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    total_amount: float
    status: str
    created_at: Optional[datetime] = None
    shipping_name: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    # Payment is deliberately not faked here. Add a payment-provider intent
    # before marking an order as PAID.
    shipping_name: str = Field(min_length=1, max_length=120)
    shipping_phone: str = Field(min_length=5, max_length=30)
    shipping_address: str = Field(min_length=5, max_length=500)
    shipping_city: str = Field(min_length=1, max_length=100)
    shipping_state: str = Field(min_length=1, max_length=100)
    shipping_postal_code: str = Field(min_length=3, max_length=20)
    
class ChatMessageResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    order_id: int | None = None
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True
