import json
import logging
import unittest
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from decimal import Decimal

# 1. DATABASE CONFIGURATION
DB_CONFIG = {
    "dbname": "taskdb",
    "user": "postgres",
    "password": "Coastal199",
    "host": "localhost",
    "port": "5432"
}

# 2. LOGGING CONFIGURATION
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("TaskManagerApp")


class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON Encoder for Decimal and datetime objects."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


# 3. DATABASE SCHEMA INITIALIZATION
def init_db():
    schema_sql = """
    CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
        task_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
        priority INT DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    """
    with psycopg2.connect(**DB_CONFIG) as conn:
        with conn.cursor() as cur:
            cur.execute(schema_sql)
            conn.commit()
            logger.info("Schema, Keys, and Indexes initialized successfully.")


# 4. DOMAIN MODELS & MANAGERS
class Task:
    def __init__(self, title: str, user_id: int, status: str = "pending", priority: int = 1, task_id: int = None):
        self.task_id = task_id
        self.user_id = user_id
        self.title = title
        self.status = status
        self.priority = priority

    def __str__(self):
        return f"[ID: {self.task_id}] {self.title} | Status: {self.status} | Priority: {self.priority}"


class TaskManager:
    def __init__(self, db_config: dict):
        self.db_config = db_config

    def _get_connection(self):
        return psycopg2.connect(**self.db_config)

    def register_user(self, username: str, email: str) -> int:
        sql = """
        INSERT INTO users (username, email)
        VALUES (%s, %s)
        ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
        RETURNING user_id;
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (username, email))
                user_id = cur.fetchone()[0]
                conn.commit()
                return user_id

    def add_task(self, task: Task) -> Task:
        sql = """
        INSERT INTO tasks (user_id, title, status, priority)
        VALUES (%s, %s, %s, %s)
        RETURNING task_id;
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (task.user_id, task.title, task.status, task.priority))
                task.task_id = cur.fetchone()[0]
                conn.commit()
                return task

    def update_task_status(self, task_id: int, status: str) -> bool:
        sql = "UPDATE tasks SET status = %s WHERE task_id = %s;"
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (status, task_id))
                conn.commit()
                return cur.rowcount > 0

    def list_user_tasks(self, user_id: int):
        sql = """
        SELECT u.username, t.task_id, t.title, t.status, t.priority
        FROM users u
        INNER JOIN tasks t ON u.user_id = t.user_id
        WHERE u.user_id = %s
        ORDER BY t.priority DESC;
        """
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (user_id,))
                return cur.fetchall()

    def get_summary_statistics(self):
        sql = """
        SELECT u.username,
               COUNT(t.task_id) AS total_tasks,
               COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tasks,
               COUNT(CASE WHEN t.status = 'pending' THEN 1 END) AS pending_tasks,
               ROUND(AVG(t.priority), 2) AS avg_priority
        FROM users u
        LEFT JOIN tasks t ON u.user_id = t.user_id
        GROUP BY u.user_id, u.username
        HAVING COUNT(t.task_id) > 0
        ORDER BY total_tasks DESC;
        """
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql)
                return cur.fetchall()


class RobustTaskManager(TaskManager):
    def register_user(self, username: str, email: str) -> int:
        logger.info(f"Attempting to register user: {username} ({email})")
        try:
            user_id = super().register_user(username, email)
            logger.info(f"User registered successfully. User ID: {user_id}")
            return user_id
        except psycopg2.Error as e:
            logger.error(f"Database error during user registration: {e}")
            raise RuntimeError(f"Failed to register user: {e}")

    def add_task(self, task: Task) -> Task:
        logger.info(f"Attempting to add task '{task.title}' for user_id: {task.user_id}")
        try:
            created_task = super().add_task(task)
            logger.info(f"Task created successfully with ID: {created_task.task_id}")
            return created_task
        except psycopg2.Error as e:
            logger.error(f"Database error while adding task: {e}")
            raise RuntimeError(f"Failed to add task: {e}")

    def update_task_status(self, task_id: int, status: str) -> bool:
        valid_statuses = ('pending', 'in_progress', 'completed')
        if status not in valid_statuses:
            logger.warning(f"Invalid status transition attempted: '{status}'")
            raise ValueError(f"Invalid status '{status}'. Must be one of {valid_statuses}")

        try:
            success = super().update_task_status(task_id, status)
            if success:
                logger.info(f"Task ID {task_id} status updated successfully.")
            return success
        except psycopg2.Error as e:
            logger.error(f"Database error while updating task {task_id}: {e}")
            raise RuntimeError(f"Database error during status update: {e}")

    def export_summary_to_json(self, filepath: str = "summary_export.json") -> str:
        try:
            stats = self.get_summary_statistics()
            json_data = json.dumps(stats, indent=4, cls=CustomJSONEncoder)
            with open(filepath, "w") as f:
                f.write(json_data)
            logger.info(f"Summary report exported successfully to '{filepath}'")
            return json_data
        except Exception as e:
            logger.error(f"Failed to export summary to JSON: {e}")
            raise RuntimeError(f"JSON export failure: {e}")


# 5. CLI INTERFACE
def run_cli_app():
    manager = RobustTaskManager(DB_CONFIG)
    print("==========================================")
    print("     WELCOME TO CLI TASK MANAGER DB       ")
    print("==========================================")

    username = input("Enter your username: ").strip()
    email = input("Enter your email: ").strip()

    current_user_id = manager.register_user(username, email)
    print(f"\nAuthenticated as: {username} (User ID: {current_user_id})\n")

    while True:
        print("\n--- MENU ---")
        print("1. Add New Task")
        print("2. View My Tasks")
        print("3. Update Task Status")
        print("4. View All Users Summary")
        print("5. Export Summary to JSON")
        print("6. Exit")

        choice = input("Select an option (1-6): ").strip()

        if choice == '1':
            title = input("Enter task title: ").strip()
            priority = int(input("Enter priority (1-5): ").strip() or 1)
            new_task = Task(title=title, user_id=current_user_id, priority=priority)
            created = manager.add_task(new_task)
            print(f"Task successfully created: {created}")

        elif choice == '2':
            tasks = manager.list_user_tasks(current_user_id)
            print(f"\n--- Tasks for {username} ---")
            if not tasks:
                print("No tasks found.")
            for t in tasks:
                print(f"[{t['task_id']}] {t['title']} | Status: {t['status']} | Priority: {t['priority']}")

        elif choice == '3':
            task_id = int(input("Enter Task ID to update: ").strip())
            status = input("Enter status (pending, in_progress, completed): ").strip().lower()
            if manager.update_task_status(task_id, status):
                print("Task status updated successfully!")
            else:
                print("Task ID not found.")

        elif choice == '4':
            stats = manager.get_summary_statistics()
            print("\n--- User Productivity Summary ---")
            for row in stats:
                print(f"User: {row['username']} | Total: {row['total_tasks']} | Completed: {row['completed_tasks']} | Pending: {row['pending_tasks']} | Avg Priority: {row['avg_priority']}")

        elif choice == '5':
            export_file = "production_summary.json"
            manager.export_summary_to_json(export_file)
            print(f"Exported data to {export_file}")

        elif choice == '6':
            print("Exiting application. Goodbye!")
            break
        else:
            print("Invalid choice, please select 1-6.")


if __name__ == "__main__":
    init_db()
    run_cli_app()