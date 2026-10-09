import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, products, cart, orders, chat, tasks
from app.services.websocket_manager import manager
from app.config import settings
from app.models import User, Order
from jose import JWTError
from app.utils.security import decode_access_token
from app.dependencies import ACCESS_TOKEN_COOKIE

Base.metadata.create_all(bind=engine)
os.makedirs("static/invoices", exist_ok=True)
os.makedirs("static/uploads", exist_ok=True)

app = FastAPI(title=settings.PROJECT_NAME, version="2.0.0")

origins = [x.strip() for x in settings.ALLOWED_ORIGINS.split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(chat.router)
app.include_router(tasks.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws/orders")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    token = websocket.cookies.get(ACCESS_TOKEN_COOKIE) or websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
        if not email:
            await websocket.close(code=1008)
            return
        from app.database import SessionLocal
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                await websocket.close(code=1008)
                return
            user_id = user.id
    except Exception:
        await websocket.close(code=1008)
        return

    await manager.connect(user_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        manager.disconnect(user_id, websocket)


@app.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    token = websocket.cookies.get(ACCESS_TOKEN_COOKIE) or websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
        if not email:
            await websocket.close(code=1008)
            return

        from app.database import SessionLocal
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                await websocket.close(code=1008)
                return
            user_id = user.id
    except Exception:
        await websocket.close(code=1008)
        return

    await manager.connect(user_id, websocket)

    try:
        while True:
            try:
                message = await websocket.receive_json()

                recipient_id = message.get("recipient_id")
                text = message.get("message")
                order_id = message.get("order_id")

                if not recipient_id or not isinstance(text, str) or not text.strip():
                    continue

                text = text.strip()[:2000]

                from app.models import ChatMessage
                with SessionLocal() as db:
                    recipient = db.query(User).filter(User.id == int(recipient_id)).first()
                    if not recipient:
                        continue

                    normalized_order_id = int(order_id) if order_id else None
                    if normalized_order_id is not None:
                        order = db.query(Order).filter(Order.id == normalized_order_id).first()
                        if not order:
                            continue
                        # Customers may only discuss their own order with an admin.
                        # Admins may only discuss an order with that order's customer.
                        if user_id == order.user_id:
                            if recipient.role != "admin":
                                continue
                        else:
                            sender = db.query(User).filter(User.id == user_id).first()
                            if not sender or sender.role != "admin" or recipient.id != order.user_id:
                                continue

                    new_msg = ChatMessage(
                        sender_id=user_id,
                        recipient_id=int(recipient_id),
                        order_id=normalized_order_id,
                        message=text,
                    )
                    db.add(new_msg)
                    db.commit()

                await manager.send_personal_message(
                    {
                        "type": "chat.message",
                        "sender_id": user_id,
                        "order_id": normalized_order_id,
                        "message": text,
                    },
                    int(recipient_id),
                )
            except (WebSocketDisconnect, RuntimeError):
                break
            except Exception as e:
                print("Error in websocket loop:", repr(e))

    finally:
        manager.disconnect(user_id, websocket)
