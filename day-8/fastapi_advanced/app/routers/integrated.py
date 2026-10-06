import asyncio
from typing import Dict, Any
from fastapi import APIRouter, Depends, Request, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis

from app.database import get_db
from app.models import Project, ProcessingAuditLog
from app.redis_client import get_redis_client, CacheService, SlidingWindowRateLimiter
from app.celery_app import celery
from app.tasks import process_heavy_report
from app.schemas import IntegratedProjectResponse

router = APIRouter(prefix="/integrated", tags=["Final Integrated Pipeline"])

rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)

async def persist_audit_log(task_id: str, action: str, details: str, db: AsyncSession):
    audit = ProcessingAuditLog(task_id=task_id, action=action, details=details)
    db.add(audit)
    await db.commit()

async def mock_repo_sync_api(project_name: str) -> Dict[str, Any]:
    await asyncio.sleep(0.5)  # Simulated upstream API latency
    return {
        "repository": f"github.com/org/{project_name.lower().replace(' ', '-')}",
        "commits_ahead": 14,
        "ci_status": "PASSED",
        "branch": "main"
    }

async def mock_team_velocity_api(project_id: int) -> Dict[str, Any]:
    await asyncio.sleep(0.4)  # Simulated upstream API latency
    return {
        "project_id": project_id,
        "sprint_velocity": 42.5,
        "open_blockers": 0,
        "completion_rate": "87%"
    }

@router.post("/process-project/{project_id}", response_model=IntegratedProjectResponse)
async def full_integrated_project_pipeline(
    project_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client)
):
    # 1. Sliding-Window Rate Limiting
    client_ip = request.client.host if request.client else "127.0.0.1"
    await rate_limiter.check_rate_limit(redis, identifier=f"{client_ip}:project_pipeline")

    # 2. Redis Cache-Aside for Project Data
    cache_key = f"project:{project_id}"
    project_data = await CacheService.get_json(redis, cache_key)
    
    if not project_data:
        # Cache Miss: Query PostgreSQL
        res = await db.execute(select(Project).where(Project.id == project_id))
        project = res.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project with ID {project_id} not found in database.")
        
        project_data = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "owner_id": project.owner_id,
            "created_at": project.created_at.isoformat() if project.created_at else None
        }
        await CacheService.set_json(redis, cache_key, project_data, ttl_seconds=120)

    # 3. Parallel Upstream Calls via asyncio.gather()
    repo_sync, team_metrics = await asyncio.gather(
        mock_repo_sync_api(project_data["name"]),
        mock_team_velocity_api(project_id)
    )

    # 4. Celery Task Dispatch for Heavy Report / PDF Generation
    celery_task = process_heavy_report.delay(
        report_name=f"Executive_Summary_{project_data['name'].replace(' ', '_')}",
        total_items=6
    )

    # 5. In-process FastAPI BackgroundTasks for local audit logging
    background_tasks.add_task(
        persist_audit_log,
        task_id=celery_task.id,
        action="PROJECT_PROCESSED",
        details=f"Processed Project '{project_data['name']}' with Celery task {celery_task.id}",
        db=db
    )

    return {
        "status": "SUCCESS",
        "project": project_data,
        "repository_sync": repo_sync,
        "team_metrics": team_metrics,
        "celery_background_job": {
            "task_id": celery_task.id,
            "status_url": f"/tasks-demo/celery-status/{celery_task.id}"
        }
    }
