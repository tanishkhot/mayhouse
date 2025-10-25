"""
Legal Policies API endpoints for Mayhouse Backend

Endpoints for serving legal documents like terms & conditions,
background verification consent, and other policy documents.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from pydantic import BaseModel

from app.schemas.legal_policies import (
    LegalPolicyResponse,
    PolicyType,
    LegalDocumentsBundle,
)
from app.services.legal_policies_service import legal_policies_service

# Create router with legal prefix
router = APIRouter(prefix="/legal", tags=["Legal Policies"])


# Request body schemas
class InitializePoliciesRequest(BaseModel):
    admin_user_id: str


@router.get(
    "/policies/{policy_type}",
    response_model=LegalPolicyResponse,
    summary="Get Legal Policy Document",
    description="Retrieve a specific legal policy document by type",
)
async def get_policy_document(
    policy_type: PolicyType = Path(
        ..., description="Type of policy document to retrieve"
    )
) -> LegalPolicyResponse:
    """
    Get a legal policy document by type.

    Available policy types:
    - terms_conditions: Terms & Conditions for hosts
    - background_verification: Background verification consent
    - privacy_policy: Privacy policy
    - host_agreement: Host agreement terms
    - cancellation_policy: Cancellation and refund policy

    Returns the active version of the requested policy document.
    """
    policy = await legal_policies_service.get_policy_by_type(policy_type)

    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy document '{policy_type.value}' not found",
        )

    return policy


@router.get(
    "/host-application/documents",
    response_model=LegalDocumentsBundle,
    summary="Get Host Application Legal Documents",
    description="Get all legal documents required for host application process",
)
async def get_host_application_legal_documents() -> LegalDocumentsBundle:
    """
    Get all legal documents required for the host application process.

    Returns:
    - Terms & Conditions
    - Background Verification Consent
    - Host Agreement (if available)

    This endpoint is typically called by the frontend to display
    legal documents during the host application flow.
    """
    return await legal_policies_service.get_host_application_legal_bundle()


@router.get(
    "/terms-conditions",
    response_model=LegalPolicyResponse,
    summary="Get Terms & Conditions",
    description="Get the current Terms & Conditions document",
)
async def get_terms_conditions() -> LegalPolicyResponse:
    """
    Get the current Terms & Conditions document.

    Convenience endpoint for quick access to T&C without specifying policy type.
    """
    return await get_policy_document(PolicyType.TERMS_CONDITIONS)


@router.get(
    "/background-verification",
    response_model=LegalPolicyResponse,
    summary="Get Background Verification Policy",
    description="Get the current Background Verification consent document",
)
async def get_background_verification() -> LegalPolicyResponse:
    """
    Get the current Background Verification consent document.

    Convenience endpoint for quick access to background verification policy.
    """
    return await get_policy_document(PolicyType.BACKGROUND_VERIFICATION)


@router.get(
    "/privacy-policy",
    response_model=LegalPolicyResponse,
    summary="Get Privacy Policy",
    description="Get the current Privacy Policy document",
)
async def get_privacy_policy() -> LegalPolicyResponse:
    """
    Get the current Privacy Policy document.

    Convenience endpoint for quick access to privacy policy.
    """
    return await get_policy_document(PolicyType.PRIVACY_POLICY)


# Admin endpoint for creating default policies
@router.post(
    "/admin/initialize-policies",
    summary="Initialize Default Legal Policies",
    description="Create default legal policy documents (Admin only)",
)
async def initialize_default_policies(
    request: InitializePoliciesRequest,
) -> dict:
    """
    Initialize default legal policy documents.

    Creates default versions of:
    - Terms & Conditions
    - Background Verification Consent

    This is typically run once during system setup.
    Note: Currently no admin check - will add when admin middleware is ready.
    """
    try:
        await legal_policies_service.create_default_policies()
        return {
            "message": "Default legal policies initialized successfully",
            "policies_created": [
                "terms_conditions",
                "background_verification",
            ],
            "admin_user_id": request.admin_user_id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize policies: {str(e)}",
        )


@router.get(
    "/health",
    summary="Legal Policies Health Check",
    description="Check if legal policies service is working",
)
async def legal_policies_health_check() -> dict:
    """
    Health check endpoint for legal policies service.

    Verifies that required policies are available.
    """
    try:
        bundle = await legal_policies_service.get_host_application_legal_bundle()
        return {
            "status": "healthy",
            "policies_available": {
                "terms_conditions": bundle.terms_conditions is not None,
                "background_verification": bundle.background_verification is not None,
                "host_agreement": bundle.host_agreement is not None,
            },
            "last_updated": bundle.last_updated.isoformat(),
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }
