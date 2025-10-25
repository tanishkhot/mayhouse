from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ApplicationStatus(str, Enum):
    """Host application status enumeration."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExperienceDomain(str, Enum):
    """Available experience domains for hosts."""

    FOOD = "food"
    CULTURE = "culture"
    HISTORY = "history"
    ART = "art"
    MUSIC = "music"
    ARCHITECTURE = "architecture"
    STREET_ART = "street_art"
    LOCAL_LIFE = "local_life"
    MARKETS = "markets"
    SPIRITUAL = "spiritual"
    NIGHTLIFE = "nightlife"
    PHOTOGRAPHY = "photography"


class DayOfWeek(str, Enum):
    """Days of the week for availability."""

    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class TimePreference(str, Enum):
    """Time preferences for hosting."""

    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"
    FLEXIBLE = "flexible"


class SampleExperienceIdea(BaseModel):
    """Sample experience idea from host application."""

    title: str = Field(..., min_length=5, max_length=100)
    description: str = Field(..., min_length=20, max_length=500)
    duration: int = Field(..., ge=30, le=480, description="Duration in minutes")
    max_participants: int = Field(..., ge=1, le=8, description="Maximum participants")


class AvailabilityPreferences(BaseModel):
    """Host availability preferences."""

    days: List[DayOfWeek] = Field(..., min_items=1, description="Available days")
    time_preference: TimePreference = Field(..., description="Preferred time slots")
    additional_notes: Optional[str] = Field(None, max_length=200)


class HostApplicationCreate(BaseModel):
    """Schema for creating a new host application."""

    # Experience domains and background
    experience_domains: List[ExperienceDomain] = Field(..., min_items=1, max_items=5)
    hosting_experience: str = Field(
        ..., min_length=50, max_length=1000, description="Previous hosting experience"
    )
    why_host: str = Field(
        ...,
        min_length=50,
        max_length=1000,
        description="Motivation for becoming a host",
    )

    # Sample experience
    sample_experience_idea: SampleExperienceIdea

    # Availability
    availability: AvailabilityPreferences

    # Additional information
    languages_spoken: List[str] = Field(
        default=["english"], description="Languages the host can communicate in"
    )
    special_skills: Optional[str] = Field(
        None, max_length=500, description="Special skills or unique knowledge"
    )

    # Legal and compliance
    background_check_consent: bool = Field(
        ..., description="Consent for background verification"
    )
    terms_accepted: bool = Field(..., description="Terms and conditions acceptance")
    marketing_consent: Optional[bool] = Field(
        default=False, description="Marketing communications consent"
    )

    # EIP-712 policy acceptances for audit trail
    policy_acceptances: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="EIP-712 policy acceptance records"
    )

    @validator("background_check_consent")
    def validate_background_consent(cls, v):
        if not v:
            raise ValueError("Background check consent is required")
        return v

    @validator("terms_accepted")
    def validate_terms_accepted(cls, v):
        if not v:
            raise ValueError("Terms and conditions must be accepted")
        return v


class HostApplicationUpdate(BaseModel):
    """Schema for updating host application (admin only)."""

    status: Optional[ApplicationStatus] = None
    admin_notes: Optional[str] = Field(None, max_length=1000)
    admin_feedback: Optional[Dict[str, Any]] = None


class AdminFeedback(BaseModel):
    """Structured admin feedback for applications."""

    decision_reason: str = Field(
        ..., max_length=500, description="Reason for approval/rejection"
    )
    strengths: Optional[List[str]] = Field(None, description="Application strengths")
    improvements: Optional[List[str]] = Field(None, description="Areas for improvement")
    next_steps: Optional[str] = Field(
        None, max_length=300, description="Next steps for applicant"
    )


class HostApplicationResponse(BaseModel):
    """Schema for host application responses."""

    id: str
    user_id: str
    status: ApplicationStatus
    application_data: Dict[str, Any]
    admin_notes: Optional[str] = None
    admin_feedback: Optional[Dict[str, Any]] = None
    applied_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

    class Config:
        from_attributes = True


class HostApplicationSummary(BaseModel):
    """Summary view of host application for lists."""

    id: str
    user_id: str
    user_name: str  # Joined from users table
    user_email: str  # Joined from users table
    status: ApplicationStatus
    experience_domains: List[str]
    applied_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HostApplicationReview(BaseModel):
    """Schema for admin review of host applications."""

    decision: ApplicationStatus = Field(..., description="Approval decision")
    admin_notes: Optional[str] = Field(None, max_length=1000)
    feedback: AdminFeedback

    @validator("decision")
    def validate_decision(cls, v):
        if v == ApplicationStatus.PENDING:
            raise ValueError("Decision cannot be pending")
        return v


class HostApplicationStats(BaseModel):
    """Statistics for host applications dashboard."""

    total_applications: int
    pending_count: int
    approved_count: int
    rejected_count: int
    applications_this_month: int
    avg_review_time_days: Optional[float] = None


# Error schemas
class HostApplicationError(BaseModel):
    """Host application error response."""

    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
