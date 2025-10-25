from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""

    USER = "user"
    HOST = "host"
    ADMIN = "admin"


class UserBase(BaseModel):
    """Base User schema with common fields."""

    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    role: UserRole = UserRole.USER
    profile_image_url: Optional[str] = None
    preferences: Optional[dict[str, Any]] = None


class UserCreate(BaseModel):
    """Schema for user creation (signup)."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    # Note: username will be auto-generated, not provided by user


class UserUpdate(BaseModel):
    """Schema for user updates."""

    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    bio: Optional[str] = Field(None, max_length=500, description="User bio/description")
    profile_image_url: Optional[str] = None
    preferences: Optional[dict[str, Any]] = None


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    """Schema for user data responses (excludes sensitive information)."""

    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    role: UserRole
    profile_image_url: Optional[str] = None
    preferences: Optional[dict[str, Any]] = None
    email_confirmed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserProfile(BaseModel):
    """Extended user profile schema for detailed user information."""

    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    username: str  # Required for profile display
    bio: Optional[str] = None
    role: UserRole
    profile_image_url: Optional[str] = None
    preferences: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Profile completion fields
    is_profile_complete: bool = Field(
        default=False, description="Whether user profile is complete"
    )
    profile_completion_percentage: int = Field(
        default=0, ge=0, le=100, description="Profile completion percentage"
    )

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    """Schema for authentication responses."""

    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    """Schema for JWT token data."""

    user_id: str
    email: str
    role: UserRole
    exp: Optional[datetime] = None


class PasswordReset(BaseModel):
    """Schema for password reset request."""

    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation."""

    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class EmailVerification(BaseModel):
    """Schema for email verification."""

    token: str


# Error response schemas
class AuthError(BaseModel):
    """Schema for authentication error responses."""

    error: str
    message: str
    code: Optional[str] = None


class ValidationError(BaseModel):
    """Schema for validation error responses."""

    field: str
    message: str
    code: str


# Mobile OAuth schemas
class GoogleMobileAuth(BaseModel):
    """Schema for Google OAuth from mobile apps."""

    id_token: str = Field(..., description="Google ID token from mobile app")


class AppleMobileAuth(BaseModel):
    """Schema for Apple Sign-In from mobile apps."""

    id_token: str = Field(..., description="Apple ID token from mobile app")
    user_data: Optional[Dict[str, Any]] = Field(
        None, description="User data from Apple (first time only)"
    )
