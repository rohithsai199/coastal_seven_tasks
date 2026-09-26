from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis

from app.database import get_db
from app.models import Project
from app.schemas import ProjectOut, ProjectCreate, ProjectUpdate
from app.redis_client import get_redis_client, CacheService, SlidingWindowRateLimiter

router = APIRouter(prefix="/cache-demo", tags=["Redis Caching & Rate Limiting"])

# Rate limit rule: 5 requests per 10 seconds per IP
rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=10)

@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    project = Project(
        name=payload.name,
        description=payload.description,
        owner_id=payload.owner_id
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project

@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project_cache_aside(
    project_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client)
):
    # 1. Enforce Sliding-Window Rate Limiting
    client_ip = request.client.host if request.client else "127.0.0.1"
    await rate_limiter.check_rate_limit(redis, identifier=f"{client_ip}:projects")

    # 2. Cache-Aside Pattern
    cache_key = f"project:{project_id}"
    cached_data = await CacheService.get_json(redis, cache_key)
    if cached_data:
        # Cache Hit: Returns without touching PostgreSQL
        return cached_data

    # Cache Miss: Query PostgreSQL
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Store in Redis with a 60-second TTL
    project_dict = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "owner_id": project.owner_id,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "tasks": []
    }
    await CacheService.set_json(redis, cache_key, project_dict, ttl_seconds=60)
    return project_dict

@router.put("/projects/{project_id}", response_model=ProjectOut)
async def update_project_with_invalidation(
    project_id: int,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client)
):
    # Fetch from PostgreSQL
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update DB fields if provided
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
        
    await db.commit()
    await db.refresh(project)

    # Invalidate Cache immediately to avoid stale data
    cache_key = f"project:{project_id}"
    await CacheService.delete_key(redis, cache_key)

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "owner_id": project.owner_id,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "tasks": []
    }
