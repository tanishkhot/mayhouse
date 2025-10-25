"""
Host Application API endpoints for Mayhouse Backend

Endpoints for host application submissions, reviews, and role management.
Note: Authentication is temporarily disabled pending metamask integration.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Query, Body
from app.schemas.host_application import (
    HostApplicationCreate,
    HostApplicationResponse,
    HostApplicationSummary,
    HostApplicationReview,
    HostApplicationStats,
    ApplicationStatus,
)
from app.services.host_application_service import host_application_service

# Create router with users prefix for user endpoints
user_router = APIRouter(prefix="/users", tags=["Host Applications - User"])

# Create router with admin prefix for admin endpoints
admin_router = APIRouter(prefix="/admin", tags=["Host Applications - Admin"])


# =============================================
# USER ENDPOINTS (Temporarily without auth)
# =============================================


@user_router.post(
    "/host-application",
    response_model=HostApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Host Application",
    description="Submit an application to become a host on the platform",
)
async def submit_host_application(
    application_data: HostApplicationCreate,
    user_id: str = Body(
        ..., description="User ID (temporary - will be from auth later)"
    ),
) -> HostApplicationResponse:
    """
    Submit a host application.

    Requirements:
    - User must be authenticated (temporarily disabled)
    - User cannot already be a host
    - User cannot have a pending application

    The application includes:
    - Experience domains and background
    - Sample experience idea
    - Availability preferences
    - Legal consents and terms acceptance
    """
    return await host_application_service.submit_application(
        user_id=user_id, application_data=application_data
    )


@user_router.get(
    "/host-application",
    response_model=Optional[HostApplicationResponse],
    summary="Get My Host Application",
    description="Get the current user's host application status",
)
async def get_my_host_application(
    user_id: str = Query(
        ..., description="User ID (temporary - will be from auth later)"
    )
) -> Optional[HostApplicationResponse]:
    """
    Get the current user's host application.

    Returns the most recent application submitted by the user,
    including status, admin feedback, and review information.
    """
    return await host_application_service.get_user_application(user_id)


# =============================================
# ADMIN ENDPOINTS (Temporarily without auth)
# =============================================


@admin_router.get(
    "/host-applications",
    response_model=List[HostApplicationSummary],
    summary="List Host Applications",
    description="Get list of host applications for admin review",
)
async def list_host_applications(
    status_filter: Optional[ApplicationStatus] = Query(
        None, description="Filter by application status"
    ),
    limit: int = Query(
        50, ge=1, le=100, description="Number of applications to return"
    ),
    offset: int = Query(0, ge=0, description="Number of applications to skip"),
) -> List[HostApplicationSummary]:
    """
    Get host applications for admin review.

    Features:
    - Filter by status (pending, approved, rejected)
    - Pagination support
    - Includes user information
    - Sorted by application date (newest first)
    """
    return await host_application_service.get_applications_for_admin(
        status_filter=status_filter, limit=limit, offset=offset
    )


@admin_router.get(
    "/host-applications/{application_id}",
    response_model=HostApplicationResponse,
    summary="Get Host Application Details",
    description="Get detailed information about a specific host application",
)
async def get_host_application_details(application_id: str) -> HostApplicationResponse:
    """
    Get detailed information about a specific host application.

    Includes:
    - Full application data
    - Admin notes and feedback
    - Review timestamps
    - Application status history
    """
    return await host_application_service.get_application_by_id(application_id)


@admin_router.post(
    "/host-applications/{application_id}/review",
    response_model=HostApplicationResponse,
    summary="Review Host Application",
    description="Approve or reject a host application",
)
async def review_host_application(
    application_id: str,
    review_data: HostApplicationReview,
    admin_user_id: str = Body(
        ..., description="Admin User ID (temporary - will be from auth later)"
    ),
) -> HostApplicationResponse:
    """
    Review a host application (approve or reject).

    Actions performed:
    - Update application status
    - Add admin notes and structured feedback
    - If approved: automatically upgrade user role to 'host'
    - Record review timestamp and admin ID

    Business Rules:
    - Only pending applications can be reviewed
    - Approved users get host role immediately
    - Comprehensive feedback is required for decisions
    """
    return await host_application_service.review_application(
        application_id=application_id,
        review_data=review_data,
        admin_user_id=admin_user_id,
    )


@admin_router.get(
    "/host-applications/stats",
    response_model=HostApplicationStats,
    summary="Host Application Statistics",
    description="Get statistics and metrics for host applications",
)
async def get_host_application_stats() -> HostApplicationStats:
    """
    Get host application statistics for admin dashboard.

    Metrics include:
    - Total applications submitted
    - Applications by status (pending, approved, rejected)
    - Applications submitted this month
    - Average review time
    """
    return await host_application_service.get_application_stats()


# =============================================
# UTILITY ENDPOINTS
# =============================================


@user_router.get(
    "/host-application/eligibility",
    summary="Check Host Application Eligibility",
    description="Check if current user is eligible to submit a host application and get required legal documents",
)
async def check_host_eligibility(
    user_id: str = Query(
        ..., description="User ID (temporary - will be from auth later)"
    )
) -> dict:
    """
    Check if the current user is eligible to submit a host application.

    Checks:
    - User is not already a host
    - User doesn't have a pending application
    - Account is in good standing
    """
    # Check if user is already a host
    from app.core.database import get_supabase_client

    supabase = get_supabase_client()

    try:
        user_response = (
            supabase.table("users").select("role").eq("id", user_id).execute()
        )
        if user_response.data and user_response.data[0].get("role") == "host":
            return {
                "eligible": False,
                "reason": "already_host",
                "message": "You are already a host on the platform",
            }
    except Exception:
        pass

    # Check for pending application
    try:
        existing_app = await host_application_service.get_user_application(user_id)
        if existing_app and existing_app.status == ApplicationStatus.PENDING:
            return {
                "eligible": False,
                "reason": "pending_application",
                "message": "You already have a pending host application",
                "application_id": existing_app.id,
                "applied_at": existing_app.applied_at,
            }
    except Exception:
        pass

    # Check if they have a rejected application (allow reapplication after 30 days)
    try:
        existing_app = await host_application_service.get_user_application(user_id)
        if existing_app and existing_app.status == ApplicationStatus.REJECTED:
            if existing_app.reviewed_at:
                from datetime import datetime, timedelta

                days_since_rejection = (
                    datetime.now() - existing_app.reviewed_at.replace(tzinfo=None)
                ).days
                if days_since_rejection < 30:
                    return {
                        "eligible": False,
                        "reason": "recent_rejection",
                        "message": f"Please wait {30 - days_since_rejection} more days before reapplying",
                        "can_reapply_at": existing_app.reviewed_at + timedelta(days=30),
                    }
    except Exception:
        pass

    return {
        "eligible": True,
        "message": "You are eligible to submit a host application",
        "legal_documents": {
            "terms_conditions": {
                "id": "terms_v1",
                "title": "Terms & Conditions",
                "version": "1.0",
                "summary": "Standard terms and conditions for hosts",
            },
            "background_verification": {
                "id": "bg_check_v1",
                "title": "Background Verification Policy",
                "version": "1.0",
                "summary": "Background verification requirements for hosts",
            },
        },
        "next_steps": [
            "Review Terms & Conditions",
            "Review Background Verification policy",
            "Complete host application form",
            "Submit for admin review",
        ],
    }
