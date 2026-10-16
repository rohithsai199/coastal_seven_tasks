from fastapi import FastAPI
from app.routers import auth, projects, tasks

app = FastAPI(
    title="Task Management API",
    description="Full Task Management REST API with Auth, RBAC, CRUD, and Pagination",
    version="1.0.0"
)

# Register routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Task Management API"}