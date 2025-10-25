from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status
from supabase import Client

from app.core.database import get_db
from app.core.config import get_settings
from supabase import create_client
from app.schemas.host_application import (
    HostApplicationCreate,
    HostApplicationResponse,
    HostApplicationSummary,
    HostApplicationReview,
    HostApplicationStats,
    ApplicationStatus,
    AdminFeedback,
)
from app.schemas.user import UserRole
import logging

logger = logging.getLogger(__name__)


class HostApplicationService:
    """Service for managing host applications and role changes."""

    def __init__(self):
        self.settings = get_settings()

    def _get_service_client(self) -> Client:
        """Get Supabase client with service role key for database operations."""
        if self.settings.supabase_service_key:
            return create_client(
                self.settings.supabase_url, self.settings.supabase_service_key
            )
        else:
            return get_db()

    async def submit_application(
        self, user_id: str, application_data: HostApplicationCreate
    ) -> HostApplicationResponse:
        """Submit a new host application."""
        try:
            service_client = self._get_service_client()

            # Check if user already has a pending application
            existing_response = (
                service_client.table("host_applications")
                .select("*")
                .eq("user_id", user_id)
                .eq("status", "pending")
                .execute()
            )

            if existing_response.data:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="You already have a pending host application",
                )

            # Check if user is already a host
            user_response = (
                service_client.table("users").select("role").eq("id", user_id).execute()
            )

            if user_response.data and user_response.data[0].get("role") == "host":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User is already a host",
                )

            # Prepare application data - AUTO-APPROVE for testing
            application_record = {
                "user_id": user_id,
                "application_data": application_data.model_dump(),
                "status": "approved",  # Auto-approve immediately
                "applied_at": datetime.utcnow().isoformat(),
                "reviewed_at": datetime.utcnow().isoformat(),  # Set reviewed timestamp
                "admin_notes": "Auto-approved for wallet-based registration",
            }

            # Insert application
            response = (
                service_client.table("host_applications")
                .insert(application_record)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to submit application",
                )

            # Immediately upgrade user to host role
            await self._upgrade_user_to_host(user_id)

            return HostApplicationResponse(**response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error submitting host application: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit host application",
            )

    async def get_user_application(
        self, user_id: str
    ) -> Optional[HostApplicationResponse]:
        """Get the current host application for a user."""
        try:
            service_client = self._get_service_client()

            response = (
                service_client.table("host_applications")
                .select("*")
                .eq("user_id", user_id)
                .order("applied_at", desc=True)
                .limit(1)
                .execute()
            )

            if response.data:
                return HostApplicationResponse(**response.data[0])

            return None

        except Exception as e:
            logger.error(f"Error getting user application: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve application",
            )

    async def get_applications_for_admin(
        self,
        status_filter: Optional[ApplicationStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[HostApplicationSummary]:
        """Get host applications for admin review."""
        try:
            service_client = self._get_service_client()

            # Build query
            query = service_client.table("host_applications").select(
                """
                    *,
                    users!host_applications_user_id_fkey(
                        full_name,
                        email
                    )
                """
            )

            if status_filter:
                query = query.eq("status", status_filter.value)

            response = (
                query.order("applied_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )

            # Transform data for summary view
            applications = []
            for item in response.data:
                user_info = item.get("users", {})
                app_data = item.get("application_data", {})

                applications.append(
                    HostApplicationSummary(
                        id=item["id"],
                        user_id=item["user_id"],
                        user_name=user_info.get("full_name", "Unknown"),
                        user_email=user_info.get("email", "unknown@email.com"),
                        status=ApplicationStatus(item["status"]),
                        experience_domains=app_data.get("experience_domains", []),
                        applied_at=datetime.fromisoformat(
                            item["applied_at"].replace("Z", "+00:00")
                        ),
                        reviewed_at=(
                            datetime.fromisoformat(
                                item["reviewed_at"].replace("Z", "+00:00")
                            )
                            if item.get("reviewed_at")
                            else None
                        ),
                    )
                )

            return applications

        except Exception as e:
            logger.error(f"Error getting applications for admin: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve applications",
            )

    async def review_application(
        self,
        application_id: str,
        review_data: HostApplicationReview,
        admin_user_id: str,
    ) -> HostApplicationResponse:
        """Review a host application (approve/reject)."""
        try:
            service_client = self._get_service_client()

            # Get the application
            app_response = (
                service_client.table("host_applications")
                .select("*")
                .eq("id", application_id)
                .execute()
            )

            if not app_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Application not found",
                )

            application = app_response.data[0]

            if application["status"] != "pending":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Application has already been reviewed",
                )

            # Update application
            update_data = {
                "status": review_data.decision.value,
                "admin_notes": review_data.admin_notes,
                "admin_feedback": review_data.feedback.model_dump(),
                "reviewed_at": datetime.utcnow().isoformat(),
                "reviewed_by": admin_user_id,
            }

            response = (
                service_client.table("host_applications")
                .update(update_data)
                .eq("id", application_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update application",
                )

            # If approved, upgrade user role to host
            if review_data.decision == ApplicationStatus.APPROVED:
                await self._upgrade_user_to_host(application["user_id"])

            return HostApplicationResponse(**response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reviewing application: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to review application",
            )

    async def _upgrade_user_to_host(self, user_id: str):
        """Upgrade user role to host after application approval."""
        try:
            service_client = self._get_service_client()

            # Update user role
            response = (
                service_client.table("users")
                .update(
                    {
                        "role": "host",
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                )
                .eq("id", user_id)
                .execute()
            )

            if not response.data:
                logger.error(f"Failed to upgrade user {user_id} to host role")
                # Don't raise exception here as the application review was successful
                # This is a separate operation that can be retried

        except Exception as e:
            logger.error(f"Error upgrading user {user_id} to host: {str(e)}")
            # Log but don't raise - the application review was successful

    async def get_application_by_id(
        self, application_id: str
    ) -> HostApplicationResponse:
        """Get a specific application by ID."""
        try:
            service_client = self._get_service_client()

            response = (
                service_client.table("host_applications")
                .select("*")
                .eq("id", application_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Application not found",
                )

            return HostApplicationResponse(**response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting application by ID: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve application",
            )

    async def get_application_stats(self) -> HostApplicationStats:
        """Get statistics for host applications dashboard."""
        try:
            service_client = self._get_service_client()

            # Get counts by status
            response = (
                service_client.table("host_applications").select("status").execute()
            )

            if not response.data:
                return HostApplicationStats(
                    total_applications=0,
                    pending_count=0,
                    approved_count=0,
                    rejected_count=0,
                    applications_this_month=0,
                )

            # Calculate stats
            total = len(response.data)
            pending = len([a for a in response.data if a["status"] == "pending"])
            approved = len([a for a in response.data if a["status"] == "approved"])
            rejected = len([a for a in response.data if a["status"] == "rejected"])

            # Get this month's applications
            current_month_start = datetime.now().replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            month_response = (
                service_client.table("host_applications")
                .select("applied_at")
                .gte("applied_at", current_month_start.isoformat())
                .execute()
            )

            this_month = len(month_response.data) if month_response.data else 0

            # Calculate average review time (for completed applications)
            avg_review_time = await self._calculate_avg_review_time()

            return HostApplicationStats(
                total_applications=total,
                pending_count=pending,
                approved_count=approved,
                rejected_count=rejected,
                applications_this_month=this_month,
                avg_review_time_days=avg_review_time,
            )

        except Exception as e:
            logger.error(f"Error getting application stats: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve application statistics",
            )

    async def _calculate_avg_review_time(self) -> Optional[float]:
        """Calculate average review time in days."""
        try:
            service_client = self._get_service_client()

            response = (
                service_client.table("host_applications")
                .select("applied_at, reviewed_at")
                .neq("status", "pending")
                .is_("reviewed_at", "not.null")
                .execute()
            )

            if not response.data:
                return None

            total_days = 0
            count = 0

            for app in response.data:
                applied = datetime.fromisoformat(
                    app["applied_at"].replace("Z", "+00:00")
                )
                reviewed = datetime.fromisoformat(
                    app["reviewed_at"].replace("Z", "+00:00")
                )
                days = (reviewed - applied).days
                total_days += days
                count += 1

            return round(total_days / count, 1) if count > 0 else None

        except Exception:
            return None


# Global service instance
host_application_service = HostApplicationService()
