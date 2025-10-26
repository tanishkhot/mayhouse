"""
Event Run API endpoints for managing scheduled experience instances.

This module provides:
- Host endpoints: CRUD operations for managing their event runs
- Public endpoints: Discovery and filtering of available event runs
- Admin endpoints: Statistics and monitoring
"""

from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status, Query, Path, Body, Header
from pydantic import BaseModel

from app.schemas.event_run import (
    EventRunCreate,
    EventRunUpdate,
    EventRunResponse,
    EventRunSummary,
    EventRunStatus,
    EventRunStats,
    EventRunFilterParams,
)
from app.services.event_run_service import event_run_service
from app.core.jwt_utils import verify_token


# Router setup
host_router = APIRouter(prefix="/hosts/event-runs", tags=["Host Event Runs"])
public_router = APIRouter(prefix="/event-runs", tags=["Public Event Runs"])
admin_router = APIRouter(prefix="/admin/event-runs", tags=["Admin Event Runs"])


# Request body schemas
class EventRunCreateRequest(BaseModel):
    event_run_data: EventRunCreate
    host_id: str


class EventRunUpdateRequest(BaseModel):
    update_data: EventRunUpdate
    host_id: str


# =============================================
# HOST EVENT RUN ENDPOINTS
# =============================================


@host_router.post(
    "",
    response_model=EventRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Event Run",
    description="Create a new event run for one of your approved experiences",
)
async def create_event_run(
    event_run_data: EventRunCreate, authorization: str = Header(None)
) -> EventRunResponse:
    """
    Create a new event run for an approved experience.

    Requirements:
    - Experience must be approved
    - Host must own the experience
    - Start time must be in the future
    - Max capacity between 1-4 travelers

    Business Rules:
    - Uses experience base price unless special pricing is set
    - Status defaults to 'scheduled'
    - Host can add special meeting instructions
    - Maximum 2 active event runs per host
    """
    # Extract host_id from JWT token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    host_id = payload.get("sub")
    if not host_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    return await event_run_service.create_event_run(event_run_data, host_id)


@host_router.get(
    "",
    response_model=List[EventRunSummary],
    summary="List Host Event Runs",
    description="Get all event runs for the authenticated host",
)
async def list_host_event_runs(
    authorization: str = Header(None),
    status_filter: Optional[EventRunStatus] = Query(
        None, description="Filter by event run status"
    ),
    limit: int = Query(50, ge=1, le=100, description="Number of event runs to return"),
    offset: int = Query(0, ge=0, description="Number of event runs to skip"),
) -> List[EventRunSummary]:
    """
    Get all event runs for the current host.

    Features:
    - Filter by status (scheduled, low_seats, sold_out, completed, cancelled)
    - Sorted by start time (most recent first)
    - Shows booking summary and availability
    """
    # Extract host_id from JWT token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )

    host_id = payload.get("sub")
    if not host_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    return await event_run_service.get_host_event_runs(
        host_id=host_id, status_filter=status_filter, limit=limit, offset=offset
    )


@host_router.get(
    "/{event_run_id}",
    response_model=EventRunResponse,
    summary="Get Event Run Details",
    description="Get detailed information about a specific event run",
)
async def get_event_run_details(
    event_run_id: str = Path(..., description="Event Run ID"),
    host_id: str = Query(
        ..., description="Host User ID (temporary - will be from auth later)"
    ),
) -> EventRunResponse:
    """
    Get detailed information about a specific event run.

    Returns:
    - Full event run details
    - Booking summary and availability
    - Experience and host information
    """
    # Verify host ownership through experience
    event_run = await event_run_service.get_event_run_by_id(
        event_run_id, include_bookings=True
    )

    # Get experience to verify host ownership
    from app.services.experience_service import experience_service

    experience = await experience_service.get_experience_by_id(event_run.experience_id)

    if experience.host_id != host_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own event runs",
        )

    return event_run


@host_router.put(
    "/{event_run_id}",
    response_model=EventRunResponse,
    summary="Update Event Run",
    description="Update an existing event run",
)
async def update_event_run(
    event_run_id: str = Path(..., description="Event Run ID"),
    request: EventRunUpdateRequest = Body(...),
) -> EventRunResponse:
    """
    Update an existing event run.

    Requirements:
    - Host must own the event run
    - Cannot update completed or cancelled runs
    - Start time must be in the future

    Features:
    - Partial updates supported
    - Validates business rules
    - Updates timestamp automatically
    """
    return await event_run_service.update_event_run(
        event_run_id=event_run_id,
        update_data=request.update_data,
        host_id=request.host_id,
    )


@host_router.delete(
    "/{event_run_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Event Run",
    description="Delete an event run (only if no confirmed bookings)",
)
async def delete_event_run(
    event_run_id: str = Path(..., description="Event Run ID"),
    host_id: str = Query(
        ..., description="Host User ID (temporary - will be from auth later)"
    ),
) -> dict:
    """
    Delete an event run.

    Requirements:
    - Host must own the event run
    - No confirmed bookings allowed
    - Cannot delete completed runs

    Returns:
    - Success message with event run ID
    """
    return await event_run_service.delete_event_run(event_run_id, host_id)


# =============================================
# PUBLIC EVENT RUN ENDPOINTS
# =============================================


@public_router.get(
    "/{event_run_id}",
    response_model=EventRunResponse,
    summary="Get Event Run Details",
    description="Get detailed information about a specific event run (public access)",
)
async def get_event_run_details(
    event_run_id: str = Path(..., description="Event Run ID"),
) -> EventRunResponse:
    """
    Get detailed information about a specific event run.

    This endpoint is publicly accessible for viewing event run details.
    """
    try:
        return await event_run_service.get_event_run_details(event_run_id)
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event run with ID '{event_run_id}' not found",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch event run details: {str(e)}",
        )


@public_router.get(
    "",
    response_model=List[EventRunSummary],
    summary="List Available Event Runs",
    description="Get available event runs for public discovery",
)
async def list_available_event_runs(
    experience_id: Optional[str] = Query(
        None, description="Filter by specific experience"
    ),
    start_date: Optional[datetime] = Query(
        None, description="Filter runs starting after this date"
    ),
    end_date: Optional[datetime] = Query(
        None, description="Filter runs starting before this date"
    ),
    domain: Optional[str] = Query(None, description="Filter by experience domain"),
    neighborhood: Optional[str] = Query(None, description="Filter by neighborhood"),
    status: Optional[EventRunStatus] = Query(None, description="Filter by status"),
    min_price: Optional[Decimal] = Query(
        None, ge=0, description="Minimum price filter"
    ),
    max_price: Optional[Decimal] = Query(
        None, ge=0, description="Maximum price filter"
    ),
    available_only: bool = Query(
        True, description="Only show runs with available spots"
    ),
    limit: int = Query(50, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
) -> List[EventRunSummary]:
    """
    List available event runs for public discovery.

    Features:
    - Filter by experience, date range, domain, neighborhood
    - Price range filtering
    - Availability filtering
    - Sorted by start time (soonest first)
    - Only shows approved experiences
    """
    filters = EventRunFilterParams(
        experience_id=experience_id,
        start_date=start_date,
        end_date=end_date,
        domain=domain,
        neighborhood=neighborhood,
        status=status,
        min_price=min_price,
        max_price=max_price,
        available_only=available_only,
        limit=limit,
        offset=offset,
    )

    return await event_run_service.list_available_event_runs(filters)


@public_router.get(
    "/{event_run_id}",
    response_model=EventRunResponse,
    summary="Get Event Run Details (Public)",
    description="Get public information about an event run",
)
async def get_public_event_run_details(
    event_run_id: str = Path(..., description="Event Run ID")
) -> EventRunResponse:
    """
    Get public information about an event run.

    Returns:
    - Event run details
    - Experience information
    - Host information
    - Booking availability
    - No sensitive booking details
    """
    return await event_run_service.get_event_run_by_id(
        event_run_id, include_bookings=True
    )


# =============================================
# ADMIN EVENT RUN ENDPOINTS
# =============================================


@admin_router.get(
    "",
    response_model=List[EventRunSummary],
    summary="List All Event Runs (Admin)",
    description="Get all event runs for admin management",
)
async def list_all_event_runs(
    status_filter: Optional[EventRunStatus] = Query(
        None, description="Filter by event run status"
    ),
    limit: int = Query(50, ge=1, le=100, description="Number of event runs to return"),
    offset: int = Query(0, ge=0, description="Number of event runs to skip"),
) -> List[EventRunSummary]:
    """
    Get all event runs for admin management.

    Features:
    - Filter by status
    - Pagination support
    - Sorted by start time
    - Shows all hosts' event runs
    """
    # For admin, we'll get all event runs without host filtering
    # This is a simplified version - in production, you'd want proper admin filtering
    filters = EventRunFilterParams(
        status=status_filter,
        available_only=False,  # Show all runs for admin
        limit=limit,
        offset=offset,
    )

    return await event_run_service.list_available_event_runs(filters)


@admin_router.get(
    "/stats",
    response_model=EventRunStats,
    summary="Event Run Statistics",
    description="Get statistics and metrics for event runs",
)
async def get_event_run_stats() -> EventRunStats:
    """
    Get event run statistics for admin dashboard.

    Returns:
    - Total event runs by status
    - Capacity utilization metrics
    - Upcoming runs count
    - Booking statistics
    """
    return await event_run_service.get_event_run_stats()


@admin_router.get(
    "/{event_run_id}",
    response_model=EventRunResponse,
    summary="Get Event Run Details (Admin)",
    description="Get detailed event run information for admin review",
)
async def get_admin_event_run_details(
    event_run_id: str = Path(..., description="Event Run ID")
) -> EventRunResponse:
    """
    Get detailed event run information for admin review.

    Returns:
    - Full event run details
    - Detailed booking information
    - Host and experience information
    - All booking details (admin only)
    """
    return await event_run_service.get_event_run_by_id(
        event_run_id, include_bookings=True
    )


@admin_router.get(
    "/{event_run_id}/bookings",
    summary="Get Event Run Bookings (Admin)",
    description="Get detailed booking information for an event run",
)
async def get_event_run_bookings(
    event_run_id: str = Path(..., description="Event Run ID")
) -> List[dict]:
    """
    Get detailed booking information for an event run.

    Returns:
    - All bookings for the event run
    - Traveler details and contact information
    - Booking status and special requests
    - Host notes and check-in information
    """
    return await event_run_service.get_detailed_bookings(event_run_id)


@admin_router.put(
    "/{event_run_id}/status",
    response_model=EventRunResponse,
    summary="Update Event Run Status",
    description="Update event run status (admin only)",
)
async def update_event_run_status(
    event_run_id: str = Path(..., description="Event Run ID"),
    new_status: EventRunStatus = Body(..., description="New status for the event run"),
) -> EventRunResponse:
    """
    Update event run status.

    Requirements:
    - Admin access required
    - Valid status transition

    Use Cases:
    - Mark runs as completed after the event
    - Cancel runs due to issues
    - Update status based on capacity
    """
    return await event_run_service.update_event_run_status(event_run_id, new_status)
