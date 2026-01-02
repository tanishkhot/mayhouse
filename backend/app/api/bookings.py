"""
Bookings API endpoints for creating and managing bookings.
"""

from typing import List
from decimal import Decimal
from fastapi import APIRouter, HTTPException, status, Header, Path

from app.schemas.booking import BookingCreate, BookingResponse, BookingSummary, BookingCostRequest, BookingCostResponse
from app.services.booking_service import booking_service
from app.core.database import get_service_client
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
    "/calculate-cost",
    response_model=BookingCostResponse,
    summary="Calculate Booking Cost",
    description="Calculate total cost including 20% stake for booking an event",
)
async def calculate_booking_cost(
    request: BookingCostRequest,
) -> BookingCostResponse:
    """
    Calculate the total cost for booking an event.

    Returns:
    - Ticket price
    - 20% refundable deposit (refundable if attended)
    - Total cost to pay

    All amounts in INR only.
    """
    print(f"[BOOKINGS_API] calculate_booking_cost called with event_run_id={request.event_run_id}, seat_count={request.seat_count}")
    
    # Get event run from database
    service_client = get_service_client()
    response = (
        service_client.table("event_runs")
        .select("*, experiences(price_inr)")
        .eq("id", request.event_run_id)
        .execute()
    )

    if not response.data:
        print(f"[BOOKINGS_API] Event run not found: {request.event_run_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event run not found"
        )

    event_run = response.data[0]
    print(f"[BOOKINGS_API] Event run found: {event_run.get('id')}, status: {event_run.get('status')}")

    # Get price (special pricing or base price)
    price_per_seat_inr = Decimal(
        str(
            event_run.get("special_pricing_inr")
            or event_run["experiences"]["price_inr"]
        )
    )

    # Calculate costs in INR
    total_price_inr = price_per_seat_inr * request.seat_count
    stake_inr = total_price_inr * Decimal("0.20")  # 20% refundable deposit
    total_cost_inr = total_price_inr + stake_inr

    print(f"[BOOKINGS_API] Cost calculation: price_per_seat={price_per_seat_inr}, total_price={total_price_inr}, stake={stake_inr}, total_cost={total_cost_inr}")

    result = BookingCostResponse(
        event_run_id=request.event_run_id,
        seat_count=request.seat_count,
        price_per_seat_inr=price_per_seat_inr,
        total_price_inr=total_price_inr,
        stake_inr=stake_inr,
        total_cost_inr=total_cost_inr,
    )
    
    print(f"[BOOKINGS_API] Returning cost response: {result}")
    return result


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
    
    print(f"[BOOKINGS_API] create_booking endpoint called")
    print(f"[BOOKINGS_API] Request data: event_run_id={booking_data.event_run_id}, seat_count={booking_data.seat_count}")
    print(f"[BOOKINGS_API] Authenticated user_id: {user_id}")

    try:
        booking = await booking_service.create_booking(
            event_run_id=booking_data.event_run_id,
            seat_count=booking_data.seat_count,
            user_id=user_id,
        )

        print(f"[BOOKINGS_API] Booking created successfully: {booking.get('id')}")
        return BookingResponse(**booking)
    except HTTPException as e:
        print(f"[BOOKINGS_API] HTTPException: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        print(f"[BOOKINGS_API] Exception during booking creation: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[BOOKINGS_API] Traceback: {traceback.format_exc()}")
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

