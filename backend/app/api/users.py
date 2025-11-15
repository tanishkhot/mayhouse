"""
User Profile API endpoints for Mayhouse Backend

Public profile endpoints and authenticated profile management.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Header, Query, Path
from app.schemas.user import UserResponse, UserUpdate
from app.services.profile_service import profile_service
from app.core.auth_helpers import get_user_from_token
from app.core.database import get_service_client

# Create routers
public_router = APIRouter(prefix="/users", tags=["Users - Public"])
user_router = APIRouter(prefix="/users", tags=["Users - Authenticated"])


@public_router.get(
    "/{user_id}/profile",
    summary="Get Public Profile",
    description="Get public profile information for a user, including host statistics if applicable.",
)
async def get_public_profile(
    user_id: str = Path(..., description="User ID (UUID)"),
    authorization: Optional[str] = Header(None),
):
    """
    Get public profile with aggregated statistics.
    
    Returns user info, host stats (if host), experience count, and basic profile data.
    Public endpoint - no authentication required.
    """
    try:
        profile = await profile_service.get_public_profile(user_id)
        
        # If requesting own profile, include email
        is_own_profile = False
        if authorization:
            try:
                current_user = await get_user_from_token(authorization)
                is_own_profile = current_user.get("id") == user_id
            except:
                pass  # Not authenticated or different user
        
        # Remove email from public view unless it's own profile
        if not is_own_profile:
            profile.pop("email", None)
        
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}"
        )


@public_router.get(
    "/{user_id}/experiences",
    summary="Get Host's Experiences",
    description="Get list of approved experiences for a host (public endpoint).",
)
async def get_host_experiences(
    user_id: str = Path(..., description="Host user ID (UUID)"),
    limit: int = Query(10, ge=1, le=50, description="Number of experiences to return"),
    offset: int = Query(0, ge=0, description="Number of experiences to skip"),
):
    """
    Get host's approved experiences for public display.
    
    Returns list of experiences with basic info: id, title, domain, price, 
    neighborhood, cover photo.
    """
    try:
        experiences = await profile_service.get_host_experiences(
            user_id, limit=limit, offset=offset
        )
        return {
            "experiences": experiences,
            "count": len(experiences),
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get host experiences: {str(e)}"
        )


@public_router.get(
    "/{user_id}/stats",
    summary="Get Host Statistics",
    description="Get aggregated statistics for a host (public endpoint).",
)
async def get_host_stats(
    user_id: str = Path(..., description="Host user ID (UUID)"),
):
    """
    Get host statistics including experience count, event run count,
    travelers hosted, average rating, and years hosting.
    """
    try:
        stats = await profile_service.get_host_statistics(user_id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get host statistics: {str(e)}"
        )


@user_router.get(
    "/profile",
    summary="Get Own Profile",
    description="Get authenticated user's own profile with full details.",
)
async def get_own_profile(
    authorization: str = Header(..., description="Bearer token"),
):
    """
    Get current user's profile with full details including email.
    Requires authentication.
    """
    try:
        user = await get_user_from_token(authorization)
        user_id = user.get("id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication"
            )
        
        profile = await profile_service.get_public_profile(user_id)
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}"
        )


@user_router.put(
    "/profile",
    summary="Update Own Profile",
    description="Update authenticated user's profile information.",
)
async def update_own_profile(
    update_data: UserUpdate,
    authorization: str = Header(..., description="Bearer token"),
):
    """
    Update current user's profile.
    Requires authentication.
    Only updates provided fields.
    """
    try:
        user = await get_user_from_token(authorization)
        user_id = user.get("id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication"
            )
        
        service_client = get_service_client()
        
        # Build update dict (only include provided fields)
        update_dict = {}
        if update_data.full_name is not None:
            update_dict["full_name"] = update_data.full_name
        if update_data.bio is not None:
            update_dict["bio"] = update_data.bio
        if update_data.profile_image_url is not None:
            update_dict["profile_image_url"] = update_data.profile_image_url
        if update_data.phone is not None:
            update_dict["phone"] = update_data.phone
        if update_data.username is not None:
            # Check username uniqueness if provided
            existing = (
                service_client.table("users")
                .select("id")
                .eq("username", update_data.username)
                .neq("id", user_id)
                .execute()
            )
            if existing.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
            update_dict["username"] = update_data.username
        if update_data.preferences is not None:
            update_dict["preferences"] = update_data.preferences
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Add updated_at timestamp
        from datetime import datetime
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        # Update user
        response = (
            service_client.table("users")
            .update(update_dict)
            .eq("id", user_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Return updated profile
        updated_user = response.data[0]
        return {
            "id": updated_user["id"],
            "full_name": updated_user.get("full_name"),
            "username": updated_user.get("username"),
            "bio": updated_user.get("bio"),
            "profile_image_url": updated_user.get("profile_image_url"),
            "phone": updated_user.get("phone"),
            "role": updated_user.get("role"),
            "email": updated_user.get("email"),
            "created_at": updated_user.get("created_at"),
            "updated_at": updated_user.get("updated_at"),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

