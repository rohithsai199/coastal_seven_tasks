from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "E-Commerce Backend API"
    SECRET_KEY: str = "your-super-secret-jwt-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    DATABASE_URL: str = "postgresql://postgres:Rohith199@localhost:5432/postgres"

    # Upstash TCP & Celery Configuration
    REDIS_URL: str = "rediss://default:gQAAAAAABMYdAAIgcDFhYTdjYzQ0YzhlNzU0MDljYjg3YWM3Yzc5MGYwMTBiMg@comic-pig-312861.upstash.io:6379"
    UPSTASH_REDIS_URL: str = "rediss://default:gQAAAAAABMYdAAIgcDFhYTdjYzQ0YzhlNzU0MDljYjg3YWM3Yzc5MGYwMTBiMg@comic-pig-312861.upstash.io:6379"
    CELERY_BROKER_URL: str = "rediss://default:gQAAAAAABMYdAAIgcDFhYTdjYzQ0YzhlNzU0MDljYjg3YWM3Yzc5MGYwMTBiMg@comic-pig-312861.upstash.io:6379"
    CELERY_RESULT_BACKEND: str = "rediss://default:gQAAAAAABMYdAAIgcDFhYTdjYzQ0YzhlNzU0MDljYjg3YWM3Yzc5MGYwMTBiMg@comic-pig-312861.upstash.io:6379"

    # Upstash REST Configuration
    UPSTASH_REDIS_REST_URL: str = "https://comic-pig-312861.upstash.io"
    UPSTASH_REDIS_REST_TOKEN: str = "gQAAAAAABMYdAAIgcDFhYTdjYzQ0YzhlNzU0MDljYjg3YWM3Yzc5MGYwMTBiMg"

    # SMTP Mail Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "guntururohithsai@gmail.com"
    SMTP_PASSWORD: str = "idbr dweh jhyd wiko"
    EMAILS_FROM_EMAIL: str = "guntururohithsai@gmail.com"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()