import time
from typing import Any, Dict

class CacheService:
    _store: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get(cls, key: str) -> Any | None:
        """Retrieve value from cache if not expired."""
        if key in cls._store:
            entry = cls._store[key]
            if time.time() < entry["expires_at"]:
                return entry["value"]
            else:
                del cls._store[key]
        return None

    @classmethod
    def set(cls, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """Set cache key with TTL in seconds."""
        cls._store[key] = {
            "value": value,
            "expires_at": time.time() + ttl_seconds
        }

    @classmethod
    def clear(cls) -> None:
        """Clear cache store."""
        cls._store.clear()
