# TaskFlow: React Fundamentals, Hooks & Router Integration with FastAPI

A production-grade, enterprise Task Management application connecting a **React (Vite) frontend** with a **JWT-authenticated FastAPI backend**, built directly based on the reference repository [`day-7/task_manager_project`](https://github.com/rohithsai199/coastal_seven_tasks/tree/main/day-7/task_manager_project).

---

## 📋 Topic Implementation & Learning Outcomes

| Topic | Learning & Implementation | Expected Outcome |
| :--- | :--- | :--- |
| **React Fundamentals** | Built modular components (`Button`, `Input`, `Modal`, `Badge`, `Card`, `StatCard`, `EmptyState`), props passing, component composition, conditional rendering, and dynamic list rendering. | Understand React fundamentals and build reusable UI components. |
| **React Hooks** | `useState` (form states, filter toggles), `useEffect` (API data fetching, title sync, keyboard cleanup), `useRef` (auto-focusing modal inputs, DOM references), controlled inputs, and custom hooks (`useDebounce`, `useAuth`, `useToast`). | Manage component state, side effects, references, and user interactions. |
| **React Router v6** | Client-side routing with nested routes, `<Outlet />`, `useParams` (in `/projects/:projectId`), `useNavigate` (programmatic navigation), and `<NavLink>` active indicators. | Build a multi-page React application with client-side routing. |
| **Axios Service Layer** | Centralized Axios instance (`axiosClient.js`) and modular services: `authService.js`, `projectService.js`, `taskService.js`. | Establish clean, centralized communication with the FastAPI backend. |
| **Axios Interceptors** | **Request Interceptor**: automatically injects `Authorization: Bearer <token>`.<br>**Response Interceptor**: catches `401 Unauthorized` errors, ejects expired tokens from `localStorage`, and normalizes error messages. | Automatically handle authentication tokens and API responses. |
| **Protected Routes** | `<ProtectedRoute />` wrapper that gates private pages, preserves redirect intent via `location.state.from`, and enforces Role-Based Access Control (`admin`, `manager`, `member`). | Secure frontend routes based on authentication status. |
| **FastAPI Integration** | Full REST backend with JWT authentication (`/auth/login`, `/auth/register`, `/auth/me`), Projects CRUD (`/projects/`), and Tasks CRUD (`/tasks/`) with CORS enabled. | Enable authenticated API calls between React and FastAPI. |
| **Final Integration** | Complete multi-page web app with seamless end-to-end integration, reactive metrics dashboard, live status update toggles, and token inspection. | Build a multi-page React application with working routing and JWT-authenticated calls into the FastAPI backend. |

---

## 🚀 Quick Start Guide (VS Code)

### 1. Open Project in VS Code
Open VS Code and navigate to the project directory:
```bash
code C:\Users\SANJAY\.gemini\antigravity-ide\scratch\task_manager_project
```

---

### 2. Start the FastAPI Backend
Open a terminal in VS Code:
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
> The backend will launch at **`http://127.0.0.1:8000`**.  
> Interactive OpenAPI documentation is accessible at **`http://127.0.0.1:8000/docs`**.  
> *Note: SQLite database (`taskmanager.db`) is automatically initialized and seeded with default projects and tasks on first startup.*

---

### 3. Start the React Frontend
Open a second terminal in VS Code:
```bash
cd frontend
npm install
npm run dev
```
> The frontend dev server will launch at **`http://127.0.0.1:5173`**.

---

## 🔑 Pre-Seeded Demo User Accounts

You can log in manually or use the **Quick Demo Login** buttons on the Login page:

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | **`admin`** | Full access: create/delete projects, manage all tasks, view metrics |
| **`manager`** | `manager123` | **`manager`** | Create projects and assign tasks |
| **`sanjay`** | `sanjay123` | **`member`** | View tasks and update status of assigned tasks |

---

## 📂 Project Architecture

```
task_manager_project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py         # App configuration & JWT settings
│   │   ├── database.py       # SQLAlchemy engine & session factory
│   │   ├── models.py         # User, Project, Task domain models & Enums
│   │   ├── schemas.py        # Pydantic request & response schemas
│   │   ├── auth.py           # Bcrypt hashing, JWT issuance & RBAC dependency
│   │   ├── routers/
│   │   │   ├── auth.py       # Login, Register, Profile (/auth/me), Users list
│   │   │   ├── projects.py   # Projects CRUD & task count aggregation
│   │   │   └── tasks.py      # Tasks CRUD with status, project, & search filters
│   │   └── main.py           # FastAPI app, CORS middleware & auto-seeder
│   ├── requirements.txt
│   └── run.py                # Uvicorn startup script
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosClient.js    # Axios instance + Request/Response Interceptors
│   │   │   ├── authService.js    # Auth API communication
│   │   │   ├── projectService.js # Project CRUD communication
│   │   │   └── taskService.js    # Task CRUD & query communication
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx    # Reusable button with loading & icon support
│   │   │   │   ├── Input.jsx     # Controlled input with validation & ref forwarding
│   │   │   │   ├── Modal.jsx     # Accessible modal with useRef & Escape key listener
│   │   │   │   ├── Badge.jsx     # Status and role pill badges
│   │   │   │   ├── Card.jsx      # Glassmorphism container card
│   │   │   │   ├── StatCard.jsx  # KPI metric card
│   │   │   │   └── EmptyState.jsx# Graceful empty list placeholder
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx   # NavLink-powered persistent sidebar
│   │   │   │   ├── Navbar.jsx    # Topbar with backend connection indicator
│   │   │   │   ├── DashboardLayout.jsx # Layout containing <Outlet />
│   │   │   │   └── AuthLayout.jsx# Layout for login & registration
│   │   │   ├── tasks/
│   │   │   │   ├── TaskCard.jsx  # Task card with inline status select dropdown
│   │   │   │   ├── TaskModal.jsx # Task creation modal with useRef autofocus
│   │   │   │   └── TaskFilterBar.jsx # Search & status/project filter controls
│   │   │   └── projects/
│   │   │       ├── ProjectCard.jsx # Project card linking to /projects/:id
│   │   │       └── ProjectModal.jsx# Project creation modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Global user state, JWT sync & RBAC helpers
│   │   │   └── ToastContext.jsx  # Notification toast dispatcher
│   │   ├── hooks/
│   │   │   └── useDebounce.js    # Custom debounce hook for search inputs
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.jsx# Auth & role guard with redirect preservation
│   │   │   └── AppRouter.jsx     # React Router v6 nested routes definition
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx     # Controlled login form + Quick switchers
│   │   │   ├── RegisterPage.jsx  # Controlled registration form with role choice
│   │   │   ├── DashboardPage.jsx # KPI statistics & recent tasks overview
│   │   │   ├── TasksPage.jsx     # Full task manager with search & filters
│   │   │   ├── ProjectsPage.jsx  # Projects directory
│   │   │   ├── ProjectDetailPage.jsx # Uses useParams() to load specific project tasks
│   │   │   ├── ProfilePage.jsx   # JWT claims inspector & 401 test trigger
│   │   │   └── NotFoundPage.jsx  # 404 handler
│   │   ├── styles/
│   │   │   ├── index.css         # Design tokens, variables & glassmorphism
│   │   │   └── components.css    # UI component styles
│   │   ├── App.jsx               # App wrapper with BrowserRouter & Providers
│   │   └── main.jsx              # React entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🧪 Key Demonstrations in the App

1. **Auto-focus with `useRef`**:
   - Open **Create Task** or **Create Project** modal; the title field is instantly auto-focused using a DOM reference via `useRef`.
2. **Debounced Search**:
   - In the **Tasks** page, type into the search bar. The `useDebounce` hook avoids firing redundant requests and waits for typing completion.
3. **Axios Request Interceptor**:
   - Every authenticated request sent by `axiosClient.js` automatically attaches `Authorization: Bearer <token>`. Check your browser developer tools Network tab to see the injected header.
4. **Axios Response Interceptor (401 Handling)**:
   - Navigate to the **Profile & Auth** page and click **"Trigger Simulated 401 Interceptor Ejection"**.
   - The response interceptor detects the 401, clears the token, and resets session state.
5. **Parameterized Dynamic Route (`useParams`)**:
   - Navigate to **Projects** and click **"View Tasks"** on any project. The route navigates to `/projects/:projectId` and uses `useParams()` to fetch tasks specifically associated with that project.
