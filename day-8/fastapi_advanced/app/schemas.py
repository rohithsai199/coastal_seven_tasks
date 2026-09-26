from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict, List

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    owner_id: int = 1

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    project_id: int
    assignee_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ProjectOut(ProjectBase):
    id: int
    owner_id: int
    created_at: Optional[datetime] = None
    tasks: Optional[List[TaskOut]] = []
    model_config = ConfigDict(from_attributes=True)

class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str

class IntegratedProjectResponse(BaseModel):
    status: str
    project: Dict[str, Any]
    repository_sync: Dict[str, Any]
    team_metrics: Dict[str, Any]
    celery_background_job: Dict[str, str]
