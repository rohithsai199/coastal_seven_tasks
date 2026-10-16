import asyncio
import time
from typing import List, Dict, Any
import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/async-demo", tags=["Async Programming"])

# 1. Understanding async def vs def
@router.get("/blocking-bad")
async def blocking_bad():
    """
    ANTI-PATTERN: time.sleep inside async def blocks the entire event loop.
    All concurrent requests to ANY endpoint will freeze for 3 seconds.
    """
    time.sleep(3)
    return {"message": "Blocked the event loop for 3 seconds"}

@router.get("/blocking-good-def")
def blocking_good_def():
    """
    SAFE: Standard 'def' runs inside FastAPI's internal threadpool.
    The main event loop remains free to serve other requests.
    """
    time.sleep(3)
    return {"message": "Ran in a background threadpool without blocking the loop"}

@router.get("/non-blocking-async")
async def non_blocking_async():
    """
    CORRECT: asyncio.sleep yields control back to the event loop.
    Other requests are handled concurrently during the 3-second wait.
    """
    await asyncio.sleep(3)
    return {"message": "Asynchronously yielded execution for 3 seconds"}


# 2. Parallel API Execution via asyncio.gather()
async def fetch_weather_upstream(client: httpx.AsyncClient, city: str) -> Dict[str, Any]:
    await asyncio.sleep(1.0)  # Simulating upstream network latency
    return {"city": city, "temp_c": 24.5, "condition": "Sunny"}

async def fetch_stock_upstream(client: httpx.AsyncClient, symbol: str) -> Dict[str, Any]:
    await asyncio.sleep(1.2)  # Simulating another independent external API
    return {"symbol": symbol, "price_usd": 182.40}

async def fetch_news_upstream(client: httpx.AsyncClient, topic: str) -> Dict[str, Any]:
    await asyncio.sleep(0.8)  # Simulating a third external service
    return {"topic": topic, "headline": "Tech innovations surging"}

@router.get("/parallel-gather")
async def parallel_gather():
    """
    Runs 3 independent network calls concurrently.
    Total duration = max(1.0, 1.2, 0.8) ≈ 1.2s instead of 1.0 + 1.2 + 0.8 = 3.0s!
    """
    start_time = time.perf_counter()
    async with httpx.AsyncClient() as client:
        weather_res, stock_res, news_res = await asyncio.gather(
            fetch_weather_upstream(client, "Tokyo"),
            fetch_stock_upstream(client, "GOOGL"),
            fetch_news_upstream(client, "AI"),
            return_exceptions=False
        )
    elapsed = round(time.perf_counter() - start_time, 2)

    return {
        "execution_time_seconds": elapsed,
        "results": {
            "weather": weather_res,
            "stock": stock_res,
            "news": news_res
        }
    }
