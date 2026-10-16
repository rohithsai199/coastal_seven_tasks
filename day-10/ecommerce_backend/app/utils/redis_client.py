from upstash_redis import Redis
from app.config import settings

redis_client = Redis(
    url="https://comic-pig-312861.upstash.io",
    token="gQAAAAAABMYdAAIgcDFhYTdjYzQ0YzhlNzU0MDljYjg3YWM3Yzc5MGYwMTBiMg"
)

def get_redis():
    return redis_client