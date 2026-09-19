import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Government Scheme Assistant API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-this-to-a-secure-random-secret-in-production"
    
    # Database Settings (Supports SQLite for local tests and PostgreSQL for docker/prod)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./scheme_assistant.db"
    )

    class Config:
        case_sensitive = True

settings = Settings()
