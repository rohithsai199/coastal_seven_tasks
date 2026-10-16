import os
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, products, cart, orders, chat, tasks, ai
from app.services.websocket_manager import manager
from app.config import settings
from app.models import User, Order
from jose import JWTError
from app.utils.security import decode_access_token
from app.dependencies import ACCESS_TOKEN_COOKIE

from starlette.middleware.gzip import GZipMiddleware
from slowapi.errors import RateLimitExceeded
from app.utils.rate_limiter import limiter, rate_limit_exceeded_handler
from app.utils.security_headers import SecurityHeadersMiddleware

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database table creation skipped on startup: {e}")

os.makedirs("static/invoices", exist_ok=True)
os.makedirs("static/uploads", exist_ok=True)

app = FastAPI(title=settings.PROJECT_NAME, version="2.0.0")

# Topic 1: API Security & Rate Limiting - Attach slowapi limiter & OWASP 429 handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Topic 1: OWASP Security Headers Hardening Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Topic 2: Response Compression Middleware (compresses responses >= 1000 bytes with gzip)
app.add_middleware(GZipMiddleware, minimum_size=1000)

origins = [x.strip() for x in settings.ALLOWED_ORIGINS.split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
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
app.include_router(ai.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws/orders")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    token = websocket.cookies.get(ACCESS_TOKEN_COOKIE) or websocket.query_params.get("token")
    if not token:
        logger.warning("WebSocket orders rejected: No token found in cookies or query params")
        await websocket.close(code=1008)
        return
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if not sub:
            logger.warning("WebSocket orders rejected: Missing 'sub' claim in token")
            await websocket.close(code=1008)
            return
        from app.database import SessionLocal
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == str(sub)).first()
            if not user and str(sub).isdigit():
                user = db.query(User).filter(User.id == int(sub)).first()
            if not user:
                logger.warning(f"WebSocket orders rejected: User not found for sub='{sub}'")
                await websocket.close(code=1008)
                return
            user_id = user.id
    except Exception as exc:
        logger.warning(f"WebSocket orders auth error ({type(exc).__name__}): {exc}")
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
        logger.warning("WebSocket chat rejected: No token found in cookies or query params")
        await websocket.close(code=1008)
        return

    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if not sub:
            logger.warning("WebSocket chat rejected: Missing 'sub' claim in token")
            await websocket.close(code=1008)
            return

        from app.database import SessionLocal
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == str(sub)).first()
            if not user and str(sub).isdigit():
                user = db.query(User).filter(User.id == int(sub)).first()
            if not user:
                logger.warning(f"WebSocket chat rejected: User not found for sub='{sub}'")
                await websocket.close(code=1008)
                return
            user_id = user.id
    except Exception as exc:
        logger.warning(f"WebSocket chat auth error ({type(exc).__name__}): {exc}")
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

                if not isinstance(text, str) or not text.strip():
                    continue

                text = text.strip()[:2000]

                from app.models import ChatMessage
                with SessionLocal() as db:
                    if not recipient_id:
                        admin_user = db.query(User).filter(User.role == "admin").first()
                        recipient_id = admin_user.id if admin_user else 1

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
                    db.refresh(new_msg)

                    payload = {
                        "type": "chat.message",
                        "id": new_msg.id,
                        "sender_id": user_id,
                        "recipient_id": int(recipient_id),
                        "order_id": normalized_order_id,
                        "message": text,
                        "created_at": new_msg.created_at.isoformat() if new_msg.created_at else None,
                    }

                await manager.send_personal_message(payload, int(recipient_id))
                if int(recipient_id) != user_id:
                    await manager.send_personal_message(payload, user_id)
            except (WebSocketDisconnect, RuntimeError):
                break
            except Exception as e:
                print("Error in websocket loop:", repr(e))

    finally:
        manager.disconnect(user_id, websocket)
