import uvicorn
import sys
import os

if __name__ == "__main__":
    # Allows optional port override via CLI argument (e.g. python run.py 8001) or PORT env var
    port = 8000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    else:
        port = int(os.getenv("PORT", 8000))

    print(f"Starting Task Management FastAPI backend on http://127.0.0.1:{port} ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=True)
