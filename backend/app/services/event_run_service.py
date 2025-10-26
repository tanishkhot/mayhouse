"""
Event Run Service Layer

Handles business logic for event run management including:
- CRUD operations for event runs
- Capacity management and availability checking
- Status transitions and validation
- Host permission checking
- Booking statistics calculation
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status

from app.core.database import get_service_client
from app.schemas.event_run import (
    EventRunCreate,
    EventRunUpdate,
    EventRunResponse,
    EventRunSummary,
    EventRunStatus,
    EventRunBookingSummary,
    EventRunStats,
    EventRunFilterParams,
    ExploreEventRun,
)
from app.services.experience_service import experience_service


class EventRunService:
    """Service for managing event runs."""

    def _get_service_client(self):
        """Get database service client."""
        return get_service_client()

    async def create_event_run(
        self, event_run_data: EventRunCreate, host_id: str
    ) -> EventRunResponse:
        """
        Create a new event run for an approved experience.

        Business Rules:
        - Only approved experiences can have event runs
        - Host must own the experience
        - Start time must be in the future
        - Max capacity respects platform limits (1-4)
        """
        # Verify experience exists and is approved
        experience = await experience_service.get_experience_by_id(
            event_run_data.experience_id
        )

        # Check if host owns this experience
        if experience.host_id != host_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create event runs for your own experiences",
            )

        # Check if experience is approved
        if experience.status != "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event runs can only be created for approved experiences",
            )

        # Check host's current active event runs limit (max 2)
        active_runs_count = await self._count_active_event_runs(host_id)
        if active_runs_count >= 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can have maximum 2 active event runs at a time. Please complete or cancel existing runs before creating new ones.",
            )

        # Use special pricing or fall back to experience base price
        effective_price = event_run_data.special_pricing_inr or experience.price_inr

        # Create the event run
        insert_data = {
            "experience_id": event_run_data.experience_id,
            "start_datetime": event_run_data.start_datetime,  # Already ISO string
            "end_datetime": event_run_data.end_datetime,  # Already ISO string
            "max_capacity": event_run_data.max_capacity,
            "special_pricing_inr": (
                float(event_run_data.special_pricing_inr)
                if event_run_data.special_pricing_inr
                else None
            ),
            "host_meeting_instructions": event_run_data.host_meeting_instructions,
            "group_pairing_enabled": event_run_data.group_pairing_enabled,
            "status": EventRunStatus.SCHEDULED.value,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        service_client = self._get_service_client()
        response = service_client.table("event_runs").insert(insert_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create event run",
            )

        created_event_run = response.data[0]
        event_run_id = created_event_run["id"]

        # Return enriched response
        return await self._build_event_run_response(
            created_event_run, include_bookings=True
        )

    async def get_event_run_by_id(
        self, event_run_id: str, include_bookings: bool = True
    ) -> EventRunResponse:
        """Get an event run by ID with optional booking summary."""
        service_client = self._get_service_client()
        response = (
            service_client.table("event_runs")
            .select(
                """
            *,
            experiences (
                title,
                experience_domain,
                price_inr,
                host_id,
                users!experiences_host_id_fkey (full_name)
            )
        """
            )
            .eq("id", event_run_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Event run not found"
            )

        event_run = response.data[0]
        return await self._build_event_run_response(event_run, include_bookings)

    async def get_host_event_runs(
        self,
        host_id: str,
        status_filter: Optional[EventRunStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[EventRunSummary]:
        """Get event runs for a specific host."""
        service_client = self._get_service_client()
        query = (
            service_client.table("event_runs")
            .select(
                """
            *,
            experiences!inner (
                title,
                experience_domain,
                neighborhood,
                price_inr,
                host_id
            )
        """
            )
            .eq("experiences.host_id", host_id)
        )

        if status_filter:
            query = query.eq("status", status_filter.value)

        query = query.order("start_datetime", desc=True).range(
            offset, offset + limit - 1
        )
        response = query.execute()

        event_runs = []
        for run in response.data:
            # Calculate available spots
            available_spots = await self._calculate_available_spots(
                run["id"], run["max_capacity"]
            )

            # Use special pricing or base price
            effective_price = (
                run["special_pricing_inr"] or run["experiences"]["price_inr"]
            )

            event_runs.append(
                EventRunSummary(
                    id=run["id"],
                    experience_id=run["experience_id"],
                    start_datetime=datetime.fromisoformat(
                        run["start_datetime"].replace("Z", "+00:00")
                    ),
                    max_capacity=run["max_capacity"],
                    status=EventRunStatus(run["status"]),
                    available_spots=available_spots,
                    price_inr=Decimal(str(effective_price)),
                    experience_title=run["experiences"]["title"],
                    experience_domain=run["experiences"]["experience_domain"],
                    neighborhood=run["experiences"]["neighborhood"],
                )
            )

        return event_runs

    async def update_event_run(
        self, event_run_id: str, update_data: EventRunUpdate, host_id: str
    ) -> EventRunResponse:
        """Update an event run (host only)."""
        # Get current event run and verify ownership
        current_run = await self.get_event_run_by_id(
            event_run_id, include_bookings=False
        )

        # Verify host ownership through experience
        experience = await experience_service.get_experience_by_id(
            current_run.experience_id
        )
        if experience.host_id != host_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own event runs",
            )

        # Build update dictionary
        update_dict = {}
        for field, value in update_data.dict(exclude_unset=True).items():
            if field in ["start_datetime", "end_datetime"] and value:
                update_dict[field] = value.isoformat()
            elif field == "special_pricing_inr" and value is not None:
                update_dict[field] = float(value)
            elif value is not None:
                update_dict[field] = value

        if update_dict:
            update_dict["updated_at"] = datetime.utcnow().isoformat()

            service_client = self._get_service_client()
            response = (
                service_client.table("event_runs")
                .update(update_dict)
                .eq("id", event_run_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update event run",
                )

        return await self.get_event_run_by_id(event_run_id, include_bookings=True)

    async def delete_event_run(self, event_run_id: str, host_id: str) -> dict:
        """Delete an event run (host only, if no bookings)."""
        # Verify ownership
        current_run = await self.get_event_run_by_id(
            event_run_id, include_bookings=True
        )
        experience = await experience_service.get_experience_by_id(
            current_run.experience_id
        )

        if experience.host_id != host_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own event runs",
            )

        # Check if there are any confirmed bookings
        if (
            current_run.booking_summary
            and current_run.booking_summary.confirmed_bookings > 0
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete event run with confirmed bookings. Cancel the event instead.",
            )

        # Delete the event run
        service_client = self._get_service_client()
        response = (
            service_client.table("event_runs").delete().eq("id", event_run_id).execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete event run",
            )

        return {"message": "Event run deleted successfully", "id": event_run_id}

    async def list_available_event_runs(
        self, filters: EventRunFilterParams
    ) -> List[EventRunSummary]:
        """List available event runs with filtering for public discovery."""
        service_client = self._get_service_client()
        query = (
            service_client.table("event_runs")
            .select(
                """
            *,
            experiences!inner (
                title,
                experience_domain,
                neighborhood,
                price_inr,
                status
            )
        """
            )
            .eq("experiences.status", "approved")
        )  # Only approved experiences

        # Apply filters
        if filters.experience_id:
            query = query.eq("experience_id", filters.experience_id)

        if filters.status:
            query = query.eq("status", filters.status.value)
        elif filters.available_only:
            # Exclude sold out and cancelled runs
            query = query.not_.in_("status", ["sold_out", "cancelled"])

        if filters.start_date:
            query = query.gte("start_datetime", filters.start_date.isoformat())

        if filters.end_date:
            query = query.lte("start_datetime", filters.end_date.isoformat())

        if filters.domain:
            query = query.eq("experiences.experience_domain", filters.domain)

        if filters.neighborhood:
            query = query.eq("experiences.neighborhood", filters.neighborhood)

        # Execute query with pagination
        query = query.order("start_datetime", desc=False).range(
            filters.offset, filters.offset + filters.limit - 1
        )
        response = query.execute()

        # Build results with availability and pricing filters
        event_runs = []
        for run in response.data:
            available_spots = await self._calculate_available_spots(
                run["id"], run["max_capacity"]
            )

            # Skip if no spots available and available_only is True
            if filters.available_only and available_spots == 0:
                continue

            # Calculate effective price
            effective_price = (
                run["special_pricing_inr"] or run["experiences"]["price_inr"]
            )

            # Apply price filters
            if filters.min_price and Decimal(str(effective_price)) < filters.min_price:
                continue
            if filters.max_price and Decimal(str(effective_price)) > filters.max_price:
                continue

            event_runs.append(
                EventRunSummary(
                    id=run["id"],
                    experience_id=run["experience_id"],
                    start_datetime=datetime.fromisoformat(
                        run["start_datetime"].replace("Z", "+00:00")
                    ),
                    max_capacity=run["max_capacity"],
                    status=EventRunStatus(run["status"]),
                    available_spots=available_spots,
                    price_inr=Decimal(str(effective_price)),
                    experience_title=run["experiences"]["title"],
                    experience_domain=run["experiences"]["experience_domain"],
                    neighborhood=run["experiences"]["neighborhood"],
                )
            )

        return event_runs

    async def get_event_run_stats(self) -> EventRunStats:
        """Get event run statistics for admin dashboard."""
        service_client = self._get_service_client()
        # Get all event runs
        response = service_client.table("event_runs").select("*").execute()
        all_runs = response.data

        # Calculate basic counts
        total_runs = len(all_runs)
        status_counts = {}
        upcoming_7_days = 0

        for status in EventRunStatus:
            status_counts[status.value] = 0

        for run in all_runs:
            # Count by status
            run_status = run["status"]
            status_counts[run_status] += 1

            # Count upcoming runs in next 7 days
            start_time = datetime.fromisoformat(
                run["start_datetime"].replace("Z", "+00:00")
            )
            now = (
                datetime.now(start_time.tzinfo) if start_time.tzinfo else datetime.now()
            )
            if start_time > now and start_time <= now + timedelta(days=7):
                upcoming_7_days += 1

        # Calculate capacity statistics
        total_capacity = sum(run["max_capacity"] for run in all_runs)

        # Get booking statistics
        booking_response = (
            service_client.table("event_run_bookings")
            .select(
                """
            traveler_count, booking_status
        """
            )
            .execute()
        )

        total_booked_spots = 0
        for booking in booking_response.data:
            if booking["booking_status"] in ["confirmed", "experience_completed"]:
                total_booked_spots += booking["traveler_count"]

        utilization_rate = (total_booked_spots / max(total_capacity, 1)) * 100

        return EventRunStats(
            total_event_runs=total_runs,
            scheduled_runs=status_counts["scheduled"],
            completed_runs=status_counts["completed"],
            cancelled_runs=status_counts["cancelled"],
            upcoming_runs_7_days=upcoming_7_days,
            avg_capacity_utilization=round(utilization_rate, 1),
            status_counts=status_counts,
            total_capacity_offered=total_capacity,
            total_spots_booked=total_booked_spots,
            utilization_rate=round(utilization_rate, 1),
        )

    async def _calculate_available_spots(
        self, event_run_id: str, max_capacity: int
    ) -> int:
        """Calculate available spots for an event run."""
        service_client = self._get_service_client()
        # Get confirmed bookings
        response = (
            service_client.table("event_run_bookings")
            .select("traveler_count")
            .eq("event_run_id", event_run_id)
            .in_("booking_status", ["confirmed", "experience_completed"])
            .execute()
        )

        booked_spots = sum(booking["traveler_count"] for booking in response.data)
        return max(0, max_capacity - booked_spots)

    async def _calculate_booking_summary(
        self, event_run_id: str, max_capacity: int
    ) -> EventRunBookingSummary:
        """Calculate booking summary for an event run."""
        service_client = self._get_service_client()
        # Get all bookings for this event run
        response = (
            service_client.table("event_run_bookings")
            .select(
                """
            traveler_count, booking_status
        """
            )
            .eq("event_run_id", event_run_id)
            .execute()
        )

        total_bookings = len(response.data)
        confirmed_bookings = 0
        total_travelers = 0

        for booking in response.data:
            if booking["booking_status"] in ["confirmed", "experience_completed"]:
                confirmed_bookings += 1
                total_travelers += booking["traveler_count"]

        available_spots = max_capacity - total_travelers

        return EventRunBookingSummary(
            total_bookings=total_bookings,
            confirmed_bookings=confirmed_bookings,
            total_travelers=total_travelers,
            available_spots=max(0, available_spots),
        )

    async def get_detailed_bookings(self, event_run_id: str) -> List[dict]:
        """Get detailed booking information for an event run (admin only)."""
        service_client = self._get_service_client()
        response = (
            service_client.table("event_run_bookings")
            .select(
                """
            id,
            traveler_id,
            booking_type,
            traveler_count,
            total_experience_cost_inr,
            booking_status,
            traveler_details,
            special_travel_requests,
            host_checkin_notes,
            booking_created_at,
            users!traveler_id (
                full_name,
                email,
                phone
            )
        """
            )
            .eq("event_run_id", event_run_id)
            .execute()
        )

        detailed_bookings = []
        for booking in response.data:
            # Extract traveler information
            traveler_info = booking.get("users", {})

            detailed_bookings.append(
                {
                    "id": booking["id"],
                    "traveler_id": booking["traveler_id"],
                    "traveler_name": traveler_info.get("full_name", "N/A"),
                    "traveler_email": traveler_info.get("email", "N/A"),
                    "traveler_phone": traveler_info.get("phone"),
                    "booking_type": booking["booking_type"],
                    "traveler_count": booking["traveler_count"],
                    "total_cost": (
                        float(booking["total_experience_cost_inr"])
                        if booking["total_experience_cost_inr"]
                        else 0
                    ),
                    "booking_status": booking["booking_status"],
                    "traveler_details": booking.get("traveler_details"),
                    "special_requests": booking.get("special_travel_requests"),
                    "host_notes": booking.get("host_checkin_notes"),
                    "booked_at": booking["booking_created_at"],
                }
            )

        return detailed_bookings

    async def _build_event_run_response(
        self,
        event_run_data: dict,
        include_bookings: bool = True,
        include_detailed_bookings: bool = False,
    ) -> EventRunResponse:
        """Build a complete EventRunResponse from database data."""
        # Calculate booking summary if requested
        booking_summary = None
        detailed_bookings = None

        if include_bookings:
            booking_summary = await self._calculate_booking_summary(
                event_run_data["id"], event_run_data["max_capacity"]
            )

        if include_detailed_bookings:
            detailed_bookings = await self.get_detailed_bookings(event_run_data["id"])

        # Extract related data if available
        experience_data = event_run_data.get("experiences")
        experience_title = None
        experience_domain = None
        host_name = None
        base_price = None

        if experience_data:
            experience_title = experience_data.get("title")
            experience_domain = experience_data.get("experience_domain")
            base_price = experience_data.get("price_inr")

            # Extract host name if nested
            if "users" in experience_data:
                host_name = experience_data["users"].get("full_name")

        # Calculate effective price
        effective_price = event_run_data.get("special_pricing_inr") or base_price

        return EventRunResponse(
            id=event_run_data["id"],
            experience_id=event_run_data["experience_id"],
            start_datetime=datetime.fromisoformat(
                event_run_data["start_datetime"].replace("Z", "+00:00")
            ),
            end_datetime=datetime.fromisoformat(
                event_run_data["end_datetime"].replace("Z", "+00:00")
            ),
            max_capacity=event_run_data["max_capacity"],
            special_pricing_inr=(
                Decimal(str(event_run_data["special_pricing_inr"]))
                if event_run_data.get("special_pricing_inr")
                else None
            ),
            status=EventRunStatus(event_run_data["status"]),
            host_meeting_instructions=event_run_data.get("host_meeting_instructions"),
            group_pairing_enabled=event_run_data["group_pairing_enabled"],
            created_at=datetime.fromisoformat(
                event_run_data["created_at"].replace("Z", "+00:00")
            ),
            updated_at=datetime.fromisoformat(
                event_run_data["updated_at"].replace("Z", "+00:00")
            ),
            booking_summary=booking_summary,
            detailed_bookings=detailed_bookings,
            experience_title=experience_title,
            experience_domain=experience_domain,
            host_name=host_name,
            price_inr=Decimal(str(effective_price)) if effective_price else None,
        )

    async def update_event_run_status(
        self, event_run_id: str, new_status: EventRunStatus
    ) -> EventRunResponse:
        """Update event run status (typically called by system processes)."""
        update_data = {
            "status": new_status.value,
            "updated_at": datetime.utcnow().isoformat(),
        }

        service_client = self._get_service_client()
        response = (
            service_client.table("event_runs")
            .update(update_data)
            .eq("id", event_run_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update event run status",
            )

        return await self.get_event_run_by_id(event_run_id)

    async def explore_upcoming_event_runs(
        self,
        limit: int = 50,
        offset: int = 0,
        domain: Optional[str] = None,
        neighborhood: Optional[str] = None,
    ) -> List[ExploreEventRun]:
        """Get upcoming event runs for the explore endpoint, starting from now."""
        current_time = datetime.now()

        service_client = self._get_service_client()
        # Build query with rich joins for experience and host data
        query = (
            service_client.table("event_runs")
            .select(
                """
            *,
            experiences!inner (
                id,
                title,
                promise,
                experience_domain,
                experience_theme,
                neighborhood,
                meeting_landmark,
                duration_minutes,
                price_inr,
                host_id,
                status,
                users!experiences_host_id_fkey (
                    id,
                    full_name
                ),
                experience_photos!experience_photos_experience_id_fkey (
                    photo_url,
                    is_cover_photo
                )
            )
        """
            )
            .eq("experiences.status", "approved")
        )  # Only approved experiences

        # Filter for upcoming events only (start_datetime >= now)
        query = query.gte("start_datetime", current_time.isoformat())

        # Filter for non-cancelled events
        query = query.not_.in_("status", ["cancelled"])

        # Apply optional filters
        if domain:
            query = query.eq("experiences.experience_domain", domain)
        if neighborhood:
            query = query.eq("experiences.neighborhood", neighborhood)

        # Order by start time (soonest first) and apply pagination
        query = query.order("start_datetime", desc=False).range(
            offset, offset + limit - 1
        )

        response = query.execute()

        # Build explore results
        explore_runs = []
        for run in response.data:
            experience = run["experiences"]
            host = experience["users"]

            # Calculate available spots
            available_spots = await self._calculate_available_spots(
                run["id"], run["max_capacity"]
            )

            # Calculate effective price (special pricing overrides base price)
            effective_price = run["special_pricing_inr"] or experience["price_inr"]

            # Get cover photo URL
            cover_photo_url = None
            if experience.get("experience_photos"):
                # Find the cover photo
                for photo in experience["experience_photos"]:
                    if photo.get("is_cover_photo"):
                        cover_photo_url = photo.get("photo_url")
                        break
                # If no cover photo marked, use the first photo
                if not cover_photo_url and len(experience["experience_photos"]) > 0:
                    cover_photo_url = experience["experience_photos"][0].get("photo_url")

            # Build explore event run object
            explore_run = ExploreEventRun(
                id=run["id"],
                start_datetime=datetime.fromisoformat(
                    run["start_datetime"].replace("Z", "+00:00")
                ),
                end_datetime=datetime.fromisoformat(
                    run["end_datetime"].replace("Z", "+00:00")
                ),
                max_capacity=run["max_capacity"],
                available_spots=available_spots,
                price_inr=Decimal(str(effective_price)),
                status=EventRunStatus(run["status"]),
                # Experience details
                experience_id=experience["id"],
                experience_title=experience["title"],
                experience_promise=experience.get("promise"),
                experience_domain=experience["experience_domain"],
                experience_theme=experience.get("experience_theme"),
                neighborhood=experience.get("neighborhood"),
                meeting_landmark=experience.get("meeting_landmark"),
                duration_minutes=experience["duration_minutes"],
                cover_photo_url=cover_photo_url,
                # Host details
                host_id=host["id"],
                host_name=host["full_name"],
                host_meeting_instructions=run.get("host_meeting_instructions"),
                group_pairing_enabled=run["group_pairing_enabled"],
            )

            explore_runs.append(explore_run)

        return explore_runs

    async def _count_active_event_runs(self, host_id: str) -> int:
        """Count active (scheduled, low_seats, sold_out) event runs for a host."""
        service_client = self._get_service_client()
        # Count event runs that are considered "active" (not completed or cancelled)
        active_statuses = ["scheduled", "low_seats", "sold_out"]

        response = (
            service_client.table("event_runs")
            .select(
                """
            id,
            experiences!inner (
                host_id
            )
        """
            )
            .eq("experiences.host_id", host_id)
            .in_("status", active_statuses)
            .execute()
        )

        return len(response.data)


# Create service instance
event_run_service = EventRunService()
