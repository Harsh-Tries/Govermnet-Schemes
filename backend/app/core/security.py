import os
import hashlib
import hmac
from datetime import datetime, timedelta
import jwt
from app.core.config import settings

ALGORITHM = "HS256"
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def get_secret_key() -> str:
    key = settings.SECRET_KEY
    if not key or key == "change-this-to-a-secure-random-secret-in-production":
        # In testing or development, provide a fallback, but alert
        return key or "dev-insecure-secret-key-change-in-production"
    return key

def hash_password(password: str, salt: str | None = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with salt."""
    if not salt:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored salt$hash."""
    try:
        salt, expected_hash = hashed_password.split("$", 1)
        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        ).hex()
        return hmac.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False

def create_access_token(subject: str, role: str, expires_delta: timedelta | None = None) -> str:
    """Generate cryptographically signed JWT access token."""
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": str(subject),
        "role": str(role),
        "exp": expire,
        "iat": datetime.utcnow()
    }
    secret = get_secret_key()
    return jwt.encode(payload, secret, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    """Decode and validate JWT access token signature and expiry."""
    secret = get_secret_key()
    return jwt.decode(token, secret, algorithms=[ALGORITHM])
