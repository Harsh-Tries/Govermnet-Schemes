import os
import re
from pathlib import Path
from pydantic_settings import BaseSettings

_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
_DEFAULT_DB_FILE = (_ROOT_DIR / "scheme_assistant.db").resolve().as_posix()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Government Scheme Assistant API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-to-a-secure-random-secret-in-production")
    
    # Database Settings (Supports SQLite for local tests and PostgreSQL for docker/prod)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{_DEFAULT_DB_FILE}"
    )

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    WORKER_POLL_INTERVAL: int = int(os.getenv("WORKER_POLL_INTERVAL", "15"))

    class Config:
        case_sensitive = True

    def validate_production_security(self):
        """Enforces that production environments do not use development defaults or missing secrets."""
        if self.ENVIRONMENT.lower() == "production":
            insecure_defaults = [
                "change-this-to-a-secure-random-secret-in-production",
                "secret",
                "admin",
                ""
            ]
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_defaults or len(self.SECRET_KEY) < 16:
                raise ValueError(
                    "FATAL SECURITY VIOLATION: Production environment requires a strong, random SECRET_KEY (min 16 chars). "
                    "Default development secrets are strictly prohibited."
                )

    @property
    def safe_database_url(self) -> str:
        """Returns database URL with credentials safely masked for logs and telemetry."""
        return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", self.DATABASE_URL)

settings = Settings()
settings.validate_production_security()
