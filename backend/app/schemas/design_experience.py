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
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
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


class ExperienceGenerationRequest(BaseModel):
    """Request schema for AI experience generation."""
    description: str = Field(
        ..., 
        min_length=20, 
        max_length=2000, 
        description="Natural language description of the experience"
    )


class ExperienceGenerationResponse(BaseModel):
    """Response schema for AI-generated experience fields."""
    title: str
    description: str
    what_to_expect: str  # unique_element
    domain: str
    theme: Optional[str] = None
    duration_minutes: int
    max_capacity: int
    price_inr: Optional[float] = None
    neighborhood: Optional[str] = None
    meeting_point: Optional[str] = None
    requirements: Optional[List[str]] = None
    what_to_bring: Optional[List[str]] = None
    what_to_know: Optional[str] = None


class QAAnswer(BaseModel):
    """Schema for a single Q&A answer."""
    question_id: str = Field(..., description="Question identifier (e.g., 'q1', 'q2')")
    question_text: str = Field(..., description="The question text")
    answer: Optional[str] = Field(None, description="Text answer for textarea questions")
    structured_data: Optional[Dict[str, Any]] = Field(
        None, description="Structured data for number/structured questions"
    )
    photo_ids: Optional[List[str]] = Field(None, description="Photo IDs for photo questions")
    answered_at: str = Field(..., description="ISO timestamp when answered")
    character_count: Optional[int] = Field(None, description="Character count for text answers")


class QASaveRequest(BaseModel):
    """Request schema for saving Q&A answers to a session."""
    session_id: str = Field(..., description="Design session ID")
    qa_answers: List[QAAnswer] = Field(..., description="List of Q&A answers")


class QAGenerationRequest(BaseModel):
    """Request schema for generating experience from Q&A answers."""
    qa_answers: List[QAAnswer] = Field(
        ..., 
        description="List of Q&A answers to extract experience data from"
    )


