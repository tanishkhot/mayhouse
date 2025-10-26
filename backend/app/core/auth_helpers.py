"""
Authentication helper functions for role-based access control.

This module provides utility functions for checking user roles and permissions
in the Mayhouse backend.
"""

from fastapi import HTTPException, status, Header
from app.core.jwt_utils import verify_token
from app.schemas.user import UserRole
from app.core.database import get_service_client
from typing import Optional


async def get_user_from_token(authorization: str) -> dict:
    """
    Extract and validate user from authorization header.

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        dict: User data from database

    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    # Get user from database
    supabase = get_service_client()
    user_response = supabase.table("users").select("*").eq("id", user_id).execute()

    if not user_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user_response.data[0]


async def require_admin_or_moderator(authorization: str = Header(None)) -> dict:
    """
    Dependency to require admin role.
    Note: "moderator" is just an alias - only admin role exists.

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        dict: User data if authorized

    Raises:
        HTTPException: If user doesn't have admin role
    """
    user = await get_user_from_token(authorization)

    user_role = user.get("role")
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return user


async def require_admin(authorization: str = Header(None)) -> dict:
    """
    Dependency to require admin role.

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        dict: User data if authorized

    Raises:
        HTTPException: If user doesn't have admin role
    """
    user = await get_user_from_token(authorization)

    user_role = user.get("role")
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )

    return user


async def require_host(authorization: str = Header(None)) -> dict:
    """
    Dependency to require host role (or admin).

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        dict: User data if authorized

    Raises:
        HTTPException: If user doesn't have host or admin role
    """
    user = await get_user_from_token(authorization)

    user_role = user.get("role")
    if user_role not in ["host", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Host access required"
        )

    return user


def check_user_role(user: dict, allowed_roles: list[str]) -> bool:
    """
    Check if user has one of the allowed roles.

    Args:
        user: User data dictionary
        allowed_roles: List of allowed role strings

    Returns:
        bool: True if user has an allowed role, False otherwise
    """
    user_role = user.get("role")
    return user_role in allowed_roles
