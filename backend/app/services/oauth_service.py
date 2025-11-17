"""
OAuth Service for Google Authentication

Handles Google OAuth flow and integrates with Supabase Auth.
"""
import secrets
from typing import Dict, Any, Optional
from urllib.parse import urlencode, parse_qs, urlparse
import httpx
from app.core.config import get_settings
from app.core.database import get_service_client
from app.utils.username_generator import generate_elegant_username
from datetime import datetime


async def get_google_oauth_url(state: Optional[str] = None) -> tuple[str, str]:
    """
    Generate Google OAuth authorization URL.
    
    Args:
        state: Optional state parameter for CSRF protection
        
    Returns:
        Google OAuth authorization URL
    """
    settings = get_settings()
    
    if not settings.google_client_id:
        raise ValueError("Google OAuth client ID not configured")
    
    if not settings.oauth_redirect_uri:
        raise ValueError("OAuth redirect URI not configured")
    
    # Generate state if not provided (for CSRF protection)
    if not state:
        state = secrets.token_urlsafe(32)
    
    # Google OAuth parameters
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.oauth_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return auth_url, state


async def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """
    Exchange Google OAuth authorization code for access token.
    
    Args:
        code: Authorization code from Google OAuth callback
        
    Returns:
        Dictionary with access_token, id_token, and user info
    """
    settings = get_settings()
    
    if not settings.google_client_id or not settings.google_client_secret:
        raise ValueError("Google OAuth credentials not configured")
    
    if not settings.oauth_redirect_uri:
        raise ValueError("OAuth redirect URI not configured")
    
    # Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.oauth_redirect_uri,
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=token_data)
        response.raise_for_status()
        token_response = response.json()
    
    # Get user info from Google
    access_token = token_response.get("access_token")
    id_token = token_response.get("id_token")
    
    if not access_token:
        raise ValueError("Failed to get access token from Google")
    
    # Get user info
    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await client.get(user_info_url, headers=headers)
        response.raise_for_status()
        user_info = response.json()
    
    return {
        "access_token": access_token,
        "id_token": id_token,
        "user_info": user_info,
    }


async def get_or_create_oauth_user(google_user_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get existing user or create new one from Google OAuth user info.
    
    Creates user in our users table. JWT tokens are assigned via
    create_supabase_session_token() which creates custom JWT tokens
    that work with our middleware.
    
    Args:
        google_user_info: User information from Google OAuth
        
    Returns:
        User data dictionary from database
    """
    supabase = get_service_client()
    
    email = google_user_info.get("email")
    if not email:
        raise ValueError("Email not provided by Google OAuth")
    
    # Check if user exists by email
    result = (
        supabase.table("users")
        .select("*")
        .eq("email", email)
        .execute()
    )
    
    if result.data and len(result.data) > 0:
        # User exists, return it
        user = result.data[0]
        
        # Update user info if needed
        update_data = {}
        if google_user_info.get("name") and not user.get("full_name"):
            update_data["full_name"] = google_user_info.get("name")
        if google_user_info.get("picture") and not user.get("profile_image_url"):
            update_data["profile_image_url"] = google_user_info.get("picture")
        # Update auth provider classification if needed
        if user.get("auth_provider") != "google_oauth":
            update_data["auth_provider"] = "google_oauth"
        # Store Google ID and OAuth data if not present
        if google_user_info.get("id") and not user.get("google_id"):
            update_data["google_id"] = google_user_info.get("id")
        if not user.get("primary_oauth_provider"):
            update_data["primary_oauth_provider"] = "google"
        if not user.get("oauth_profile_data"):
            update_data["oauth_profile_data"] = google_user_info
        # Auto-upgrade to host for first 6 months (unless already admin)
        if user.get("role") == "user":
            update_data["role"] = "host"
        
        if update_data:
            update_result = (
                supabase.table("users")
                .update(update_data)
                .eq("id", user["id"])
                .execute()
            )
            if update_result.data:
                return update_result.data[0]
        
        return user
    
    # Generate elegant username for new user
    username = generate_elegant_username(supabase)
    
    # Create new user in our users table
    # Note: JWT tokens are created separately via create_supabase_session_token()
    # For first 6 months, all new users are automatically hosts
    new_user = {
        "email": email,
        "username": username,
        "role": "host",  # Auto-upgrade to host (we're only onboarding hosts initially)
        "full_name": google_user_info.get("name", email.split("@")[0]),
        "profile_image_url": google_user_info.get("picture"),
        "email_confirmed_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "auth_provider": "google_oauth",  # Properly classify as Google OAuth
        "google_id": google_user_info.get("id"),  # Store Google ID
        "primary_oauth_provider": "google",  # Mark as Google OAuth
        "oauth_profile_data": google_user_info,  # Store full OAuth profile data
    }
    
    result = supabase.table("users").insert(new_user).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    
    raise Exception("Failed to create user")


async def create_supabase_session_token(user: Dict[str, Any]) -> str:
    """
    Create a Supabase session token for the user.
    
    Note: This creates a custom JWT token that can be validated by Supabase Auth.
    For production, consider using Supabase Auth's sign_in_with_oauth or
    creating users through Supabase Auth directly.
    
    Args:
        user: User data dictionary
        
    Returns:
        Supabase-compatible session token
    """
    from app.core.jwt_utils import create_access_token
    from datetime import timedelta
    
    # Create JWT token (same format as wallet auth for consistency)
    # The middleware will validate this as a custom JWT token
    expires_delta = timedelta(days=7)
    
    token_data = {
        "sub": user["id"],
        "email": user.get("email"),
        "role": user.get("role", "user"),
    }
    
    access_token = create_access_token(token_data, expires_delta)
    return access_token

