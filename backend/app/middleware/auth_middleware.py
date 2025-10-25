"""
Authentication Middleware for Mayhouse Backend

This module provides FastAPI middleware for JWT-based authentication.
It automatically validates Bearer tokens on protected routes while allowing
public access to specified endpoints.
"""

from typing import Set, Optional, List
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import re
from app.core.jwt_utils import verify_token, get_user_by_id
from app.schemas.user import UserResponse
import logging

# Configure logger for detailed debugging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    JWT Authentication Middleware

    Automatically validates Bearer tokens for protected routes while allowing
    public access to specified endpoints.

    Features:
    - Route-based protection with configurable public routes
    - JWT token validation using Supabase Auth
    - Proper error responses for authentication failures
    - Request context injection for authenticated users
    """

    def __init__(
        self,
        app: ASGIApp,
        public_paths: Optional[Set[str]] = None,
        public_prefixes: Optional[List[str]] = None,
        exclude_prefixes: Optional[List[str]] = None,
    ):
        """
        Initialize authentication middleware.

        Args:
            app: FastAPI application instance
            public_paths: Set of exact paths that don't require authentication
            public_prefixes: List of path prefixes that don't require authentication
            exclude_prefixes: List of path prefixes to completely skip middleware
        """
        super().__init__(app)

        # Default public paths (no authentication required)
        self.public_paths: Set[str] = public_paths or {
            "/",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/test",
        }

        # Default public prefixes (no authentication required)
        self.public_prefixes: List[str] = public_prefixes or [
            "/health",
            "/auth/signup",
            "/auth/login",
            "/auth/oauth",
            "/auth/health",
            "/explore",  # Explore page is public as per requirements
        ]

        # Prefixes to completely exclude from middleware processing
        self.exclude_prefixes: List[str] = exclude_prefixes or [
            "/static",
            "/favicon.ico",
        ]

    def is_public_path(self, path: str) -> bool:
        """
        Check if a path should be publicly accessible.

        Args:
            path: Request path to check

        Returns:
            bool: True if path is public, False if authentication required
        """
        # Check exact paths
        if path in self.public_paths:
            return True

        # Check public prefixes
        for prefix in self.public_prefixes:
            if path.startswith(prefix):
                return True

        return False

    def should_exclude_path(self, path: str) -> bool:
        """
        Check if a path should be excluded from middleware processing.

        Args:
            path: Request path to check

        Returns:
            bool: True if path should be excluded from middleware
        """
        for prefix in self.exclude_prefixes:
            if path.startswith(prefix):
                return True
        return False

    async def extract_bearer_token(self, request: Request) -> Optional[str]:
        """
        Extract Bearer token from Authorization header.

        Args:
            request: FastAPI request object

        Returns:
            Optional[str]: JWT token if present and valid format, None otherwise
        """
        authorization = request.headers.get("Authorization")
        print(
            f"🔐 AUTH MIDDLEWARE: Authorization header: {'Present' if authorization else 'MISSING'}"
        )

        if not authorization:
            print("🔐 AUTH MIDDLEWARE: No Authorization header found")
            return None

        print(
            f"🔐 AUTH MIDDLEWARE: Authorization header value: {authorization[:50]}..."
        )

        # Check if it's a Bearer token
        if not authorization.startswith("Bearer "):
            print(
                f"🔐 AUTH MIDDLEWARE: Not a Bearer token, starts with: {authorization[:10]}"
            )
            return None

        # Extract token (remove "Bearer " prefix)
        token = authorization[7:]  # len("Bearer ") = 7
        print(
            f"🔐 AUTH MIDDLEWARE: Extracted token: {token[:20]}... (length: {len(token)})"
        )

        return token if token else None

    async def validate_token(self, token: str) -> Optional[UserResponse]:
        """
        Validate JWT token and return user information.
        Handles both Supabase tokens (confirmed users) and custom JWT tokens (unconfirmed users).

        Args:
            token: JWT token to validate

        Returns:
            Optional[UserResponse]: User information if token is valid, None otherwise
        """
        try:
            # First try Supabase Auth validation (for confirmed users)
            try:
                from app.core.database import get_db
                from app.core.config import get_settings
                from supabase import create_client

                # Use service client for auth validation to avoid RLS issues
                settings = get_settings()
                if settings.supabase_service_key:
                    supabase = create_client(
                        settings.supabase_url, settings.supabase_service_key
                    )
                else:
                    supabase = get_db()

                user_response = supabase.auth.get_user(token)

                if user_response.user:
                    # Get user profile from our database
                    user_id = user_response.user.id
                    db_response = (
                        supabase.table("users").select("*").eq("id", user_id).execute()
                    )

                    if db_response.data:
                        user_data = db_response.data[0]
                        return UserResponse(
                            id=user_data["id"],
                            email=user_data["email"],
                            full_name=user_data["full_name"],
                            phone=user_data.get("phone"),
                            username=user_data.get("username"),
                            role=user_data.get("role", "user"),
                            profile_image_url=user_data.get("profile_image_url"),
                            preferences=user_data.get("preferences", {}),
                            email_confirmed_at=user_data.get("email_confirmed_at"),
                            created_at=user_data["created_at"],
                            updated_at=user_data.get("updated_at"),
                        )
            except Exception:
                # If Supabase validation fails, try custom JWT validation
                pass

            # Try custom JWT validation (for unconfirmed users)
            payload = verify_token(token)

            if not payload:
                return None

            # Get user ID from token
            user_id = payload.get("sub")

            if not user_id:
                return None

            # Get user data from Supabase database (works for all users including admin)
            from app.core.database import get_db
            from app.core.config import get_settings
            from supabase import create_client

            # Use service client to bypass RLS policies
            settings = get_settings()
            if settings.supabase_service_key:
                supabase = create_client(
                    settings.supabase_url, settings.supabase_service_key
                )
            else:
                supabase = get_db()

            try:
                db_response = (
                    supabase.table("users").select("*").eq("id", user_id).execute()
                )
            except Exception:
                return None

            if db_response.data:
                user_data = db_response.data[0]
                from app.schemas.user import UserRole

                return UserResponse(
                    id=user_data["id"],
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    phone=user_data.get("phone"),
                    username=user_data.get("username"),
                    role=UserRole(user_data.get("role", "user")),
                    profile_image_url=user_data.get("profile_image_url"),
                    preferences=user_data.get("preferences", {}),
                    email_confirmed_at=user_data.get("email_confirmed_at"),
                    created_at=user_data["created_at"],
                    updated_at=user_data.get("updated_at"),
                )

            return None

        except Exception as e:
            logger.warning(f"Token validation failed: {str(e)}")
            return None

    async def create_auth_error_response(
        self, message: str = "Authentication required"
    ) -> Response:
        """
        Create standardized authentication error response.

        Args:
            message: Error message to include in response

        Returns:
            JSONResponse: Standardized 401 error response
        """
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "detail": message,
                "error": "authentication_required",
                "status_code": 401,
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    async def dispatch(self, request: Request, call_next):
        """
        Process incoming request and apply authentication if required.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware/handler in chain

        Returns:
            Response: HTTP response
        """
        path = request.url.path
        method = request.method

        print(f"\n🚀 AUTH MIDDLEWARE: {method} {path}")
        print(f"🚀 AUTH MIDDLEWARE: All headers: {dict(request.headers)}")

        # Always allow OPTIONS requests for CORS preflight
        if method == "OPTIONS":
            print(f"✅ AUTH MIDDLEWARE: OPTIONS request - allowing for CORS")
            logger.info(f"OPTIONS request to {path} - allowing for CORS preflight")
            return await call_next(request)

        # Skip middleware for excluded paths
        if self.should_exclude_path(path):
            print(f"✅ AUTH MIDDLEWARE: Excluded path - skipping auth")
            return await call_next(request)

        # Allow public paths without authentication
        if self.is_public_path(path):
            print(f"✅ AUTH MIDDLEWARE: Public path - allowing without auth")
            return await call_next(request)

        print(f"🔒 AUTH MIDDLEWARE: Protected path - checking authentication")

        # For protected paths, require authentication
        token = await self.extract_bearer_token(request)

        if not token:
            print(f"❌ AUTH MIDDLEWARE: No token found for protected path {path}")
            logger.info(
                f"Authentication required for {method} {path} - no token provided"
            )
            return await self.create_auth_error_response(
                "Missing authentication token. Please include 'Authorization: Bearer <token>' header."
            )

        print(f"🔍 AUTH MIDDLEWARE: Validating token...")
        # Validate token
        user = await self.validate_token(token)
        if not user:
            print(f"❌ AUTH MIDDLEWARE: Token validation failed for {path}")
            logger.info(f"Authentication failed for {method} {path} - invalid token")
            return await self.create_auth_error_response(
                "Invalid or expired authentication token."
            )

        # Add user information to request state for use in route handlers
        request.state.current_user = user
        request.state.is_authenticated = True

        print(f"✅ AUTH MIDDLEWARE: Authentication successful for {path}")
        print(f"✅ AUTH MIDDLEWARE: User: {user.email} (role: {user.role})")
        logger.debug(
            f"Authentication successful for {method} {path} - user: {user.email}"
        )

        # Continue to next middleware/handler
        response = await call_next(request)

        return response


class OptionalAuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Optional Authentication Middleware

    Similar to AuthenticationMiddleware but doesn't block requests without tokens.
    Instead, it adds user information to request state if a valid token is provided.

    Useful for endpoints that want to show different content for authenticated vs
    anonymous users (like personalized explore pages).
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def extract_bearer_token(self, request: Request) -> Optional[str]:
        """Extract Bearer token from Authorization header."""
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            return None
        return authorization[7:] if len(authorization) > 7 else None

    async def validate_token(self, token: str) -> Optional[UserResponse]:
        """Validate JWT token and return user information."""
        try:
            # Verify JWT token
            payload = verify_token(token)
            if not payload:
                return None

            # Get user ID from token
            user_id = payload.get("sub")
            if not user_id:
                return None

            # Get user data
            user_data = get_user_by_id(user_id)
            if not user_data:
                return None

            # Convert to UserResponse
            return UserResponse(**user_data)

        except Exception:
            return None

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and optionally add user context."""
        # Try to get user information if token is provided
        token = await self.extract_bearer_token(request)

        if token:
            user = await self.validate_token(token)
            if user:
                request.state.current_user = user
                request.state.is_authenticated = True
            else:
                request.state.current_user = None
                request.state.is_authenticated = False
        else:
            request.state.current_user = None
            request.state.is_authenticated = False

        return await call_next(request)


# Convenience function to get current user from request state
def get_user_from_request(request: Request) -> Optional[UserResponse]:
    """
    Get current authenticated user from request state.

    This function can be used in route handlers to access the user
    information added by the authentication middleware.

    Args:
        request: FastAPI request object

    Returns:
        Optional[UserResponse]: Current user if authenticated, None otherwise

    Example:
        @app.get("/profile")
        async def get_profile(request: Request):
            user = get_user_from_request(request)
            if not user:
                raise HTTPException(401, "Authentication required")
            return {"profile": user}
    """
    return getattr(request.state, "current_user", None)


def is_authenticated(request: Request) -> bool:
    """
    Check if current request is from an authenticated user.

    Args:
        request: FastAPI request object

    Returns:
        bool: True if user is authenticated, False otherwise
    """
    return getattr(request.state, "is_authenticated", False)
