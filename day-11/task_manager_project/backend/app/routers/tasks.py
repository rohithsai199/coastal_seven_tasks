from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app import schemas, models, auth
from app.database import get_db

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def format_task_response(task: models.Task) -> schemas.TaskResponse:
    assignee_name = task.assignee.username if task.assignee else None
    proj_name = task.project.name if task.project else None
    return schemas.TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        due_date=task.due_date,
        project_id=task.project_id,
        assignee_id=task.assignee_id,
        assignee_username=assignee_name,
        project_name=proj_name
    )

@router.post("/project/{project_id}", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: int,
    task_in: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles([models.UserRole.ADMIN, models.UserRole.MANAGER]))
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = models.Task(**task_in.dict(), project_id=project_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return format_task_response(task)

@router.get("/", response_model=List[schemas.TaskResponse])
def list_tasks(
    status: Optional[models.TaskStatus] = None,
    assignee_id: Optional[int] = None,
    project_id: Optional[int] = None,
    due_date: Optional[datetime] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Task)
    
    if status:
        query = query.filter(models.Task.status == status)
    if assignee_id:
        query = query.filter(models.Task.assignee_id == assignee_id)
    if project_id:
        query = query.filter(models.Task.project_id == project_id)
    if due_date:
        query = query.filter(models.Task.due_date <= due_date)
    if search:
        query = query.filter(models.Task.title.ilike(f"%{search}%"))

    tasks = query.offset(skip).limit(limit).all()
    return [format_task_response(t) for t in tasks]

@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return format_task_response(task)

@router.patch("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Access check: Members can only update tasks assigned to them or update task status
    if current_user.role == models.UserRole.MEMBER and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this task")

    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return format_task_response(task)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles([models.UserRole.ADMIN, models.UserRole.MANAGER]))
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None
