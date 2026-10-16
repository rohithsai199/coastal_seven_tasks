"""
Production Entrypoint for Render / Gunicorn / Uvicorn
Allows executing: uvicorn main:app --host 0.0.0.0 --port $PORT
directly from the ecommerce_backend_reviewed root directory.
"""
from app.main import app

if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
