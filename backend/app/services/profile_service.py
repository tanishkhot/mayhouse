"""
Profile Service for Mayhouse Backend

Service layer for managing user profiles with public profile data,
host statistics, and experience listings.
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from app.core.database import get_service_client

logger = logging.getLogger(__name__)


class ProfileService:
    """Service for managing user profiles."""

    def _get_service_client(self):
        """Get database service client."""
        return get_service_client()

    async def get_public_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get public profile data with aggregated statistics.
        
        Returns user info, host stats (if host), and basic profile data.
        """
        try:
            service_client = self._get_service_client()
            
            # Get user data
            user_response = (
                service_client.table("users")
                .select("*")
                .eq("id", user_id)
                .execute()
            )
            
            if not user_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            user = user_response.data[0]
            
            # Build base profile
            profile = {
                "id": user["id"],
                "full_name": user.get("full_name"),
                "username": user.get("username"),
                "bio": user.get("bio"),
                "profile_image_url": user.get("profile_image_url"),
                "wallet_address": user.get("wallet_address"),
                "role": user.get("role", "user"),
                "created_at": user.get("created_at"),
                "email": user.get("email"),  # Include for own profile checks
            }
            
            # If user is a host, get host statistics
            if user.get("role") == "host":
                host_stats = await self.get_host_statistics(user_id)
                profile["host_stats"] = host_stats
                
                # Get host application data if available
                app_response = (
                    service_client.table("host_applications")
                    .select("*")
                    .eq("user_id", user_id)
                    .eq("status", "approved")
                    .order("applied_at", desc=False)
                    .limit(1)
                    .execute()
                )
                
                if app_response.data:
                    app_data = app_response.data[0].get("application_data", {})
                    profile["host_application"] = {
                        "languages_spoken": app_data.get("languages_spoken", []),
                        "hosting_experience": app_data.get("hosting_experience"),
                        "why_host": app_data.get("why_host"),
                        "special_skills": app_data.get("special_skills"),
                    }
            
            return profile
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting public profile: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get profile"
            )

    async def get_host_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Calculate and return host statistics.
        
        Returns: experience_count, event_run_count, travelers_hosted, 
                 avg_rating, years_hosting, response_rate
        """
        try:
            service_client = self._get_service_client()
            
            # Get experience count (approved only)
            exp_response = (
                service_client.table("experiences")
                .select("id, created_at, approved_at", count="exact")
                .eq("host_id", user_id)
                .eq("status", "approved")
                .execute()
            )
            
            experience_count = exp_response.count if exp_response.count else 0
            
            # Get first experience date for years_hosting calculation
            first_exp_date = None
            if exp_response.data and len(exp_response.data) > 0:
                first_exp = min(
                    exp_response.data,
                    key=lambda x: x.get("created_at") or x.get("approved_at") or "9999-12-31"
                )
                first_exp_date = first_exp.get("approved_at") or first_exp.get("created_at")
            
            # Calculate years hosting
            years_hosting = 0
            if first_exp_date:
                try:
                    if isinstance(first_exp_date, str):
                        first_date = datetime.fromisoformat(first_exp_date.replace("Z", "+00:00"))
                    else:
                        first_date = first_exp_date
                    years_hosting = (datetime.now(first_date.tzinfo) - first_date).days / 365.25
                    years_hosting = max(0, round(years_hosting, 1))
                except:
                    years_hosting = 0
            
            # Get event run count - need to join through experiences table
            runs_response = (
                service_client.table("event_runs")
                .select(
                    """
                    id,
                    experiences!inner (host_id)
                """
                )
                .eq("experiences.host_id", user_id)
                .execute()
            )
            
            event_run_count = len(runs_response.data) if runs_response.data else 0
            
            # Get total travelers hosted (sum of all bookings)
            # Need to join through event_runs to get host_id
            # First get all event_run_ids for this host
            host_runs_response = (
                service_client.table("event_runs")
                .select(
                    """
                    id,
                    experiences!inner (host_id)
                """
                )
                .eq("experiences.host_id", user_id)
                .execute()
            )
            
            travelers_hosted = 0
            if host_runs_response.data:
                event_run_ids = [run["id"] for run in host_runs_response.data]
                
                # Get bookings for these event runs
                # Note: column is 'traveler_count' not 'seat_count', and 'booking_status' not 'status'
                bookings_response = (
                    service_client.table("event_run_bookings")
                    .select("traveler_count")
                    .in_("event_run_id", event_run_ids)
                    .in_("booking_status", ["confirmed", "experience_completed"])
                    .execute()
                )
                
                if bookings_response.data:
                    travelers_hosted = sum(
                        booking.get("traveler_count", 0) 
                        for booking in bookings_response.data
                    )
            
            # Calculate average rating (placeholder - reviews system not yet implemented)
            avg_rating = None
            review_count = 0
            
            # Response rate (placeholder - messaging system not yet implemented)
            response_rate = None
            
            return {
                "experience_count": experience_count,
                "event_run_count": event_run_count,
                "travelers_hosted": travelers_hosted,
                "avg_rating": avg_rating,
                "review_count": review_count,
                "years_hosting": years_hosting,
                "response_rate": response_rate,
            }
            
        except Exception as e:
            logger.error(f"Error calculating host statistics: {str(e)}")
            # Return default stats on error
            return {
                "experience_count": 0,
                "event_run_count": 0,
                "travelers_hosted": 0,
                "avg_rating": None,
                "review_count": 0,
                "years_hosting": 0,
                "response_rate": None,
            }

    async def get_host_experiences(
        self, user_id: str, limit: int = 10, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get host's approved experiences for public display.
        
        Returns list of experiences with basic info.
        """
        try:
            service_client = self._get_service_client()
            
            # Get approved experiences
            response = (
                service_client.table("experiences")
                .select(
                    "id, title, experience_domain, price_inr, neighborhood, "
                    "city, created_at, approved_at"
                )
                .eq("host_id", user_id)
                .eq("status", "approved")
                .order("approved_at", desc=True)
                .limit(limit)
                .offset(offset)
                .execute()
            )
            
            experiences = []
            if response.data:
                # Get cover photos for each experience
                for exp in response.data:
                    exp_id = exp["id"]
                    
                    # Get cover photo
                    photo_response = (
                        service_client.table("experience_photos")
                        .select("photo_url")
                        .eq("experience_id", exp_id)
                        .eq("is_cover_photo", True)
                        .limit(1)
                        .execute()
                    )
                    
                    cover_photo_url = None
                    if photo_response.data:
                        cover_photo_url = photo_response.data[0].get("photo_url")
                    
                    experiences.append({
                        "id": exp_id,
                        "title": exp.get("title"),
                        "domain": exp.get("experience_domain"),
                        "price_inr": float(exp.get("price_inr", 0)),
                        "neighborhood": exp.get("neighborhood"),
                        "city": exp.get("city", "Mumbai"),
                        "cover_photo_url": cover_photo_url,
                        "created_at": exp.get("created_at"),
                    })
            
            return experiences
            
        except Exception as e:
            logger.error(f"Error getting host experiences: {str(e)}")
            return []

    async def calculate_years_hosting(self, user_id: str) -> float:
        """
        Calculate years of hosting from first approved experience.
        
        Returns number of years (can be fractional).
        """
        try:
            service_client = self._get_service_client()
            
            # Get first approved experience
            response = (
                service_client.table("experiences")
                .select("approved_at, created_at")
                .eq("host_id", user_id)
                .eq("status", "approved")
                .order("approved_at", desc=False)
                .limit(1)
                .execute()
            )
            
            if not response.data:
                return 0.0
            
            first_exp = response.data[0]
            first_date_str = first_exp.get("approved_at") or first_exp.get("created_at")
            
            if not first_date_str:
                return 0.0
            
            # Parse date and calculate years
            try:
                if isinstance(first_date_str, str):
                    first_date = datetime.fromisoformat(first_date_str.replace("Z", "+00:00"))
                else:
                    first_date = first_date_str
                
                now = datetime.now(first_date.tzinfo) if first_date.tzinfo else datetime.now()
                delta = now - first_date
                years = delta.days / 365.25
                return max(0.0, round(years, 1))
            except Exception as e:
                logger.error(f"Error parsing date for years_hosting: {str(e)}")
                return 0.0
                
        except Exception as e:
            logger.error(f"Error calculating years hosting: {str(e)}")
            return 0.0


# Create service instance
profile_service = ProfileService()

