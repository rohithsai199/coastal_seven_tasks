from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import auth, projects, tasks
from app.database import engine, Base, SessionLocal
from app import models
from app.auth import hash_password

def seed_initial_data():
    db = SessionLocal()
    try:
        # Check if users already exist
        existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not existing_admin:
            admin_user = models.User(
                username="admin",
                email="admin@taskmanager.com",
                hashed_password=hash_password("admin123"),
                role=models.UserRole.ADMIN
            )
            manager_user = models.User(
                username="manager",
                email="manager@taskmanager.com",
                hashed_password=hash_password("manager123"),
                role=models.UserRole.MANAGER
            )
            member_user = models.User(
                username="sanjay",
                email="sanjay@taskmanager.com",
                hashed_password=hash_password("sanjay123"),
                role=models.UserRole.MEMBER
            )
            db.add_all([admin_user, manager_user, member_user])
            db.commit()
            db.refresh(admin_user)
            db.refresh(manager_user)
            db.refresh(member_user)

            # Create sample projects
            project_1 = models.Project(
                name="Coastal React-FastAPI Integration",
                description="Production fullstack implementation featuring React Router v6, Axios interceptors, and JWT authentication.",
                owner_id=admin_user.id
            )
            project_2 = models.Project(
                name="Mobile App API & Client Services",
                description="Cross-platform task tracker sync services and offline state management layer.",
                owner_id=manager_user.id
            )
            db.add_all([project_1, project_2])
            db.commit()
            db.refresh(project_1)
            db.refresh(project_2)

            # Create sample tasks
            sample_tasks = [
                models.Task(
                    title="Configure Axios Request and Response Interceptors",
                    description="Attach Authorization Bearer token automatically and handle 401 Unauthorized token ejection.",
                    status=models.TaskStatus.COMPLETED,
                    project_id=project_1.id,
                    assignee_id=member_user.id
                ),
                models.Task(
                    title="Implement Protected Route with React Router v6",
                    description="Wrap protected routes with authentication verification and role-based guards.",
                    status=models.TaskStatus.IN_PROGRESS,
                    project_id=project_1.id,
                    assignee_id=member_user.id
                ),
                models.Task(
                    title="Design Reusable UI Component Library",
                    description="Build Button, Input, Modal, Badge, and Card components using modern CSS tokens.",
                    status=models.TaskStatus.COMPLETED,
                    project_id=project_1.id,
                    assignee_id=admin_user.id
                ),
                models.Task(
                    title="Connect React Tasks Dashboard to FastAPI Backend",
                    description="Execute authenticated API calls to fetch, create, update, and delete tasks.",
                    status=models.TaskStatus.IN_PROGRESS,
                    project_id=project_1.id,
                    assignee_id=manager_user.id
                ),
                models.Task(
                    title="Add Pagination & Filter Controls for Project Tasks",
                    description="Support dynamic search query, status filtering, and assignee filtering.",
                    status=models.TaskStatus.PENDING,
                    project_id=project_2.id,
                    assignee_id=member_user.id
                )
            ]
            db.add_all(sample_tasks)
            db.commit()
            print("Successfully initialized database tables and seeded default users, projects, and tasks.")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield

app = FastAPI(
    title="Task Management API",
    description="Full Task Management REST API with Auth, RBAC, CRUD, and Pagination",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers matching the reference project structure
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Task Management API",
        "docs": "/docs",
        "status": "healthy"
    }
