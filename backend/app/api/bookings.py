"""
Bookings API endpoints for creating and managing bookings.
"""

from typing import List
from fastapi import APIRouter, HTTPException, status, Header, Path

from app.schemas.booking import BookingCreate, BookingResponse, BookingSummary
from app.services.booking_service import booking_service
from app.core.jwt_utils import verify_token


router = APIRouter(prefix="/bookings", tags=["Bookings"])


def get_user_id_from_auth(authorization: str) -> str:
    """Extract user ID from authorization header."""
    from app.core.config import get_settings
    
    settings = get_settings()
    
    # TEST MODE: Bypass auth if debug mode is enabled and test_user_id is set
    # WARNING: Only use in development!
    if settings.debug and settings.test_user_id:
        # In debug mode with test_user_id, allow testing without auth header
        if not authorization or not authorization.startswith("Bearer "):
            # No auth header provided - use test user ID
            return settings.test_user_id
        # If auth header is provided, still validate it (allows testing with real tokens too)
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return user_id


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Booking",
    description="Create a new booking for an event run",
)
async def create_booking(
    booking_data: BookingCreate,
    authorization: str = Header(None),
) -> BookingResponse:
    """
    Create a new booking for an event run.

    Requirements:
    - User must be authenticated (OAuth or wallet JWT)
    - Event run must be available
    - Sufficient seats must be available
    - Payment will be processed (dummy for now)

    Returns:
    - Booking confirmation with payment details
    """
    user_id = get_user_id_from_auth(authorization)

    try:
        booking = await booking_service.create_booking(
            event_run_id=booking_data.event_run_id,
            seat_count=booking_data.seat_count,
            user_id=user_id,
        )

        return BookingResponse(**booking)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create booking: {str(e)}",
        )


@router.get(
    "/my",
    response_model=List[dict],
    summary="Get My Bookings",
    description="Get all bookings for the authenticated user",
)
async def get_my_bookings(
    authorization: str = Header(None),
) -> List[dict]:
    """
    Get all bookings for the current user.

    Returns:
    - List of bookings with event run details
    - Sorted by creation date (newest first)
    """
    user_id = get_user_id_from_auth(authorization)

    try:
        bookings = await booking_service.get_user_bookings(user_id=user_id)
        return bookings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bookings: {str(e)}",
        )


@router.get(
    "/{booking_id}",
    response_model=dict,
    summary="Get Booking Details",
    description="Get detailed information about a specific booking",
)
async def get_booking(
    booking_id: str = Path(..., description="Booking ID"),
    authorization: str = Header(None),
) -> dict:
    """
    Get booking details by ID.

    Users can only view their own bookings unless they are admin.
    """
    user_id = get_user_id_from_auth(authorization)

    try:
        booking = await booking_service.get_booking_by_id(
            booking_id=booking_id, user_id=user_id
        )
        return booking
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch booking: {str(e)}",
        )

