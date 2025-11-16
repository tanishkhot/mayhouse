"""
Schemas for the Design Experience flow (session-based, stepwise).
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class DesignSessionStartRequest(BaseModel):
    experience_id: Optional[str] = Field(
        default=None, description="Resume an existing experience if provided"
    )


class DesignSessionStartResponse(BaseModel):
    session_id: str
    experience_id: str
    step: int = 1
    incomplete_fields: Dict[str, List[str]] = {}
    created_at: datetime
    updated_at: datetime


class StepBasicsPayload(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    what_to_expect: Optional[str] = Field(default=None, description="Unique element")
    domain: Optional[str] = None
    theme: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=30, le=480)


class StepLogisticsPayload(BaseModel):
    neighborhood: Optional[str] = None
    meeting_point: Optional[str] = None
    traveler_max_capacity: Optional[int] = Field(default=None, ge=1, le=4)
    price_inr: Optional[float] = Field(default=None, gt=0)
    requirements: Optional[List[str]] = None
    what_to_bring: Optional[List[str]] = None
    safety_guidelines: Optional[str] = None


class StepMediaReorder(BaseModel):
    order: List[str] = Field(default_factory=list, description="Photo IDs in new order")


class DesignSessionSummary(BaseModel):
    session_id: str
    experience_id: str
    step_completion: Dict[str, bool] = {}
    last_saved_at: Optional[datetime] = None
    updated_at: datetime


class DesignSessionReview(BaseModel):
    experience: Dict[str, Any] = {}
    photos: List[Dict[str, Any]] = []
    validation_report: Dict[str, Any] = {}


