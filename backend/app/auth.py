import os
import hmac
import hashlib
import json
import base64
import time
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from .database import get_session
from .models import User

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# --- Minimal HMAC-SHA256 JWT (no external deps) ---

def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(s: str) -> bytes:
    s += "=" * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _jwt_encode(payload: dict) -> str:
    header = _b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body = _b64encode(json.dumps(payload).encode())
    sig_input = f"{header}.{body}".encode()
    sig = _b64encode(hmac.new(SECRET_KEY.encode(), sig_input, hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"


def _jwt_decode(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        sig_input = f"{parts[0]}.{parts[1]}".encode()
        expected_sig = _b64encode(hmac.new(SECRET_KEY.encode(), sig_input, hashlib.sha256).digest())
        if not hmac.compare_digest(expected_sig, parts[2]):
            return None
        payload = json.loads(_b64decode(parts[1]))
        if payload.get("exp") and payload["exp"] < time.time():
            return None
        return payload
    except Exception:
        return None


# --- Password hashing (PBKDF2-SHA256, stdlib, secure) ---

import secrets


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
    return f"pbkdf2:{salt}:{h.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    _, salt, expected = hashed.split(":")
    h = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), 260000)
    return hmac.compare_digest(h.hex(), expected)


# --- Token creation ---

def create_access_token(user_id: str) -> str:
    expire = time.time() + ACCESS_TOKEN_EXPIRE_MINUTES * 60
    return _jwt_encode({"sub": user_id, "exp": expire, "type": "access"})


def create_refresh_token(user_id: str) -> str:
    expire = time.time() + REFRESH_TOKEN_EXPIRE_DAYS * 86400
    return _jwt_encode({"sub": user_id, "exp": expire, "type": "refresh"})


def decode_token(token: str) -> Optional[dict]:
    return _jwt_decode(token)


# --- FastAPI dependencies ---

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = session.get(User, payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> Optional[User]:
    """Returns the user if authenticated, None otherwise."""
    if not token:
        return None
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    return session.get(User, payload["sub"])
