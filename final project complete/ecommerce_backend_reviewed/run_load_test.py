"""
Load Testing Runner Script using Locust:
Simulates 50 concurrent users with a ramp-up rate of 10 users/sec
over the E-Commerce API, exporting results to CSV.
"""
import subprocess
import sys
import os

def main():
    print("=" * 70)
    print("Executing Automated Locust Load Test: 50 Concurrent Users")
    print("=" * 70)
    host = os.environ.get("LOADTEST_HOST", "http://127.0.0.1:8000")
    users = os.environ.get("LOADTEST_USERS", "50")
    spawn_rate = os.environ.get("LOADTEST_SPAWN_RATE", "10")
    run_time = os.environ.get("LOADTEST_RUNTIME", "20s")

    cmd = [
        sys.executable,
        "-m",
        "locust",
        "-f",
        "locustfile.py",
        "--headless",
        "-u",
        users,
        "-r",
        spawn_rate,
        "--run-time",
        run_time,
        "--host",
        host,
        "--csv",
        "load_test_results",
    ]

    print(f"Command: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
