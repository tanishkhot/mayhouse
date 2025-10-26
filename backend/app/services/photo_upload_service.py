"""
Photo Upload Service for Mayhouse Backend

Handles photo uploads to Supabase Storage and database management.
"""

import os
import uuid
from typing import Optional, List, BinaryIO
from datetime import datetime
from fastapi import HTTPException, UploadFile
from supabase import Client

from app.core.database import get_service_client
from app.core.config import get_settings


class PhotoUploadService:
    """Service for handling experience photo uploads."""
    
    STORAGE_BUCKET = "experience-photos"
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    
    def __init__(self):
        self.settings = get_settings()
        # Ensure Supabase URL has trailing slash for storage operations
        supabase_url = self.settings.supabase_url
        if not supabase_url.endswith('/'):
            supabase_url += '/'
        self.supabase: Client = get_service_client()
    
    def _validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file."""
        
        # Check file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size (if content_length is available)
        if hasattr(file, 'size') and file.size and file.size > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {self.MAX_FILE_SIZE / (1024*1024)}MB"
            )
    
    def _generate_unique_filename(self, original_filename: str, experience_id: str) -> str:
        """Generate a unique filename for storage."""
        
        file_ext = os.path.splitext(original_filename)[1].lower()
        unique_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        return f"experiences/{experience_id}/{timestamp}_{unique_id}{file_ext}"
    
    async def upload_photo_to_storage(
        self,
        file: UploadFile,
        experience_id: str
    ) -> str:
        """
        Upload photo to Supabase Storage.
        
        Args:
            file: The uploaded file
            experience_id: ID of the experience
            
        Returns:
            Public URL of the uploaded photo
        """
        
        # Validate file
        self._validate_file(file)
        
        # Generate unique filename
        storage_path = self._generate_unique_filename(file.filename, experience_id)
        
        try:
            # Read file content
            file_content = await file.read()
            
            # Upload to Supabase Storage
            result = self.supabase.storage.from_(self.STORAGE_BUCKET).upload(
                path=storage_path,
                file=file_content,
                file_options={
                    "content-type": file.content_type or "image/jpeg",
                    "cache-control": "3600",
                    "upsert": "false"
                }
            )
            
            # Get public URL
            public_url = self.supabase.storage.from_(self.STORAGE_BUCKET).get_public_url(storage_path)
            
            return public_url
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload photo to storage: {str(e)}"
            )
        finally:
            # Reset file pointer in case it's needed again
            await file.seek(0)
    
    async def create_photo_record(
        self,
        experience_id: str,
        photo_url: str,
        is_cover_photo: bool = False,
        display_order: int = 0,
        caption: Optional[str] = None
    ) -> dict:
        """
        Create a photo record in the database.
        
        Args:
            experience_id: ID of the experience
            photo_url: URL of the uploaded photo
            is_cover_photo: Whether this is the cover photo
            display_order: Display order
            caption: Optional caption
            
        Returns:
            Created photo record
        """
        
        try:
            # If this is a cover photo, unset any existing cover photos
            if is_cover_photo:
                self.supabase.table("experience_photos").update({
                    "is_cover_photo": False
                }).eq("experience_id", experience_id).eq("is_cover_photo", True).execute()
            
            # Create photo record
            photo_data = {
                "experience_id": experience_id,
                "photo_url": photo_url,
                "is_cover_photo": is_cover_photo,
                "display_order": display_order,
                "caption": caption,
                "uploaded_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("experience_photos").insert(photo_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create photo record")
            
            return result.data[0]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create photo record: {str(e)}"
            )
    
    async def get_experience_photos(self, experience_id: str) -> List[dict]:
        """Get all photos for an experience."""
        
        try:
            result = self.supabase.table("experience_photos").select("*").eq(
                "experience_id", experience_id
            ).order("display_order").execute()
            
            return result.data or []
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch photos: {str(e)}"
            )
    
    async def delete_photo(self, photo_id: str, user_id: str) -> None:
        """
        Delete a photo from storage and database.
        
        Args:
            photo_id: ID of the photo to delete
            user_id: ID of the user requesting deletion (for authorization)
        """
        
        try:
            # Get photo record
            photo_result = self.supabase.table("experience_photos").select(
                "*, experiences!inner(host_id)"
            ).eq("id", photo_id).execute()
            
            if not photo_result.data:
                raise HTTPException(status_code=404, detail="Photo not found")
            
            photo = photo_result.data[0]
            
            # Check authorization (user must be the host)
            if photo.get("experiences", {}).get("host_id") != user_id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this photo")
            
            # Extract storage path from URL
            photo_url = photo.get("photo_url", "")
            # Parse the storage path (assuming standard Supabase storage URL format)
            # Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
            if f"/storage/v1/object/public/{self.STORAGE_BUCKET}/" in photo_url:
                storage_path = photo_url.split(f"{self.STORAGE_BUCKET}/")[1]
                
                # Delete from storage
                try:
                    self.supabase.storage.from_(self.STORAGE_BUCKET).remove([storage_path])
                except Exception as storage_error:
                    print(f"Warning: Failed to delete from storage: {storage_error}")
                    # Continue with database deletion even if storage deletion fails
            
            # Delete from database
            self.supabase.table("experience_photos").delete().eq("id", photo_id).execute()
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete photo: {str(e)}"
            )
    
    async def update_photo_metadata(
        self,
        photo_id: str,
        user_id: str,
        is_cover_photo: Optional[bool] = None,
        display_order: Optional[int] = None,
        caption: Optional[str] = None
    ) -> dict:
        """Update photo metadata."""
        
        try:
            # Get photo and check authorization
            photo_result = self.supabase.table("experience_photos").select(
                "*, experiences!inner(host_id, id)"
            ).eq("id", photo_id).execute()
            
            if not photo_result.data:
                raise HTTPException(status_code=404, detail="Photo not found")
            
            photo = photo_result.data[0]
            experience_id = photo.get("experiences", {}).get("id")
            
            # Check authorization
            if photo.get("experiences", {}).get("host_id") != user_id:
                raise HTTPException(status_code=403, detail="Not authorized to update this photo")
            
            # Build update data
            update_data = {}
            if is_cover_photo is not None:
                update_data["is_cover_photo"] = is_cover_photo
                
                # If setting as cover photo, unset other cover photos
                if is_cover_photo:
                    self.supabase.table("experience_photos").update({
                        "is_cover_photo": False
                    }).eq("experience_id", experience_id).eq("is_cover_photo", True).neq(
                        "id", photo_id
                    ).execute()
            
            if display_order is not None:
                update_data["display_order"] = display_order
            
            if caption is not None:
                update_data["caption"] = caption
            
            # Update photo
            result = self.supabase.table("experience_photos").update(
                update_data
            ).eq("id", photo_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to update photo")
            
            return result.data[0]
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update photo: {str(e)}"
            )

