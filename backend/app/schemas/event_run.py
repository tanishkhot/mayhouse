"""
Event Run schemas for API request/response validation.

Event runs are scheduled instances of approved experiences that travelers can book.
They handle capacity management, pricing, and availability tracking.
"""

from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator


class EventRunStatus(str, Enum):
    """Event run status enum matching database enum."""

    SCHEDULED = "scheduled"
    LOW_SEATS = "low_seats"
    SOLD_OUT = "sold_out"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EventRunCreate(BaseModel):
    """Schema for creating a new event run."""

    experience_id: str = Field(..., description="ID of the approved experience")
    start_datetime: datetime = Field(..., description="Event start date and time")
    end_datetime: datetime = Field(..., description="Event end date and time")
    max_capacity: int = Field(
        ..., ge=1, le=4, description="Maximum travelers allowed (1-4)"
    )
    special_pricing_inr: Optional[Decimal] = Field(
        None, ge=0, description="Override experience base price"
    )
    host_meeting_instructions: Optional[str] = Field(
        None, max_length=500, description="Special meeting instructions"
    )
    group_pairing_enabled: bool = Field(
        False, description="Allow solo travelers to be paired"
    )

    @field_validator("end_datetime")
    @classmethod
    def end_after_start(cls, v, info):
        if "start_datetime" in info.data and v <= info.data["start_datetime"]:
            raise ValueError("End datetime must be after start datetime")
        return v

    @field_validator("start_datetime")
    @classmethod
    def start_in_future(cls, v):
        from datetime import timezone

        now = datetime.now(timezone.utc) if v.tzinfo else datetime.now()
        if v <= now:
            raise ValueError("Event must be scheduled for a future date")
        return v

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat(), Decimal: lambda v: float(v)}
        json_schema_extra = {
            "example": {
                "experience_id": "123e4567-e89b-12d3-a456-426614174000",
                "start_datetime": "2024-10-15T10:00:00",
                "end_datetime": "2024-10-15T13:00:00",
                "max_capacity": 4,
                "special_pricing_inr": 1500.00,
                "host_meeting_instructions": "Look for me near the fountain wearing a red cap",
                "group_pairing_enabled": True,
            }
        }


class EventRunUpdate(BaseModel):
    """Schema for updating an event run."""

    start_datetime: Optional[datetime] = Field(
        None, description="Updated start date and time"
    )
    end_datetime: Optional[datetime] = Field(
        None, description="Updated end date and time"
    )
    max_capacity: Optional[int] = Field(
        None, ge=1, le=4, description="Updated capacity"
    )
    special_pricing_inr: Optional[Decimal] = Field(
        None, ge=0, description="Updated special pricing"
    )
    status: Optional[EventRunStatus] = Field(None, description="Updated status")
    host_meeting_instructions: Optional[str] = Field(
        None, max_length=500, description="Updated meeting instructions"
    )
    group_pairing_enabled: Optional[bool] = Field(
        None, description="Updated pairing setting"
    )

    @model_validator(mode="after")
    def validate_datetime_pair(self):
        from datetime import timezone

        start = self.start_datetime
        end = self.end_datetime

        if start and end and end <= start:
            raise ValueError("End datetime must be after start datetime")

        if start:
            now = datetime.now(timezone.utc) if start.tzinfo else datetime.now()
            if start <= now:
                raise ValueError("Event must be scheduled for a future date")

        return self

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat(), Decimal: lambda v: float(v)}


class EventRunBookingSummary(BaseModel):
    """Summary of bookings for an event run."""

    total_bookings: int = Field(..., description="Total number of bookings")
    confirmed_bookings: int = Field(..., description="Number of confirmed bookings")
    total_travelers: int = Field(..., description="Total travelers across all bookings")
    available_spots: int = Field(..., description="Remaining capacity")


class EventRunResponse(BaseModel):
    """Complete event run information."""

    id: str = Field(..., description="Event run ID")
    experience_id: str = Field(..., description="Associated experience ID")
    start_datetime: datetime = Field(..., description="Event start date and time")
    end_datetime: datetime = Field(..., description="Event end date and time")
    max_capacity: int = Field(..., description="Maximum travelers allowed")
    special_pricing_inr: Optional[Decimal] = Field(
        None, description="Special pricing override"
    )
    status: EventRunStatus = Field(..., description="Current event run status")
    host_meeting_instructions: Optional[str] = Field(
        None, description="Meeting instructions from host"
    )
    group_pairing_enabled: bool = Field(..., description="Whether pairing is enabled")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Computed fields
    booking_summary: Optional[EventRunBookingSummary] = Field(
        None, description="Booking statistics"
    )
    detailed_bookings: Optional[List[dict]] = Field(
        None, description="Detailed booking information (admin only)"
    )

    # Related data (when included)
    experience_title: Optional[str] = Field(None, description="Experience title")
    experience_domain: Optional[str] = Field(None, description="Experience domain")
    host_name: Optional[str] = Field(None, description="Host full name")
    price_inr: Optional[Decimal] = Field(
        None, description="Effective price (base or special)"
    )

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat(), Decimal: lambda v: float(v)}
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174001",
                "experience_id": "123e4567-e89b-12d3-a456-426614174000",
                "start_datetime": "2024-10-15T10:00:00Z",
                "end_datetime": "2024-10-15T13:00:00Z",
                "max_capacity": 4,
                "special_pricing_inr": 1500.00,
                "status": "scheduled",
                "host_meeting_instructions": "Look for me near the fountain wearing a red cap",
                "group_pairing_enabled": True,
                "created_at": "2024-10-01T09:00:00Z",
                "updated_at": "2024-10-01T09:00:00Z",
                "booking_summary": {
                    "total_bookings": 2,
                    "confirmed_bookings": 2,
                    "total_travelers": 3,
                    "available_spots": 1,
                },
                "experience_title": "Hidden Street Art Walking Tour",
                "experience_domain": "art",
                "host_name": "Priya Sharma",
                "price_inr": 1500.00,
            }
        }


class EventRunSummary(BaseModel):
    """Lightweight event run information for lists."""

    id: str = Field(..., description="Event run ID")
    experience_id: str = Field(..., description="Associated experience ID")
    start_datetime: datetime = Field(..., description="Event start date and time")
    max_capacity: int = Field(..., description="Maximum travelers allowed")
    status: EventRunStatus = Field(..., description="Current status")
    available_spots: int = Field(..., description="Remaining capacity")
    price_inr: Decimal = Field(..., description="Effective price")

    # Essential experience info
    experience_title: str = Field(..., description="Experience title")
    experience_domain: str = Field(..., description="Experience domain")
    neighborhood: Optional[str] = Field(None, description="Experience neighborhood")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat(), Decimal: lambda v: float(v)}


class ExploreEventRun(BaseModel):
    """Event run information for the explore endpoint with rich experience and host details."""

    id: str = Field(..., description="Event run ID")
    start_datetime: datetime = Field(..., description="Event start date and time")
    end_datetime: datetime = Field(..., description="Event end date and time")
    max_capacity: int = Field(..., description="Maximum travelers allowed")
    available_spots: int = Field(..., description="Remaining capacity")
    price_inr: Decimal = Field(..., description="Effective price (base or special)")
    status: EventRunStatus = Field(..., description="Current status")

    # Experience details
    experience_id: str = Field(..., description="Experience ID")
    experience_title: str = Field(..., description="Experience title")
    experience_promise: Optional[str] = Field(
        None, description="Experience promise/tagline"
    )
    experience_domain: str = Field(
        ..., description="Experience domain (food, art, culture, etc.)"
    )
    experience_theme: Optional[str] = Field(
        None, description="Specific theme within domain"
    )
    neighborhood: Optional[str] = Field(None, description="Experience neighborhood")
    meeting_landmark: Optional[str] = Field(None, description="Meeting landmark")
    duration_minutes: int = Field(..., description="Experience duration in minutes")

    # Host details
    host_id: str = Field(..., description="Host user ID")
    host_name: str = Field(..., description="Host full name")
    host_meeting_instructions: Optional[str] = Field(
        None, description="Meeting instructions from host"
    )
    group_pairing_enabled: bool = Field(..., description="Whether pairing is enabled")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat(), Decimal: lambda v: float(v)}
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174001",
                "start_datetime": "2025-10-15T10:00:00Z",
                "end_datetime": "2025-10-15T13:00:00Z",
                "max_capacity": 4,
                "available_spots": 2,
                "price_inr": 2500.00,
                "status": "scheduled",
                "experience_id": "123e4567-e89b-12d3-a456-426614174000",
                "experience_title": "Hidden Mumbai Street Art Walking Tour",
                "experience_promise": "Discover authentic street art with a local artist",
                "experience_domain": "art",
                "experience_theme": "street_art",
                "neighborhood": "Bandra",
                "meeting_landmark": "Bandra-Worli Sea Link viewpoint",
                "duration_minutes": 180,
                "host_id": "host123",
                "host_name": "Arjun Mehta",
                "host_meeting_instructions": "Look for me wearing a red Mayhouse cap near the viewpoint",
                "group_pairing_enabled": True,
            }
        }


class EventRunFilterParams(BaseModel):
    """Parameters for filtering event runs."""

    experience_id: Optional[str] = Field(
        None, description="Filter by specific experience"
    )
    start_date: Optional[datetime] = Field(
        None, description="Filter runs starting after this date"
    )
    end_date: Optional[datetime] = Field(
        None, description="Filter runs starting before this date"
    )
    domain: Optional[str] = Field(None, description="Filter by experience domain")
    neighborhood: Optional[str] = Field(None, description="Filter by neighborhood")
    status: Optional[EventRunStatus] = Field(None, description="Filter by status")
    min_price: Optional[Decimal] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[Decimal] = Field(None, ge=0, description="Maximum price filter")
    available_only: bool = Field(
        True, description="Only show runs with available spots"
    )

    limit: int = Field(50, ge=1, le=100, description="Number of results to return")
    offset: int = Field(0, ge=0, description="Number of results to skip")

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
        if self.min_price and self.max_price and self.max_price <= self.min_price:
            raise ValueError("Max price must be greater than min price")
        return self

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat(), Decimal: lambda v: float(v)}


class EventRunStats(BaseModel):
    """Statistics for event runs (admin dashboard)."""

    total_event_runs: int = Field(..., description="Total event runs created")
    scheduled_runs: int = Field(..., description="Currently scheduled runs")
    completed_runs: int = Field(..., description="Successfully completed runs")
    cancelled_runs: int = Field(..., description="Cancelled runs")
    upcoming_runs_7_days: int = Field(..., description="Runs in next 7 days")
    avg_capacity_utilization: float = Field(
        ..., description="Average capacity utilization percentage"
    )

    # Status breakdown
    status_counts: dict = Field(..., description="Count by status")

    # Capacity insights
    total_capacity_offered: int = Field(
        ..., description="Total spots offered across all runs"
    )
    total_spots_booked: int = Field(..., description="Total spots booked")
    utilization_rate: float = Field(
        ..., description="Overall capacity utilization rate"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "total_event_runs": 150,
                "scheduled_runs": 45,
                "completed_runs": 89,
                "cancelled_runs": 16,
                "upcoming_runs_7_days": 12,
                "avg_capacity_utilization": 78.5,
                "status_counts": {
                    "scheduled": 45,
                    "low_seats": 8,
                    "sold_out": 15,
                    "completed": 89,
                    "cancelled": 16,
                },
                "total_capacity_offered": 600,
                "total_spots_booked": 471,
                "utilization_rate": 78.5,
            }
        }
