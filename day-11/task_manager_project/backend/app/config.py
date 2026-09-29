import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Default to SQLite for zero-config out-of-the-box local operation; can be overridden by PostgreSQL DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./taskmanager.db")
    SECRET_KEY: str = "supersecretkey_change_this_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
