"""
Booking Service - Handles booking creation and management.
"""

from typing import Optional, List
from decimal import Decimal
from datetime import datetime

from fastapi import HTTPException, status

from app.core.database import get_service_client
from app.services.payment_service import payment_service
from app.services.event_run_service import event_run_service


class BookingService:
    """Service for managing bookings."""

    def _get_service_client(self):
        """Get database service client."""
        return get_service_client()

    async def create_booking(
        self, event_run_id: str, seat_count: int, user_id: str
    ) -> dict:
        """
        Create a new booking for an event run.

        Args:
            event_run_id: ID of the event run to book
            seat_count: Number of seats to book (1-4)
            user_id: ID of the user making the booking

        Returns:
            Dictionary with booking details including payment information
        """
        print(f"[BOOKING_SERVICE] create_booking called with event_run_id={event_run_id}, seat_count={seat_count}, user_id={user_id}")
        service_client = self._get_service_client()

        # 1. Validate event run exists and get details
        event_run_response = (
            service_client.table("event_runs")
            .select("*, experiences(price_inr, host_id)")
            .eq("id", event_run_id)
            .execute()
        )

        if not event_run_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event run not found",
            )

        event_run = event_run_response.data[0]

        # 2. Check if event run is available
        if event_run.get("status") not in ["scheduled", "low_seats"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Event run is not available for booking. Status: {event_run.get('status')}",
            )

        # 3. Check seat availability
        max_capacity = event_run.get("max_capacity", 0)
        available_spots = await event_run_service._calculate_available_spots(
            event_run_id, max_capacity
        )

        if seat_count > available_spots:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough seats available. Available: {available_spots}, Requested: {seat_count}",
            )

        # 4. Calculate pricing
        experience = event_run.get("experiences", {})
        price_per_seat_inr = Decimal(
            str(
                event_run.get("special_pricing_inr")
                or experience.get("price_inr", 0)
            )
        )

        if price_per_seat_inr <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid pricing for this event run",
            )

        # Calculate costs
        total_price_inr = price_per_seat_inr * seat_count
        stake_inr = total_price_inr * Decimal("0.20")  # 20% refundable deposit
        total_cost_inr = total_price_inr + stake_inr
        
        # Calculate platform fee (typically 5% of total price, before stake)
        mayhouse_platform_fee_inr = total_price_inr * Decimal("0.05")  # 5% platform fee
        
        # Calculate host earnings (total price minus platform fee)
        host_earnings_inr = total_price_inr - mayhouse_platform_fee_inr

        # 5. Process payment (dummy)
        payment_result = await payment_service.process_booking_payment(
            amount_inr=total_cost_inr, user_id=user_id, booking_id="pending"
        )

        # 6. Create booking record
        # booking_type: "solo_traveler" for single traveler bookings
        booking_data = {
            "event_run_id": event_run_id,
            "traveler_id": user_id,
            "traveler_count": seat_count,
            "total_experience_cost_inr": float(total_cost_inr),
            "mayhouse_platform_fee_inr": float(mayhouse_platform_fee_inr),
            "host_earnings_inr": float(host_earnings_inr),
            "booking_status": "confirmed",
            "booking_type": "solo_traveler",  # Valid enum value from database
            "booking_created_at": datetime.utcnow().isoformat(),
        }

        print(f"[BOOKING_SERVICE] Creating booking with data: {booking_data}")
        print(f"[BOOKING_SERVICE] Event run ID: {event_run_id}, User ID: {user_id}, Seat count: {seat_count}")
        print(f"[BOOKING_SERVICE] Total cost: {total_cost_inr}, Price per seat: {price_per_seat_inr}")
        print(f"[BOOKING_SERVICE] Platform fee: {mayhouse_platform_fee_inr}, Host earnings: {host_earnings_inr}, Stake: {stake_inr}")

        booking_response = (
            service_client.table("event_run_bookings")
            .insert(booking_data)
            .execute()
        )

        print(f"[BOOKING_SERVICE] Booking insert response: {booking_response.data if booking_response.data else 'No data returned'}")

        if not booking_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create booking",
            )

        created_booking = booking_response.data[0]

        # 7. Update event run status if needed (check if sold out)
        new_available = available_spots - seat_count
        if new_available == 0:
            service_client.table("event_runs").update(
                {"status": "sold_out", "updated_at": datetime.utcnow().isoformat()}
            ).eq("id", event_run_id).execute()
        elif new_available <= 1:
            service_client.table("event_runs").update(
                {"status": "low_seats", "updated_at": datetime.utcnow().isoformat()}
            ).eq("id", event_run_id).execute()

        # 8. Return booking response
        return {
            "id": created_booking["id"],
            "event_run_id": event_run_id,
            "user_id": user_id,
            "seat_count": seat_count,
            "total_amount_inr": float(total_cost_inr),
            "booking_status": "confirmed",
            "payment": payment_result,
            "created_at": created_booking["booking_created_at"],
        }

    async def get_booking_by_id(self, booking_id: str, user_id: Optional[str] = None) -> dict:
        """
        Get booking details by ID.

        Args:
            booking_id: Booking ID
            user_id: Optional user ID to verify ownership

        Returns:
            Dictionary with booking details
        """
        service_client = self._get_service_client()

        response = (
            service_client.table("event_run_bookings")
            .select("*, event_runs(*, experiences(*))")
            .eq("id", booking_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        booking = response.data[0]

        # Verify ownership if user_id provided
        if user_id and booking.get("traveler_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this booking",
            )

        return booking

    async def get_user_bookings(self, user_id: str) -> List[dict]:
        """
        Get all bookings for a user.

        Args:
            user_id: User ID

        Returns:
            List of booking dictionaries
        """
        service_client = self._get_service_client()

        response = (
            service_client.table("event_run_bookings")
            .select(
                """
                id,
                event_run_id,
                traveler_count,
                total_experience_cost_inr,
                booking_status,
                booking_created_at,
                event_runs(
                    id,
                    start_datetime,
                    end_datetime,
                    status,
                    experiences(
                        id,
                        title,
                        experience_domain
                    )
                )
            """
            )
            .eq("traveler_id", user_id)
            .order("booking_created_at", desc=True)
            .execute()
        )

        bookings = []
        for booking in response.data:
            bookings.append({
                "id": booking["id"],
                "event_run_id": booking["event_run_id"],
                "seat_count": booking["traveler_count"],
                "total_amount_inr": (
                    float(booking["total_experience_cost_inr"])
                    if booking["total_experience_cost_inr"]
                    else 0
                ),
                "booking_status": booking["booking_status"],
                "created_at": booking["booking_created_at"],
                "event_run": booking.get("event_runs"),
            })

        return bookings


# Create service instance
booking_service = BookingService()

