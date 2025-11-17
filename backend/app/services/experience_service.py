"""
Experience Service for Mayhouse Backend

Service layer for managing experiences with CRUD operations, validation,
and approval workflow. Handles the complete experience lifecycle:
draft → submitted → approved/rejected → archived
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status

from app.core.database import get_service_client
from app.schemas.experience import (
    ExperienceCreate,
    ExperienceUpdate,
    ExperienceResponse,
    ExperienceSummary,
    ExperienceStatus,
    ExperienceReview,
    ExperienceSubmission,
    AdminDecision,
)

logger = logging.getLogger(__name__)


class ExperienceService:
    """Service for managing experiences."""

    def _get_service_client(self):
        """Get database service client."""
        return get_service_client()

    # =============================================
    # HOST EXPERIENCE MANAGEMENT
    # =============================================

    async def create_experience(
        self, host_id: str, experience_data: ExperienceCreate
    ) -> ExperienceResponse:
        """Create a new experience (starts in draft status)."""
        try:
            service_client = self._get_service_client()

            # AUTO-UPGRADE: Check if user needs to be upgraded to host role
            await self._ensure_user_is_host(host_id)

            # Prepare experience record
            experience_record = {
                "host_id": host_id,
                "title": experience_data.title,
                "promise": experience_data.promise,
                "description": experience_data.description,
                "unique_element": experience_data.unique_element,
                "host_story": experience_data.host_story,
                "experience_domain": experience_data.experience_domain.value,
                "experience_theme": experience_data.experience_theme,
                "country": experience_data.country,
                "city": experience_data.city,
                "neighborhood": experience_data.neighborhood,
                "meeting_landmark": experience_data.meeting_landmark,
                "meeting_point_details": experience_data.meeting_point_details,
                "duration_minutes": experience_data.duration_minutes,
                "traveler_min_capacity": experience_data.traveler_min_capacity,
                "traveler_max_capacity": experience_data.traveler_max_capacity,
                "price_inr": float(experience_data.price_inr),
                "inclusions": experience_data.inclusions,
                "traveler_should_bring": experience_data.traveler_should_bring or [],
                "accessibility_notes": experience_data.accessibility_notes or [],
                "weather_contingency_plan": experience_data.weather_contingency_plan,
                "photo_sharing_consent_required": experience_data.photo_sharing_consent_required,
                "experience_safety_guidelines": experience_data.experience_safety_guidelines,
                "status": ExperienceStatus.DRAFT.value,  # Always start as draft
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            # Insert experience
            response = (
                service_client.table("experiences").insert(experience_record).execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create experience",
                )

            return self._map_to_experience_response(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating experience: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create experience",
            )

    async def get_host_experiences(
        self, host_id: str, status_filter: Optional[ExperienceStatus] = None
    ) -> List[ExperienceSummary]:
        """Get all experiences for a specific host."""
        try:
            service_client = self._get_service_client()

            # Build query
            query = (
                service_client.table("experiences")
                .select("*")
                .eq("host_id", host_id)
                .order("updated_at", desc=True)
            )

            if status_filter:
                query = query.eq("status", status_filter.value)

            response = query.execute()

            # Map to summary objects
            experiences = []
            for item in response.data:
                experiences.append(self._map_to_experience_summary(item))

            return experiences

        except Exception as e:
            logger.error(f"Error getting host experiences: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve experiences",
            )

    async def get_experience_by_id(
        self, experience_id: str, host_id: Optional[str] = None
    ) -> ExperienceResponse:
        """Get experience by ID with optional host ownership check."""
        try:
            service_client = self._get_service_client()

            # Build query
            query = (
                service_client.table("experiences").select("*").eq("id", experience_id)
            )

            if host_id:
                query = query.eq("host_id", host_id)

            response = query.execute()

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found"
                )

            return self._map_to_experience_response(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting experience: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve experience",
            )

    async def submit_experience_for_review(
        self, experience_id: str, host_id: str, submission_data: ExperienceSubmission
    ) -> ExperienceResponse:
        """Submit experience for admin review."""
        try:
            service_client = self._get_service_client()

            # Get current experience to verify ownership and status
            current_exp = await self.get_experience_by_id(experience_id, host_id)

            # Only allow submission for draft experiences
            if current_exp.status != ExperienceStatus.DRAFT:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot submit experience with status '{current_exp.status}'. Only draft experiences can be submitted.",
                )

            # Update status to submitted
            update_record = {
                "status": ExperienceStatus.SUBMITTED.value,
                "updated_at": datetime.utcnow().isoformat(),
            }

            # Add submission notes if provided
            if submission_data.submission_notes:
                update_record["admin_feedback"] = (
                    f"Host submission notes: {submission_data.submission_notes}"
                )

            # Update experience
            response = (
                service_client.table("experiences")
                .update(update_record)
                .eq("id", experience_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to submit experience",
                )

            return self._map_to_experience_response(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error submitting experience: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit experience",
            )

    async def update_experience(
        self, experience_id: str, host_id: str, update_data: ExperienceUpdate
    ) -> ExperienceResponse:
        """Update an existing experience (draft or rejected only)."""
        try:
            service_client = self._get_service_client()

            # Get current experience to verify ownership and status
            current_exp = await self.get_experience_by_id(experience_id, host_id)

            # Only allow updates for draft or rejected experiences
            if current_exp.status not in [
                ExperienceStatus.DRAFT,
                ExperienceStatus.REJECTED,
            ]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot update experience with status '{current_exp.status}'. Only draft or rejected experiences can be updated.",
                )

            # Build update record with only provided fields
            update_record = {"updated_at": datetime.utcnow().isoformat()}

            # Update fields if provided
            if update_data.title is not None:
                update_record["title"] = update_data.title
            if update_data.promise is not None:
                update_record["promise"] = update_data.promise
            if update_data.description is not None:
                update_record["description"] = update_data.description
            if update_data.unique_element is not None:
                update_record["unique_element"] = update_data.unique_element
            if update_data.host_story is not None:
                update_record["host_story"] = update_data.host_story
            if update_data.experience_domain is not None:
                update_record["experience_domain"] = update_data.experience_domain.value
            if update_data.experience_theme is not None:
                update_record["experience_theme"] = update_data.experience_theme
            if update_data.country is not None:
                update_record["country"] = update_data.country
            if update_data.city is not None:
                update_record["city"] = update_data.city
            if update_data.neighborhood is not None:
                update_record["neighborhood"] = update_data.neighborhood
            if update_data.meeting_landmark is not None:
                update_record["meeting_landmark"] = update_data.meeting_landmark
            if update_data.meeting_point_details is not None:
                update_record["meeting_point_details"] = (
                    update_data.meeting_point_details
                )
            if update_data.duration_minutes is not None:
                update_record["duration_minutes"] = update_data.duration_minutes
            if update_data.traveler_min_capacity is not None:
                update_record["traveler_min_capacity"] = (
                    update_data.traveler_min_capacity
                )
            if update_data.traveler_max_capacity is not None:
                update_record["traveler_max_capacity"] = (
                    update_data.traveler_max_capacity
                )
            if update_data.price_inr is not None:
                update_record["price_inr"] = float(update_data.price_inr)
            if update_data.inclusions is not None:
                update_record["inclusions"] = update_data.inclusions
            if update_data.traveler_should_bring is not None:
                update_record["traveler_should_bring"] = (
                    update_data.traveler_should_bring
                )
            if update_data.accessibility_notes is not None:
                update_record["accessibility_notes"] = update_data.accessibility_notes
            if update_data.weather_contingency_plan is not None:
                update_record["weather_contingency_plan"] = (
                    update_data.weather_contingency_plan
                )
            if update_data.photo_sharing_consent_required is not None:
                update_record["photo_sharing_consent_required"] = (
                    update_data.photo_sharing_consent_required
                )
            if update_data.experience_safety_guidelines is not None:
                update_record["experience_safety_guidelines"] = (
                    update_data.experience_safety_guidelines
                )

            # If updating a rejected experience, change status back to draft
            if current_exp.status == ExperienceStatus.REJECTED:
                update_record["status"] = ExperienceStatus.DRAFT.value
                update_record["admin_feedback"] = (
                    None  # Clear admin feedback when editing
                )

            # Update experience
            response = (
                service_client.table("experiences")
                .update(update_record)
                .eq("id", experience_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update experience",
                )

            return self._map_to_experience_response(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating experience: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update experience",
            )

    async def archive_experience(
        self, experience_id: str, host_id: str
    ) -> ExperienceResponse:
        """Archive an experience (soft delete - sets status to archived)."""
        try:
            service_client = self._get_service_client()

            # Get current experience to verify ownership and status
            current_exp = await self.get_experience_by_id(experience_id, host_id)

            # Only allow archiving for draft or rejected experiences
            if current_exp.status not in [
                ExperienceStatus.DRAFT,
                ExperienceStatus.REJECTED,
            ]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot archive experience with status '{current_exp.status}'. Only draft or rejected experiences can be archived.",
                )

            # Update status to archived
            update_record = {
                "status": ExperienceStatus.ARCHIVED.value,
                "updated_at": datetime.utcnow().isoformat(),
            }

            # Update experience
            response = (
                service_client.table("experiences")
                .update(update_record)
                .eq("id", experience_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to archive experience",
                )

            return self._map_to_experience_response(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error archiving experience: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to archive experience",
            )

    # =============================================
    # ADMIN EXPERIENCE MANAGEMENT
    # =============================================

    async def get_experiences_for_admin(
        self,
        status_filter: Optional[ExperienceStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[ExperienceSummary]:
        """Get experiences for admin review."""
        try:
            service_client = self._get_service_client()

            # Build query
            query = (
                service_client.table("experiences")
                .select("*")
                .order("updated_at", desc=True)
                .range(offset, offset + limit - 1)
            )

            if status_filter:
                query = query.eq("status", status_filter.value)

            response = query.execute()

            # Map to summary objects
            experiences = []
            for item in response.data:
                experiences.append(self._map_to_experience_summary(item))

            return experiences

        except Exception as e:
            logger.error(f"Error getting experiences for admin: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve experiences",
            )

    async def review_experience(
        self, experience_id: str, review_data: ExperienceReview, admin_user_id: str
    ) -> ExperienceResponse:
        """Review an experience (approve/reject)."""
        try:
            service_client = self._get_service_client()

            # Get the experience
            current_exp = await self.get_experience_by_id(experience_id)

            if current_exp.status != ExperienceStatus.SUBMITTED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only submitted experiences can be reviewed",
                )

            # Prepare update data
            update_record = {
                "status": review_data.decision.value,
                "admin_feedback": review_data.admin_feedback
                or f"Admin decision: {review_data.decision.value}",
                "updated_at": datetime.utcnow().isoformat(),
            }

            # If approved, set approval timestamp and admin
            if review_data.decision == AdminDecision.APPROVED:
                update_record["approved_at"] = datetime.utcnow().isoformat()
                update_record["approved_by"] = admin_user_id

            # Update experience
            response = (
                service_client.table("experiences")
                .update(update_record)
                .eq("id", experience_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to review experience",
                )

            return self._map_to_experience_response(response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reviewing experience: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to review experience",
            )

    # =============================================
    # UTILITY METHODS
    # =============================================

    def _map_to_experience_response(self, data: dict) -> ExperienceResponse:
        """Map database record to ExperienceResponse."""
        return ExperienceResponse(
            id=data["id"],
            host_id=data["host_id"],
            title=data["title"],
            promise=data["promise"],
            description=data["description"],
            unique_element=data["unique_element"],
            host_story=data["host_story"],
            experience_domain=data["experience_domain"],
            experience_theme=data.get("experience_theme"),
            country=data["country"],
            city=data["city"],
            neighborhood=data.get("neighborhood"),
            meeting_landmark=data["meeting_landmark"],
            meeting_point_details=data["meeting_point_details"],
            duration_minutes=data["duration_minutes"],
            traveler_min_capacity=data["traveler_min_capacity"],
            traveler_max_capacity=data["traveler_max_capacity"],
            price_inr=data["price_inr"],
            inclusions=data.get("inclusions", []),
            traveler_should_bring=data.get("traveler_should_bring", []),
            accessibility_notes=data.get("accessibility_notes", []),
            weather_contingency_plan=data.get("weather_contingency_plan"),
            photo_sharing_consent_required=data["photo_sharing_consent_required"],
            experience_safety_guidelines=data.get("experience_safety_guidelines"),
            status=ExperienceStatus(data["status"]),
            admin_feedback=data.get("admin_feedback"),
            created_at=datetime.fromisoformat(
                data["created_at"].replace("Z", "+00:00")
            ),
            updated_at=datetime.fromisoformat(
                data["updated_at"].replace("Z", "+00:00")
            ),
            approved_at=(
                datetime.fromisoformat(data["approved_at"].replace("Z", "+00:00"))
                if data.get("approved_at")
                else None
            ),
            approved_by=data.get("approved_by"),
        )

    def _map_to_experience_summary(self, data: dict) -> ExperienceSummary:
        """Map database record to ExperienceSummary."""
        return ExperienceSummary(
            id=data["id"],
            host_id=data["host_id"],
            title=data["title"] or "Untitled Experience",
            promise=data["promise"] or "No promise available",
            experience_domain=data["experience_domain"] or "unknown",
            city=data["city"] or "Unknown City",
            neighborhood=data.get("neighborhood"),
            duration_minutes=data["duration_minutes"] or 0,
            traveler_max_capacity=data["traveler_max_capacity"] or 0,
            price_inr=data["price_inr"] or 0,
            status=(
                ExperienceStatus(data["status"])
                if data["status"]
                else ExperienceStatus.DRAFT
            ),
            created_at=(
                datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
                if data["created_at"]
                else datetime.utcnow()
            ),
            updated_at=(
                datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00"))
                if data["updated_at"]
                else datetime.utcnow()
            ),
        )

    async def _ensure_user_is_host(self, user_id: str) -> None:
        """
        Ensure user has host role. If not, upgrade them automatically.
        This allows any user to become a host simply by creating an experience.
        """
        try:
            service_client = self._get_service_client()

            # Check current user role
            user_response = (
                service_client.table("users").select("role").eq("id", user_id).execute()
            )

            if not user_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            current_role = user_response.data[0].get("role", "user")

            # If not already a host, upgrade them
            if current_role != "host":
                service_client.table("users").update({"role": "host"}).eq(
                    "id", user_id
                ).execute()

                logger.info(f"Auto-upgraded user {user_id} to host role")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking/upgrading user role: {str(e)}")
            # Don't block experience creation if role update fails
            pass


# Create service instance
experience_service = ExperienceService()
