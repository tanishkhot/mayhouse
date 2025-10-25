"""
Experience API endpoints for Mayhouse Backend

Host endpoints for creating, managing, and submitting experiences.
Admin endpoints for reviewing and approving experiences.
"""

from typing import List, Optional
import json
from fastapi import APIRouter, HTTPException, status, Query, Path, Body
from pydantic import ValidationError
from app.schemas.experience import (
    ExperienceCreate,
    ExperienceUpdate,
    ExperienceResponse,
    ExperienceSummary,
    ExperienceStatus,
    ExperienceSubmission,
    ExperienceReview,
    AdminDecision,
)
from pydantic import BaseModel
from app.services.experience_service import experience_service

# Create routers
host_router = APIRouter(prefix="/experiences", tags=["Experiences - Host"])
admin_router = APIRouter(prefix="/admin/experiences", tags=["Experiences - Admin"])


# Request body schemas
class ExperienceCreateRequest(BaseModel):
    experience_data: ExperienceCreate
    host_id: str


class ExperienceUpdateRequest(BaseModel):
    update_data: ExperienceUpdate
    host_id: str


class ExperienceSubmitRequest(BaseModel):
    submission_data: ExperienceSubmission
    host_id: str


class ExperienceReviewRequest(BaseModel):
    review_data: ExperienceReview
    admin_user_id: str


# =============================================
# HOST EXPERIENCE ENDPOINTS
# =============================================


@host_router.post(
    "",
    response_model=ExperienceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Experience",
    description="Create a new experience (starts in draft status). Only approved hosts can create experiences.",
)
async def create_experience(request: ExperienceCreateRequest) -> ExperienceResponse:
    """
    Create a new experience.

    Requirements:
    - User must be authenticated and have host role (temporarily disabled)
    - Experience starts in 'draft' status
    - Must be submitted for admin review before going live

    The experience includes:
    - Rich content (title, description, promise, unique elements)
    - Location and logistics details
    - Pricing and capacity settings
    - Safety guidelines and accessibility notes
    """
    return await experience_service.create_experience(
        host_id=request.host_id, experience_data=request.experience_data
    )


@host_router.get(
    "/my",
    response_model=List[ExperienceSummary],
    summary="Get My Experiences",
    description="Get all experiences created by the current host",
)
async def get_my_experiences(
    host_id: str = Query(
        ..., description="Host User ID (temporary - will be from auth later)"
    ),
    status_filter: Optional[ExperienceStatus] = Query(
        None, description="Filter by experience status"
    ),
) -> List[ExperienceSummary]:
    """
    Get all experiences for the current host.

    Features:
    - Filter by status (draft, submitted, approved, rejected)
    - Sorted by most recently updated
    - Shows summary information for quick overview
    """
    return await experience_service.get_host_experiences(
        host_id=host_id, status_filter=status_filter
    )


@host_router.get(
    "/{experience_id}",
    response_model=ExperienceResponse,
    summary="Get Experience Details",
    description="Get detailed information about a specific experience",
)
async def get_experience_details(
    experience_id: str = Path(..., description="Experience ID"),
    host_id: str = Query(
        ..., description="Host User ID (temporary - will be from auth later)"
    ),
) -> ExperienceResponse:
    """
    Get detailed information about a specific experience.

    Returns:
    - Full experience details
    - Current status and admin feedback
    - Creation and update timestamps
    """
    return await experience_service.get_experience_by_id(
        experience_id=experience_id, host_id=host_id
    )


@host_router.put(
    "/{experience_id}",
    response_model=ExperienceResponse,
    summary="Update Experience",
    description="Update an existing experience (draft or rejected only)",
)
async def update_experience(
    experience_id: str = Path(..., description="Experience ID"),
    request: ExperienceUpdateRequest = Body(...),
) -> ExperienceResponse:
    """
    Update an existing experience.

    Requirements:
    - Experience must be in 'draft' or 'rejected' status
    - Cannot update 'submitted' or 'approved' experiences
    - Rejected experiences automatically change to 'draft' when updated

    Features:
    - Partial updates supported (only provided fields are updated)
    - Validates business rules (capacity, pricing, etc.)
    - Updates timestamp automatically
    """
    return await experience_service.update_experience(
        experience_id=experience_id,
        host_id=request.host_id,
        update_data=request.update_data,
    )


@host_router.post(
    "/{experience_id}/submit",
    response_model=ExperienceResponse,
    summary="Submit Experience for Review",
    description="Submit a draft experience for admin review",
)
async def submit_experience_for_review(
    experience_id: str = Path(..., description="Experience ID"),
    request: ExperienceSubmitRequest = Body(...),
) -> ExperienceResponse:
    """
    Submit experience for admin review.

    Requirements:
    - Experience must be in 'draft' status
    - All required fields must be completed
    - Experience will move to 'submitted' status

    Process:
    1. Validates experience completeness
    2. Changes status to 'submitted'
    3. Adds submission notes for admin
    4. Notifies admin team for review
    """
    return await experience_service.submit_experience_for_review(
        experience_id=experience_id,
        host_id=request.host_id,
        submission_data=request.submission_data,
    )


@host_router.delete(
    "/{experience_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Experience",
    description="Delete an experience (draft or rejected only)",
)
async def delete_experience(
    experience_id: str = Path(..., description="Experience ID"),
    host_id: str = Query(
        ..., description="Host User ID (temporary - will be from auth later)"
    ),
) -> None:
    """
    Delete an experience.

    Requirements:
    - Experience must be in 'draft' or 'rejected' status
    - Cannot delete 'submitted' or 'approved' experiences
    - This action is permanent and cannot be undone
    """
    # Get experience to verify ownership and status
    experience = await experience_service.get_experience_by_id(experience_id, host_id)

    if experience.status not in [ExperienceStatus.DRAFT, ExperienceStatus.REJECTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete experience with status '{experience.status}'. Only draft or rejected experiences can be deleted.",
        )

    # TODO: Implement actual deletion in service
    # For now, we'll just return success
    return None


# =============================================
# ADMIN EXPERIENCE ENDPOINTS
# =============================================


@admin_router.get(
    "",
    response_model=List[ExperienceSummary],
    summary="List All Experiences (Admin)",
    description="Get list of experiences for admin management",
)
async def list_experiences_for_admin(
    status_filter: Optional[ExperienceStatus] = Query(
        None, description="Filter by experience status"
    ),
    limit: int = Query(50, ge=1, le=100, description="Number of experiences to return"),
    offset: int = Query(0, ge=0, description="Number of experiences to skip"),
) -> List[ExperienceSummary]:
    """
    Get experiences for admin management.

    Features:
    - Filter by status (all, draft, submitted, approved, rejected)
    - Pagination support
    - Sorted by most recently updated
    - Admin can see all experiences from all hosts
    """
    return await experience_service.get_experiences_for_admin(
        status_filter=status_filter, limit=limit, offset=offset
    )


@admin_router.get(
    "/pending",
    response_model=List[ExperienceSummary],
    summary="Get Pending Experiences",
    description="Get experiences pending admin review",
)
async def get_pending_experiences(
    limit: int = Query(50, ge=1, le=100, description="Number of experiences to return"),
    offset: int = Query(0, ge=0, description="Number of experiences to skip"),
) -> List[ExperienceSummary]:
    """
    Get experiences pending admin review.

    Returns experiences with 'submitted' status that need admin review.
    Sorted by submission date (oldest first for fair review order).
    """
    return await experience_service.get_experiences_for_admin(
        status_filter=ExperienceStatus.SUBMITTED, limit=limit, offset=offset
    )


@admin_router.get(
    "/{experience_id}",
    response_model=ExperienceResponse,
    summary="Get Experience Details (Admin)",
    description="Get detailed information about a specific experience for admin review",
)
async def get_experience_for_admin(
    experience_id: str = Path(..., description="Experience ID")
) -> ExperienceResponse:
    """
    Get detailed experience information for admin review.

    Returns:
    - Full experience details
    - Current status and any existing feedback
    - Host information and submission history
    """
    return await experience_service.get_experience_by_id(experience_id)


@admin_router.post(
    "/{experience_id}/review",
    response_model=ExperienceResponse,
    summary="Review Experience",
    description="Approve or reject an experience",
)
async def review_experience(
    experience_id: str = Path(..., description="Experience ID"),
    request: ExperienceReviewRequest = Body(...),
) -> ExperienceResponse:
    """
    Review an experience (approve or reject).

    Requirements:
    - Experience must be in 'submitted' status
    - Admin must provide decision and feedback
    - Decision is final and cannot be changed

    Process:
    1. Validates experience is ready for review
    2. Updates status to 'approved' or 'rejected'
    3. Records admin feedback and decision reason
    4. Notifies host of decision
    5. If approved, experience becomes available for booking
    """
    return await experience_service.review_experience(
        experience_id=experience_id,
        review_data=request.review_data,
        admin_user_id=request.admin_user_id,
    )


@admin_router.get(
    "/stats",
    summary="Experience Statistics",
    description="Get statistics and metrics for experience management",
)
async def get_experience_stats() -> dict:
    """
    Get experience management statistics.

    Returns:
    - Total experiences by status
    - Monthly trends and growth
    - Average review times
    - Host activity metrics
    """
    # TODO: Implement statistics in service
    return {
        "total_experiences": 0,
        "draft_count": 0,
        "submitted_count": 0,
        "approved_count": 0,
        "rejected_count": 0,
        "experiences_this_month": 0,
        "avg_approval_time_days": None,
        "host_count": 0,
    }
