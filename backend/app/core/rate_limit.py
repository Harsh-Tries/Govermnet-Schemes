import time
from fastapi import Request, HTTPException, status

# In-memory token bucket rate limiter for protection against uncontrolled repeated API calls
CLIENT_REQUEST_LOGS: dict[str, list[float]] = {}

def rate_limit_middleware(request: Request, max_requests: int = 60, window_seconds: int = 60):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()

    if client_ip not in CLIENT_REQUEST_LOGS:
        CLIENT_REQUEST_LOGS[client_ip] = []

    # Clean old requests outside window
    CLIENT_REQUEST_LOGS[client_ip] = [t for t in CLIENT_REQUEST_LOGS[client_ip] if now - t < window_seconds]

    if len(CLIENT_REQUEST_LOGS[client_ip]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait before retrying."
        )

    CLIENT_REQUEST_LOGS[client_ip].append(now)
