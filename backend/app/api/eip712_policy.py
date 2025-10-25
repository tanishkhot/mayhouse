"""
EIP-712 Policy Signing API Endpoints for Mayhouse Backend

This module provides API endpoints for EIP-712 structured data signing
of policy acceptances, enabling secure and legally compliant policy agreements.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Path, Body, Request
from pydantic import BaseModel

from app.schemas.eip712_policy import (
    PolicySignatureRequest,
    PolicySignatureResponse,
    PolicySignatureVerification,
    PolicyAcceptanceRecord,
    PolicyAcceptanceStatus,
    BulkPolicySignatureRequest,
    BulkPolicySignatureResponse,
)
from app.schemas.legal_policies import PolicyType
from app.schemas.user import UserResponse  # For temporary auth bypass
from app.services.eip712_policy_service import eip712_policy_service

# Create router
router = APIRouter(prefix="/legal/eip712", tags=["EIP-712 Policy Signing"])


# Request body schemas for temporary auth bypass
class PolicySignatureRequestWithUser(BaseModel):
    signature_request: PolicySignatureRequest
    user_id: str  # Temporary - will be from auth later


class PolicySignatureVerificationWithUser(BaseModel):
    verification: PolicySignatureVerification
    user_id: str  # Temporary - will be from auth later


class BulkPolicySignatureRequestWithUser(BaseModel):
    bulk_request: BulkPolicySignatureRequest
    user_id: str  # Temporary - will be from auth later


class PolicyStatusRequest(BaseModel):
    user_address: str
    user_id: str  # Temporary - will be from auth later


@router.post(
    "/prepare-signature",
    response_model=PolicySignatureResponse,
    summary="Prepare Policy Signature",
    description="Prepare EIP-712 structured data for signing a single policy",
)
async def prepare_policy_signature(
    request: PolicySignatureRequestWithUser, http_request: Request
) -> PolicySignatureResponse:
    """
    Prepare EIP-712 structured data for policy signing.

    This endpoint generates the structured data that needs to be signed
    by the user's wallet to accept a specific policy.

    Args:
        request: Policy signature request with user ID
        http_request: HTTP request for context

    Returns:
        EIP-712 structured data ready for wallet signing

    Example:
        ```json
        {
            "signature_request": {
                "policy_type": "terms_conditions",
                "user_address": "0x1234...",
                "context": "host_application"
            },
            "user_id": "user123"
        }
        ```
    """
    try:
        return await eip712_policy_service.prepare_policy_signature(
            request.signature_request
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to prepare policy signature: {str(e)}",
        )


@router.post(
    "/prepare-bulk-signature",
    response_model=BulkPolicySignatureResponse,
    summary="Prepare Bulk Policy Signature",
    description="Prepare EIP-712 structured data for signing multiple policies at once",
)
async def prepare_bulk_policy_signature(
    request: BulkPolicySignatureRequestWithUser, http_request: Request
) -> BulkPolicySignatureResponse:
    """
    Prepare EIP-712 structured data for bulk policy signing.

    This endpoint generates structured data for signing multiple policies
    in a single transaction, useful for host applications that require
    multiple policy acceptances.

    Args:
        request: Bulk policy signature request with user ID
        http_request: HTTP request for context

    Returns:
        EIP-712 structured data for bulk policy signing

    Example:
        ```json
        {
            "bulk_request": {
                "policy_types": ["terms_conditions", "background_verification"],
                "user_address": "0x1234...",
                "context": "host_application"
            },
            "user_id": "user123"
        }
        ```
    """
    try:
        return await eip712_policy_service.prepare_bulk_policy_signature(
            request.bulk_request
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to prepare bulk policy signature: {str(e)}",
        )


@router.post(
    "/verify-signature",
    response_model=PolicyAcceptanceRecord,
    summary="Verify Policy Signature",
    description="Verify EIP-712 signature and record policy acceptance",
)
async def verify_policy_signature(
    request: PolicySignatureVerificationWithUser, http_request: Request
) -> PolicyAcceptanceRecord:
    """
    Verify EIP-712 policy signature and record acceptance.

    This endpoint verifies the signature provided by the user's wallet
    and creates a permanent record of the policy acceptance.

    Args:
        request: Signature verification request with user ID
        http_request: HTTP request for context

    Returns:
        Policy acceptance record

    Example:
        ```json
        {
            "verification": {
                "policy_type": "terms_conditions",
                "user_address": "0x1234...",
                "signature": "0xabcd...",
                "nonce": "uuid-string",
                "context": "host_application"
            },
            "user_id": "user123"
        }
        ```
    """
    try:
        # Add request context to verification
        verification = request.verification

        # Add IP and user agent to the verification object
        verification_dict = verification.model_dump()
        verification_dict["user_ip"] = (
            http_request.client.host if http_request.client else None
        )
        verification_dict["user_agent"] = http_request.headers.get("user-agent")

        # Create a new verification object with the additional fields
        from app.schemas.eip712_policy import PolicySignatureVerification

        enhanced_verification = PolicySignatureVerification(**verification_dict)

        return await eip712_policy_service.verify_policy_signature(
            enhanced_verification
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify policy signature: {str(e)}",
        )


@router.post(
    "/policy-status/{user_address}",
    response_model=PolicyAcceptanceStatus,
    summary="Get User Policy Status",
    description="Get policy acceptance status for a user",
)
async def get_user_policy_status(
    user_address: str = Path(..., description="User's wallet address"),
    user_id: str = Body(
        ..., description="User ID (temporary - will be from auth later"
    ),
) -> PolicyAcceptanceStatus:
    """
    Get policy acceptance status for a user.

    Returns information about which policies the user has accepted
    and which ones are still required.

    Args:
        user_address: User's wallet address
        user_id: User ID for database lookup

    Returns:
        Policy acceptance status

    Example:
        GET /legal/eip712/policy-status/0x1234...
        Body: {"user_id": "user123"}
    """
    try:
        return await eip712_policy_service.get_user_policy_status(user_address, user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get policy status: {str(e)}",
        )


@router.get(
    "/required-policies/{context}",
    response_model=List[PolicyType],
    summary="Get Required Policies",
    description="Get list of required policies for a given context",
)
async def get_required_policies(
    context: str = Path(
        ..., description="Context (e.g., 'host_application', 'user_registration')"
    )
) -> List[PolicyType]:
    """
    Get list of required policies for a given context.

    This endpoint helps the frontend determine which policies
    need to be signed for different user flows.

    Args:
        context: Context for which to get required policies

    Returns:
        List of required policy types

    Example:
        GET /legal/eip712/required-policies/host_application
    """
    try:
        return await eip712_policy_service.get_required_policies_for_context(context)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get required policies: {str(e)}",
        )


@router.get(
    "/health",
    summary="EIP-712 Policy Service Health Check",
    description="Check if EIP-712 policy signing service is working",
)
async def eip712_policy_health_check() -> dict:
    """
    Health check endpoint for EIP-712 policy signing service.

    Verifies that the service is working and can prepare signatures.
    """
    try:
        # Test preparing a signature
        test_request = PolicySignatureRequest(
            policy_type=PolicyType.TERMS_CONDITIONS,
            user_address="0x0000000000000000000000000000000000000000",
            context="test",
        )

        await eip712_policy_service.prepare_policy_signature(test_request)

        return {
            "status": "healthy",
            "service": "eip712_policy_signing",
            "features": [
                "single_policy_signing",
                "bulk_policy_signing",
                "signature_verification",
                "policy_status_tracking",
            ],
            "supported_contexts": ["host_application", "user_registration", "general"],
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "eip712_policy_signing",
            "error": str(e),
        }
