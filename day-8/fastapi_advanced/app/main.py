from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import engine, Base
from app.routers import async_demo, cache_demo, tasks_demo, integrated

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure PostgreSQL tables are created
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Dispose DB connection pool
    await engine.dispose()

app = FastAPI(
    title="High-Performance Async FastAPI Architecture",
    description="Showcasing Async Python, Redis Caching, Rate Limiting, Celery, and PostgreSQL",
    version="1.0.0",
    lifespan=lifespan
)

# Register Routers
app.include_router(async_demo.router)
app.include_router(cache_demo.router)
app.include_router(tasks_demo.router)
app.include_router(integrated.router)

@app.get("/")
def root():
    return {
        "message": "Advanced FastAPI Architecture is running.",
        "documentation": "/docs"
    }
