"""
JWT Utilities for Mayhouse Backend

This module provides utilities for creating and validating JWT tokens
for user authentication and authorization.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Set
from jose import JWTError, jwt
import hashlib
import secrets
import threading
from time import time

# JWT Configuration
SECRET_KEY = "your-secret-key-change-in-production-make-it-very-long-and-random-12345"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Token Blacklist System (In-memory for simplicity - use Redis in production)
# This stores blacklisted tokens with their expiration times
_token_blacklist: Dict[str, float] = {}
_blacklist_lock = threading.Lock()


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Dictionary containing claims to encode in the token
        expires_delta: Optional custom expiration time

    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def blacklist_token(token: str) -> bool:
    """
    Add a token to the blacklist.

    Args:
        token: JWT token to blacklist

    Returns:
        bool: True if token was successfully blacklisted
    """
    try:
        # Decode token to get expiration time
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload.get("exp")

        if not exp_timestamp:
            return False

        with _blacklist_lock:
            # Clean up expired tokens from blacklist
            _cleanup_expired_tokens()
            # Add token to blacklist with its expiration time
            _token_blacklist[token] = float(exp_timestamp)

        return True
    except JWTError:
        return False


def is_token_blacklisted(token: str) -> bool:
    """
    Check if a token is blacklisted.

    Args:
        token: JWT token to check

    Returns:
        bool: True if token is blacklisted
    """
    with _blacklist_lock:
        # Clean up expired tokens
        _cleanup_expired_tokens()
        return token in _token_blacklist


def _cleanup_expired_tokens():
    """
    Remove expired tokens from the blacklist.
    This is called automatically when accessing the blacklist.
    """
    current_time = time()
    expired_tokens = [
        token for token, exp_time in _token_blacklist.items() if exp_time < current_time
    ]

    for token in expired_tokens:
        del _token_blacklist[token]


def get_blacklist_stats() -> Dict[str, Any]:
    """
    Get statistics about the token blacklist (for monitoring/debugging).

    Returns:
        Dict[str, Any]: Blacklist statistics
    """
    with _blacklist_lock:
        _cleanup_expired_tokens()
        return {
            "blacklisted_tokens": len(_token_blacklist),
            "oldest_token_exp": (
                min(_token_blacklist.values()) if _token_blacklist else None
            ),
            "newest_token_exp": (
                max(_token_blacklist.values()) if _token_blacklist else None
            ),
        }


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token, checking blacklist.

    Args:
        token: JWT token to verify

    Returns:
        Optional[Dict[str, Any]]: Decoded token payload or None if invalid/blacklisted
    """
    try:
        # First check if token is blacklisted
        if is_token_blacklisted(token):
            return None

        # Then verify the token signature and expiration
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from JWT token.

    Args:
        token: JWT token

    Returns:
        Optional[str]: User ID if token is valid, None otherwise
    """
    payload = verify_token(token)
    if payload:
        return payload.get("sub")  # 'sub' is standard JWT claim for subject (user ID)
    return None


def simple_hash(password: str) -> str:
    """
    Simple password hashing for testing (NOT for production!).

    Args:
        password: Plain text password

    Returns:
        str: Hashed password
    """
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password_simple(plain_password: str, expected_password: str) -> bool:
    """
    Simple password verification for testing.

    Args:
        plain_password: Plain text password to verify
        expected_password: Expected plain text password

    Returns:
        bool: True if passwords match
    """
    return plain_password == expected_password


def generate_secure_secret() -> str:
    """
    Generate a secure secret key for JWT signing.

    Returns:
        str: Secure random secret key
    """
    return secrets.token_urlsafe(64)


# Mock user database for testing (in real app, this would be in database)
# Using plain text passwords for testing simplicity
MOCK_USERS_DB = {
    "ash@test.com": {
        "id": "00000000-0000-4000-8000-000000000002",  # Valid UUID for ash
        "username": "ash_explorer",
        "email": "ash@test.com",
        "full_name": "Ash Kumar",
        "phone": "+91-9876543210",
        "role": "user",
        "password": "password123",  # Plain text for testing
        "email_confirmed_at": "2024-01-01T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    },
    "test@test.com": {
        "id": "00000000-0000-4000-8000-000000000003",  # Valid UUID for test
        "username": "test_traveler",
        "email": "test@test.com",
        "full_name": "Test User",
        "phone": "+91-9876543211",
        "role": "user",
        "password": "password123",  # Plain text for testing
        "email_confirmed_at": "2024-01-01T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    },
    # Admin user removed - now uses regular Supabase authentication
}


def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate a user with email and password.

    Args:
        email: User's email address
        password: Plain text password

    Returns:
        Optional[Dict[str, Any]]: User data if authentication successful, None otherwise
    """
    user = MOCK_USERS_DB.get(email)
    if not user:
        return None

    if not verify_password_simple(password, user["password"]):
        return None

    # Return user data without password
    user_data = user.copy()
    del user_data["password"]
    return user_data


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user data by user ID.

    Args:
        user_id: User's unique ID

    Returns:
        Optional[Dict[str, Any]]: User data if found, None otherwise
    """
    for user in MOCK_USERS_DB.values():
        if user["id"] == user_id:
            user_data = user.copy()
            del user_data["password"]
            return user_data
    return None
