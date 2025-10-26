"""
Experience Photo Schemas for Mayhouse Backend

Pydantic models for handling experience photo uploads and management.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime


class ExperiencePhotoBase(BaseModel):
    """Base schema for experience photos."""
    
    photo_url: str = Field(..., description="URL to the photo in storage")
    is_cover_photo: bool = Field(default=False, description="Whether this is the cover photo")
    display_order: int = Field(default=0, ge=0, description="Display order (0 = first)")
    caption: Optional[str] = Field(None, max_length=500, description="Optional photo caption")


class ExperiencePhotoCreate(ExperiencePhotoBase):
    """Schema for creating a new experience photo."""
    
    experience_id: str = Field(..., description="ID of the experience this photo belongs to")


class ExperiencePhotoUpdate(BaseModel):
    """Schema for updating experience photo metadata."""
    
    is_cover_photo: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)
    caption: Optional[str] = Field(None, max_length=500)


class ExperiencePhotoResponse(ExperiencePhotoBase):
    """Schema for experience photo responses."""
    
    id: str
    experience_id: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class ExperiencePhotoUploadResponse(BaseModel):
    """Response after successful photo upload."""
    
    photo_id: str
    photo_url: str
    is_cover_photo: bool
    message: str = "Photo uploaded successfully"


class ExperienceWithPhotos(BaseModel):
    """Experience response including its photos."""
    
    # Experience fields would be included from ExperienceResponse
    id: str
    title: str
    photos: List[ExperiencePhotoResponse] = []
    cover_photo: Optional[ExperiencePhotoResponse] = None
    
    class Config:
        from_attributes = True

