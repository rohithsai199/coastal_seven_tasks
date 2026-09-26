# Advanced FastAPI: Async, Redis, Celery & PostgreSQL

A complete production-ready application integrated with your PostgreSQL database (`taskdb`) demonstrating:
1. **Async Python**: Event loop, `async def` vs `def`, and `asyncio.gather()` for parallel upstream requests.
2. **Redis Caching**: Cache-aside pattern with TTL, cache invalidation, and atomic sliding-window rate limiting via Redis Sorted Sets (`ZSET`).
3. **Celery Distributed Tasks**: Out-of-process workers, progress updates, exponential backoff retries, and periodic scheduling via **Celery Beat**.
4. **FastAPI BackgroundTasks vs Celery**: In-process memory tasks vs durable distributed queues.
5. **PostgreSQL Integration**: Async SQLAlchemy 2.0 with `asyncpg` connection pooling connected directly to your `taskdb` database.
6. **Monitoring**: Real-time worker monitoring dashboard via **Flower**.

---

## Quick Start in VS Code

### 1. Open Directory
Open this folder in VS Code (`File > Open Folder...`):
`C:\Users\Pardhu\.gemini\antigravity\scratch\fastapi_advanced`

### 2. Virtual Environment
Your virtual environment is already configured in `.\venv`:
```powershell
.\venv\Scripts\Activate.ps1
```

### 3. PostgreSQL & Redis
Both services are already running locally on your Windows machine:
- **PostgreSQL**: Port `5432` (connected to `taskdb` with password `Coastal199`)
- **Redis**: Port `6379` (running as a Windows Service)

---

## Running the Services (Use Split Terminals in VS Code)

Open 4 split terminals in VS Code (`Ctrl + Shift + 5`):

### Terminal 1: FastAPI Web Server
```powershell
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### Terminal 2: Celery Worker
> **Note for Windows**: The `-P solo` flag is required on Windows to prevent process-forking errors.
```powershell
.\venv\Scripts\Activate.ps1
celery -A app.celery_app.celery worker --loglevel=info -P solo
```

### Terminal 3: Celery Beat (Periodic Scheduler)
```powershell
.\venv\Scripts\Activate.ps1
celery -A app.celery_app.celery beat --loglevel=info
```

### Terminal 4: Flower Dashboard (Monitoring)
```powershell
.\venv\Scripts\Activate.ps1
celery -A app.celery_app.celery flower --port=5555
```
- Real-time Worker Dashboard: [http://localhost:5555](http://localhost:5555)

---

## Endpoints Overview

- `GET /async-demo/blocking-bad`: Demonstrates blocking the event loop.
- `GET /async-demo/blocking-good-def`: Safe sync threadpool execution.
- `GET /async-demo/parallel-gather`: Runs 3 simulated external requests concurrently via `asyncio.gather()`.
- `GET /cache-demo/projects/1`: Fetches project `E-Commerce Microservices Migration` from `taskdb`. Demonstrates Redis Cache-Aside + sliding-window rate limit (5 requests / 10s).
- `PUT /cache-demo/projects/1`: Updates project in PostgreSQL and invalidates Redis cache.
- `POST /tasks-demo/in-process-audit`: Lightweight in-process FastAPI `BackgroundTasks`.
- `POST /tasks-demo/heavy-report`: Heavy task dispatched to Celery worker.
- `GET /tasks-demo/celery-status/{task_id}`: Polls task state (`PENDING`, `PROGRESS`, `SUCCESS`).
- `POST /integrated/process-project/1`: Complete pipeline combining rate limiting, cache-aside lookup for Project 1, parallel gathering, Celery report dispatch, and DB audit logging.
