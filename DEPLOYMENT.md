# Full-Stack Dual-Hosting Deployment Guide: Render (Backend) + Vercel (Frontend)

**Repository:** [https://github.com/rohithsai199/coastal_seven_tasks](https://github.com/rohithsai199/coastal_seven_tasks)

---

## 1. Architecture Overview

```
                                  +------------------------------------+
                                  |       Production End-Users         |
                                  +-----------------+------------------+
                                                    |
                                    HTTPS Requests & WebSocket
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
                         v                                                     v
       +------------------------------------+               +------------------------------------+
       |       Frontend (Static SPA)        |               |       Backend (FastAPI Web)        |
       |       Hosted on: VERCEL            |               |       Hosted on: RENDER            |
       |  URL: *.vercel.app                 | ------------> |  URL: *.onrender.com               |
       |  Env: VITE_API_URL, VITE_WS_URL    |  CORS Enabled |  Port: $PORT                       |
       +------------------------------------+               +------------------------------------+
```

---

## 2. Backend Deployment on Render (Web Service)

### Option A: Using Render Blueprint (Automatic via `render.yaml`)
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `https://github.com/rohithsai199/coastal_seven_tasks`.
4. Render will automatically detect [render.yaml](file:///c:/Users/SANJAY/Downloads/day-19%20completeZip/render.yaml) from the repository root.
5. Click **Apply**.

### Option B: Manual Web Service Setup
If creating the service manually:
* **Service Type:** Web Service
* **Repository:** `https://github.com/rohithsai199/coastal_seven_tasks`
* **Root Directory:** `ecommerce_backend_reviewed`
* **Environment:** `Python 3` (Python 3.10+)
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
* **Health Check Path:** `/health`
* **Environment Variables:**
  * `PYTHON_VERSION`: `3.10.14`
  * `PROJECT_NAME`: `Coastal Seven E-Commerce API`
  * `SECRET_KEY`: `(generate random string or let Render generate it)`
  * `ALGORITHM`: `HS256`
  * `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`
  * `DATABASE_URL`: `sqlite:///./sql_app.db` (or a managed Render PostgreSQL URL)
  * `COOKIE_SECURE`: `true`
  * `ALLOWED_ORIGINS`: `http://localhost:5173,https://*.vercel.app`

Once deployed, Render provides an HTTPS endpoint (e.g., `https://coastal-seven-backend.onrender.com`).

---

## 3. Frontend Deployment on Vercel (Static Hosting)

### Step-by-Step Vercel Setup
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `rohithsai199/coastal_seven_tasks`.
4. In the **Configure Project** screen:
   * **Framework Preset:** `Vite` (Auto-detected).
   * **Root Directory:** Click **Edit** and select `ecommerce_frontend`.
   * **Build Command:** `npm run build` (or leave default).
   * **Output Directory:** `dist` (Auto-detected).
5. **Environment Variables:**
   Add the following:
   * **`VITE_API_URL`**: `https://<YOUR-RENDER-SERVICE-NAME>.onrender.com`
   * **`VITE_WS_URL`**: `wss://<YOUR-RENDER-SERVICE-NAME>.onrender.com`
6. Click **Deploy**.

---

## 4. Pipeline Integration & CORS Configuration

In `ecommerce_backend_reviewed/app/main.py`, FastAPI's `CORSMiddleware` is configured with `allow_origin_regex` to safely accept all traffic from production and preview `*.vercel.app` domains:

```python
origins = [x.strip() for x in settings.ALLOWED_ORIGINS.split(",") if x.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 5. Automated Deployment Scripts

### Running Locally / CI:
* **Linux / macOS / Git Bash:**
  ```bash
  chmod +x scripts/deploy_pipeline.sh
  ./scripts/deploy_pipeline.sh https://coastal-seven-backend.onrender.com
  ```
* **Windows PowerShell:**
  ```powershell
  .\scripts\deploy_pipeline.ps1 -RenderBackendUrl "https://coastal-seven-backend.onrender.com"
  ```

---

## 6. GitHub Actions Continuous Deployment Workflow

The workflow at `.github/workflows/deploy.yml` automates this entire pipeline on every push to `main`:
1. Triggers backend deployment via Render deploy webhook.
2. Polls `GET /health` until the Render service is healthy.
3. Injects the live backend URL into Vite environment variables.
4. Compiles the frontend (`npm run build`).
5. Deploys the production artifact to Vercel.

**Required GitHub Secrets (for GitHub Actions):**
* `RENDER_BACKEND_URL`: Your Render HTTPS URL (`https://coastal-seven-backend.onrender.com`).
* `RENDER_DEPLOY_HOOK_URL`: (Optional) Deploy hook from Render service Settings -> Deploy Hook.
* `VERCEL_TOKEN`: Vercel Personal Access Token.
* `VERCEL_ORG_ID`: Vercel Organization ID (found in Project Settings).
* `VERCEL_PROJECT_ID`: Vercel Project ID (found in Project Settings).
