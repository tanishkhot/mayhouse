"""
OAuth API endpoints for Google Authentication
"""
from fastapi import APIRouter, HTTPException, status, Query, Request
from fastapi.responses import RedirectResponse
from app.core.config import get_settings
from app.services.oauth_service import (
    get_google_oauth_url,
    exchange_code_for_token,
    get_or_create_oauth_user,
    create_supabase_session_token,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/oauth", tags=["OAuth"])


@router.get("/google/login")
async def google_oauth_login(request: Request):
    """
    Initiate Google OAuth login flow.
    
    Redirects user to Google OAuth consent screen.
    """
    try:
        settings = get_settings()
        
        if not settings.google_client_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth not configured"
            )
        
        # Get frontend URL from request or use default
        frontend_url = request.headers.get("Referer") or "http://localhost:3000"
        # Extract base URL (remove path)
        if "/" in frontend_url.split("://")[1]:
            frontend_url = frontend_url.split("/")[0] + "//" + frontend_url.split("://")[1].split("/")[0]
        
        # Generate OAuth URL with state
        auth_url, state = await get_google_oauth_url()
        
        # Store state in session or return it (for CSRF protection)
        # For now, we'll include it in the redirect URL
        # In production, store in Redis or session
        
        logger.info(f"Redirecting to Google OAuth: {auth_url}")
        return RedirectResponse(url=auth_url)
    
    except Exception as e:
        logger.error(f"Error initiating Google OAuth: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate OAuth: {str(e)}"
        )


@router.get("/google/callback")
async def google_oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(None, description="State parameter for CSRF protection"),
    error: str = Query(None, description="Error from OAuth provider"),
):
    """
    Handle Google OAuth callback.
    
    Exchanges authorization code for token, creates/gets user,
    and redirects to frontend with token.
    """
    try:
        settings = get_settings()
        frontend_url = settings.cors_origins[0] if settings.cors_origins else "http://localhost:3000"
        
        # Check for OAuth errors
        if error:
            logger.error(f"OAuth error: {error}")
            error_url = f"{frontend_url}/auth/callback?error={error}"
            return RedirectResponse(url=error_url)
        
        if not code:
            logger.error("No authorization code provided")
            error_url = f"{frontend_url}/auth/callback?error=no_code"
            return RedirectResponse(url=error_url)
        
        # Exchange code for token and get user info
        logger.info("Exchanging authorization code for token...")
        oauth_data = await exchange_code_for_token(code)
        google_user_info = oauth_data["user_info"]
        
        # Get or create user in database
        logger.info(f"Getting/creating user for email: {google_user_info.get('email')}")
        user = await get_or_create_oauth_user(google_user_info)
        
        # Create session token
        logger.info(f"Creating session token for user: {user['id']}")
        access_token = await create_supabase_session_token(user)
        
        # Redirect to frontend with token in hash fragment (more secure than query param)
        # Frontend will extract token from hash and store it
        redirect_url = f"{frontend_url}/auth/callback#access_token={access_token}&token_type=bearer"
        
        logger.info(f"Redirecting to frontend: {redirect_url.split('#')[0]}...")
        return RedirectResponse(url=redirect_url)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}", exc_info=True)
        settings = get_settings()
        frontend_url = settings.cors_origins[0] if settings.cors_origins else "http://localhost:3000"
        error_url = f"{frontend_url}/auth/callback?error=oauth_failed"
        return RedirectResponse(url=error_url)

