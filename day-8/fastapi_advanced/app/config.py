from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Database and Caching URLs
    DATABASE_URL: str = "postgresql+asyncpg://postgres:Coastal199@localhost:5432/taskdb"
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
