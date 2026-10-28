import os
from pathlib import Path
from pydantic_settings import BaseSettings

_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
_DEFAULT_DB_FILE = (_ROOT_DIR / "scheme_assistant.db").resolve().as_posix()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Government Scheme Assistant API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-this-to-a-secure-random-secret-in-production"
    
    # Database Settings (Supports SQLite for local tests and PostgreSQL for docker/prod)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{_DEFAULT_DB_FILE}"
    )

    class Config:
        case_sensitive = True

settings = Settings()
