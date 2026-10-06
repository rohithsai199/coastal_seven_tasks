from fastapi import FastAPI
from app.api.v1.router import api_router

app = FastAPI(
    title="FastAPI Project",  # <--- Changed from settings.PROJECT_NAME
    openapi_url="/api/v1/openapi.json",
)

app.include_router(api_router, prefix="/api/v1")