import os
from fastapi import FastAPI, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

from app.upload import process_and_save_image
from app.websocket import manager

app = FastAPI(title="Real-Time Upload Service")

os.makedirs("app/static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.post("/upload")
async def upload_file(file: UploadFile):
    image_url = await process_and_save_image(file)
    await manager.broadcast(f"NOTIFICATION: New image uploaded at {image_url}")
    return {"url": image_url, "status": "success"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
