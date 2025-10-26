"""
Experience Photos API Endpoints

Handles photo uploads, management, and retrieval for experiences.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from typing import List, Optional
from app.services.photo_upload_service import PhotoUploadService
from app.schemas.experience_photo import (
    ExperiencePhotoResponse,
    ExperiencePhotoUploadResponse,
    ExperiencePhotoUpdate
)
from app.core.database import get_service_client
from app.core.jwt_utils import verify_token


router = APIRouter(prefix="/experiences", tags=["Experience Photos"])


def get_user_id_from_auth(authorization: str = Header(None)) -> str:
    """
    Extract and validate user ID from JWT token.
    
    Args:
        authorization: Authorization header with Bearer token
        
    Returns:
        str: User ID from token
        
    Raises:
        HTTPException: If token is missing or invalid
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload"
        )
    
    return user_id


@router.post("/{experience_id}/photos", response_model=ExperiencePhotoUploadResponse)
async def upload_experience_photo(
    experience_id: str,
    file: UploadFile = File(...),
    is_cover_photo: bool = Form(False),
    display_order: int = Form(0),
    caption: Optional[str] = Form(None),
    authorization: str = Header(None)
):
    """
    Upload a photo for an experience.
    
    - **experience_id**: ID of the experience
    - **file**: Image file to upload (JPEG, PNG, WebP, max 5MB)
    - **is_cover_photo**: Whether this should be the cover photo
    - **display_order**: Display order (0 = first)
    - **caption**: Optional caption for the photo
    
    **Authorization**: Must be the host of the experience.
    """
    
    # Get user ID from token
    user_id = get_user_id_from_auth(authorization)
    
    # Verify experience exists and user is the host
    supabase = get_service_client()
    experience_result = supabase.table("experiences").select("host_id").eq(
        "id", experience_id
    ).execute()
    
    if not experience_result.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    experience = experience_result.data[0]
    if experience["host_id"] != user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the host can upload photos for this experience"
        )
    
    # Upload photo
    photo_service = PhotoUploadService()
    
    # Upload to storage
    photo_url = await photo_service.upload_photo_to_storage(file, experience_id)
    
    # Create database record
    photo_record = await photo_service.create_photo_record(
        experience_id=experience_id,
        photo_url=photo_url,
        is_cover_photo=is_cover_photo,
        display_order=display_order,
        caption=caption
    )
    
    return ExperiencePhotoUploadResponse(
        photo_id=photo_record["id"],
        photo_url=photo_record["photo_url"],
        is_cover_photo=photo_record["is_cover_photo"],
        message="Photo uploaded successfully"
    )


@router.get("/{experience_id}/photos", response_model=List[ExperiencePhotoResponse])
async def get_experience_photos(experience_id: str):
    """
    Get all photos for an experience.
    
    - **experience_id**: ID of the experience
    
    Returns photos sorted by display_order.
    """
    
    photo_service = PhotoUploadService()
    photos = await photo_service.get_experience_photos(experience_id)
    
    return photos


@router.patch("/{experience_id}/photos/{photo_id}", response_model=ExperiencePhotoResponse)
async def update_photo_metadata(
    experience_id: str,
    photo_id: str,
    photo_update: ExperiencePhotoUpdate,
    authorization: str = Header(None)
):
    """
    Update photo metadata (cover photo status, display order, caption).
    
    - **experience_id**: ID of the experience
    - **photo_id**: ID of the photo to update
    - **photo_update**: Updated photo metadata
    
    **Authorization**: Must be the host of the experience.
    """
    
    # Get user ID from token
    user_id = get_user_id_from_auth(authorization)
    
    photo_service = PhotoUploadService()
    
    updated_photo = await photo_service.update_photo_metadata(
        photo_id=photo_id,
        user_id=user_id,
        is_cover_photo=photo_update.is_cover_photo,
        display_order=photo_update.display_order,
        caption=photo_update.caption
    )
    
    return updated_photo


@router.delete("/{experience_id}/photos/{photo_id}")
async def delete_photo(
    experience_id: str,
    photo_id: str,
    authorization: str = Header(None)
):
    """
    Delete a photo.
    
    - **experience_id**: ID of the experience
    - **photo_id**: ID of the photo to delete
    
    **Authorization**: Must be the host of the experience.
    """
    
    # Get user ID from token
    user_id = get_user_id_from_auth(authorization)
    
    photo_service = PhotoUploadService()
    await photo_service.delete_photo(photo_id, user_id)
    
    return {"message": "Photo deleted successfully"}

