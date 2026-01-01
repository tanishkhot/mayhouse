"""
Experience Schemas for Mayhouse Backend

Pydantic models for experience creation, management, and approval workflows.
Covers the complete experience lifecycle: draft → submitted → approved/rejected.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from decimal import Decimal
from enum import Enum


class ExperienceStatus(str, Enum):
    """Experience status enumeration matching database enum."""

    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class ExperienceDomain(str, Enum):
    """Experience domain categories."""

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


# =============================================
# EXPERIENCE CREATION & MANAGEMENT SCHEMAS
# =============================================


class ExperienceCreate(BaseModel):
    """Schema for creating a new experience."""

    # Core Experience Details
    title: str = Field(
        ..., min_length=10, max_length=200, description="Experience title"
    )
    promise: str = Field(
        ...,
        min_length=20,
        max_length=200,
        description="2-line compelling promise to travelers",
    )
    description: str = Field(
        ..., min_length=100, max_length=2000, description="Full experience description"
    )
    unique_element: str = Field(
        ...,
        min_length=50,
        max_length=500,
        description="What makes this experience truly special",
    )
    host_story: str = Field(
        ...,
        min_length=50,
        max_length=1000,
        description="Personal story behind the experience",
    )

    # Categorization
    experience_domain: ExperienceDomain = Field(
        ..., description="Primary experience category"
    )
    experience_theme: Optional[str] = Field(
        None, max_length=100, description="Specific theme within domain"
    )

    # Location Details
    country: str = Field(default="India", max_length=100)
    city: str = Field(default="Mumbai", max_length=100)
    neighborhood: Optional[str] = Field(
        None, max_length=100, description="Local area/neighborhood"
    )
    meeting_landmark: str = Field(
        ..., max_length=200, description="Well-known meeting landmark"
    )
    meeting_point_details: str = Field(
        ..., max_length=500, description="Detailed meeting instructions"
    )
    latitude: Optional[Decimal] = Field(
        None, ge=-90, le=90, description="Latitude coordinate"
    )
    longitude: Optional[Decimal] = Field(
        None, ge=-180, le=180, description="Longitude coordinate"
    )
    route_data: Optional[Dict[str, Any]] = Field(
        None, description="Route waypoints and geometry (JSONB)"
    )
    first_event_run_date: Optional[date] = Field(
        None, description="Optional proposed first event run date"
    )
    first_event_run_time: Optional[time] = Field(
        None, description="Optional proposed first event run start time"
    )

    # Experience Logistics
    duration_minutes: int = Field(
        ..., ge=30, le=480, description="Experience duration (30 min to 8 hours)"
    )
    traveler_min_capacity: int = Field(default=1, ge=1, le=4)
    traveler_max_capacity: int = Field(
        ..., ge=1, le=4, description="Maximum travelers for intimate experience"
    )
    price_inr: Decimal = Field(
        ..., gt=0, description="Experience price in Indian Rupees"
    )

    # Experience Content
    inclusions: List[str] = Field(
        ..., min_items=1, description="What's included in the experience"
    )
    traveler_should_bring: Optional[List[str]] = Field(
        default=[], description="What travelers should bring"
    )
    accessibility_notes: Optional[List[str]] = Field(
        default=[], description="Accessibility considerations"
    )
    weather_contingency_plan: Optional[str] = Field(
        None, max_length=500, description="Backup plan for weather"
    )
    photo_sharing_consent_required: bool = Field(
        default=True, description="Require photo consent from travelers"
    )
    experience_safety_guidelines: Optional[str] = Field(
        None, max_length=1000, description="Safety guidelines and considerations"
    )

    @validator("traveler_max_capacity")
    def validate_max_capacity(cls, v, values):
        if "traveler_min_capacity" in values and v < values["traveler_min_capacity"]:
            raise ValueError("Maximum capacity must be >= minimum capacity")
        return v


class ExperienceUpdate(BaseModel):
    """Schema for updating an existing experience."""

    # All fields optional for partial updates
    title: Optional[str] = Field(None, min_length=10, max_length=200)
    promise: Optional[str] = Field(None, min_length=20, max_length=200)
    description: Optional[str] = Field(None, min_length=100, max_length=2000)
    unique_element: Optional[str] = Field(None, min_length=50, max_length=500)
    host_story: Optional[str] = Field(None, min_length=50, max_length=1000)
    experience_domain: Optional[ExperienceDomain] = None
    experience_theme: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    neighborhood: Optional[str] = Field(None, max_length=100)
    meeting_landmark: Optional[str] = Field(None, max_length=200)
    meeting_point_details: Optional[str] = Field(None, max_length=500)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    route_data: Optional[Dict[str, Any]] = Field(
        None, description="Route waypoints and geometry"
    )
    first_event_run_date: Optional[date] = None
    first_event_run_time: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, ge=30, le=480)
    traveler_min_capacity: Optional[int] = Field(None, ge=1, le=4)
    traveler_max_capacity: Optional[int] = Field(None, ge=1, le=4)
    price_inr: Optional[Decimal] = Field(None, gt=0)
    inclusions: Optional[List[str]] = None
    traveler_should_bring: Optional[List[str]] = None
    accessibility_notes: Optional[List[str]] = None
    weather_contingency_plan: Optional[str] = Field(None, max_length=500)
    photo_sharing_consent_required: Optional[bool] = None
    experience_safety_guidelines: Optional[str] = Field(None, max_length=1000)


class ExperienceResponse(BaseModel):
    """Schema for experience responses."""

    id: str
    host_id: str
    title: str
    promise: str
    description: str
    unique_element: str
    host_story: str
    experience_domain: str
    experience_theme: Optional[str]
    country: str
    city: str
    neighborhood: Optional[str]
    meeting_landmark: str
    meeting_point_details: str
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    route_data: Optional[Dict[str, Any]] = None
    first_event_run_date: Optional[date] = None
    first_event_run_time: Optional[time] = None
    duration_minutes: int
    traveler_min_capacity: int
    traveler_max_capacity: int
    price_inr: Decimal
    inclusions: List[str]
    traveler_should_bring: List[str]
    accessibility_notes: List[str]
    weather_contingency_plan: Optional[str]
    photo_sharing_consent_required: bool
    experience_safety_guidelines: Optional[str]
    status: ExperienceStatus
    admin_feedback: Optional[str]
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime]
    approved_by: Optional[str]

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}


class ExperienceSummary(BaseModel):
    """Summary view of experience for lists."""

    id: str
    host_id: str
    title: str
    promise: str
    experience_domain: str
    city: str
    neighborhood: Optional[str]
    route_data: Optional[Dict[str, Any]] = None
    first_event_run_date: Optional[date] = None
    first_event_run_time: Optional[time] = None
    duration_minutes: int
    traveler_max_capacity: int
    price_inr: Decimal
    status: ExperienceStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {Decimal: lambda v: float(v)}


# =============================================
# ADMIN REVIEW & APPROVAL SCHEMAS
# =============================================


class AdminDecision(str, Enum):
    """Admin decision options for experience review."""

    APPROVED = "approved"
    REJECTED = "rejected"


class ExperienceAdminFeedback(BaseModel):
    """Structured admin feedback for experience reviews."""

    decision_reason: str = Field(
        ..., max_length=500, description="Primary reason for approval/rejection"
    )
    content_quality_notes: Optional[str] = Field(
        None, max_length=500, description="Notes on content quality"
    )
    safety_concerns: Optional[List[str]] = Field(
        default=[], description="Any safety-related concerns"
    )
    improvement_suggestions: Optional[List[str]] = Field(
        default=[], description="Specific improvement recommendations"
    )
    pricing_feedback: Optional[str] = Field(
        None, max_length=200, description="Feedback on pricing"
    )
    next_steps: Optional[str] = Field(
        None, max_length=300, description="Next steps for the host"
    )


class ExperienceReview(BaseModel):
    """Schema for admin review of experiences."""

    decision: AdminDecision = Field(..., description="Approval decision")
    admin_feedback: Optional[str] = Field(
        None, max_length=1000, description="General admin notes"
    )
    structured_feedback: ExperienceAdminFeedback = Field(
        ..., description="Structured feedback"
    )


class ExperienceStats(BaseModel):
    """Statistics for experience management dashboard."""

    total_experiences: int
    draft_count: int
    submitted_count: int
    approved_count: int
    rejected_count: int
    experiences_this_month: int
    avg_approval_time_days: Optional[float] = None
    host_count: int


# =============================================
# HOST DASHBOARD SCHEMAS
# =============================================


class HostExperienceDashboard(BaseModel):
    """Dashboard view for hosts to manage their experiences."""

    host_id: str
    host_name: str
    total_experiences: int
    draft_experiences: List[ExperienceSummary]
    submitted_experiences: List[ExperienceSummary]
    approved_experiences: List[ExperienceSummary]
    rejected_experiences: List[ExperienceSummary]
    recent_activity: List[Dict[str, Any]]


# =============================================
# SUBMISSION & WORKFLOW SCHEMAS
# =============================================


class ExperienceSubmission(BaseModel):
    """Schema for submitting experience for admin review."""

    submission_notes: Optional[str] = Field(
        None, max_length=500, description="Notes for the admin reviewer"
    )
    ready_for_review: bool = Field(
        default=True, description="Confirm experience is ready for review"
    )


# =============================================
# ERROR SCHEMAS
# =============================================


class ExperienceError(BaseModel):
    """Experience-related error responses."""

    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    experience_id: Optional[str] = None
