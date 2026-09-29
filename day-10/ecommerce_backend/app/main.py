from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app.routers import auth, products, cart, orders
from app.services.websocket_manager import manager

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="E-Commerce API", version="1.0.0")

# Mount upload directory for images
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)

@app.websocket("/ws/orders/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Order updates subscribed for user {user_id}", user_id)
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)