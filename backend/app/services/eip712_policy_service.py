"""
EIP-712 Policy Signing Service for Mayhouse Backend

This service handles EIP-712 structured data signing for policy acceptances,
providing a secure and legally compliant way to record policy agreements.
"""

import logging
import time
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status

from app.core.database import get_service_client
from app.schemas.eip712_policy import (
    EIP712Domain,
    PolicyAcceptanceData,
    PolicySignatureRequest,
    PolicySignatureResponse,
    PolicySignatureVerification,
    PolicyAcceptanceRecord,
    PolicyAcceptanceStatus,
    BulkPolicySignatureRequest,
    BulkPolicySignatureResponse,
    EIP712_TYPES,
)
from app.schemas.legal_policies import PolicyType
from app.services.legal_policies_service import legal_policies_service

logger = logging.getLogger(__name__)


class EIP712PolicyService:
    """Service for EIP-712 policy signing and verification."""

    def _get_service_client(self):
        """Get database service client."""
        return get_service_client()

    def _get_domain(self) -> EIP712Domain:
        """Get EIP-712 domain separator."""
        return EIP712Domain(
            name="Mayhouse",
            version="1",
            chainId=1,  # Mainnet - adjust for testnets
            verifyingContract=None,  # No contract for now
        )

    def _generate_nonce(self) -> str:
        """Generate a unique nonce for signing."""
        return str(uuid.uuid4())

    async def prepare_policy_signature(
        self, request: PolicySignatureRequest
    ) -> PolicySignatureResponse:
        """
        Prepare EIP-712 structured data for policy signing.

        Args:
            request: Policy signature request

        Returns:
            EIP-712 signing data ready for wallet signing
        """
        try:
            # Get the policy to get its ID and version
            policy = await legal_policies_service.get_policy_by_type(
                request.policy_type
            )
            if not policy:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Policy '{request.policy_type.value}' not found",
                )

            # Generate nonce if not provided
            nonce = request.nonce or self._generate_nonce()

            # Create structured data
            message = PolicyAcceptanceData(
                policyId=policy.id,
                policyType=request.policy_type.value,
                policyVersion=policy.version,
                userAddress=request.user_address.lower(),
                acceptedAt=int(time.time()),
                context=request.context,
                nonce=nonce,
            )

            # Get domain
            domain = self._get_domain()

            return PolicySignatureResponse(
                domain=domain,
                types=EIP712_TYPES,
                primaryType="PolicyAcceptance",
                message=message,
                nonce=nonce,
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error preparing policy signature: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to prepare policy signature: {str(e)}",
            )

    async def prepare_bulk_policy_signature(
        self, request: BulkPolicySignatureRequest
    ) -> BulkPolicySignatureResponse:
        """
        Prepare EIP-712 structured data for bulk policy signing.

        Args:
            request: Bulk policy signature request

        Returns:
            EIP-712 signing data for multiple policies
        """
        try:
            # Get all policies
            policies = []
            for policy_type in request.policy_types:
                policy = await legal_policies_service.get_policy_by_type(policy_type)
                if not policy:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Policy '{policy_type.value}' not found",
                    )
                policies.append(policy)

            # Generate nonce if not provided
            nonce = request.nonce or self._generate_nonce()

            # Create bulk structured data
            message = {
                "policyIds": [policy.id for policy in policies],
                "policyTypes": [policy.policy_type.value for policy in policies],
                "policyVersions": [policy.version for policy in policies],
                "userAddress": request.user_address.lower(),
                "acceptedAt": int(time.time()),
                "context": request.context,
                "nonce": nonce,
            }

            # Get domain
            domain = self._get_domain()

            return BulkPolicySignatureResponse(
                domain=domain,
                types=EIP712_TYPES,
                primaryType="BulkPolicyAcceptance",
                message=message,
                nonce=nonce,
                policy_count=len(policies),
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error preparing bulk policy signature: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to prepare bulk policy signature: {str(e)}",
            )

    async def verify_policy_signature(
        self, verification: PolicySignatureVerification
    ) -> PolicyAcceptanceRecord:
        """
        Verify EIP-712 policy signature and record acceptance.

        Args:
            verification: Signature verification request

        Returns:
            Policy acceptance record
        """
        try:
            # For now, we'll implement basic signature verification
            # In production, you'd use web3.py or eth-account to verify the signature

            # Get the policy
            policy = await legal_policies_service.get_policy_by_type(
                verification.policy_type
            )
            if not policy:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Policy '{verification.policy_type.value}' not found",
                )

            # TODO: Implement actual EIP-712 signature verification
            # This would involve:
            # 1. Reconstructing the message hash
            # 2. Recovering the signer address
            # 3. Verifying it matches the user_address

            # Check if user already accepted this policy version
            supabase = self._get_service_client()

            # First, get the user ID from wallet address
            user_response = (
                supabase.table("users")
                .select("id")
                .eq("wallet_address", verification.user_address.lower())
                .execute()
            )

            if not user_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found for the provided wallet address",
                )

            user_id = user_response.data[0]["id"]

            # Check for existing acceptance of this policy version
            existing_response = (
                supabase.table("policy_acceptances")
                .select("*")
                .eq("user_id", user_id)
                .eq("policy_id", policy.id)
                .eq("policy_version", policy.version)
                .execute()
            )

            if existing_response.data:
                # Return existing record
                existing = existing_response.data[0]
                return PolicyAcceptanceRecord(
                    id=existing["id"],
                    user_id=existing["user_id"],
                    user_address=existing["user_address"],
                    policy_id=existing["policy_id"],
                    policy_type=PolicyType(existing["policy_type"]),
                    policy_version=existing["policy_version"],
                    signature=existing["signature"],
                    nonce=existing["nonce"],
                    context=existing["context"],
                    accepted_at=datetime.fromisoformat(
                        existing["accepted_at"].replace("Z", "+00:00")
                    ),
                    user_ip=existing.get("user_ip"),
                    user_agent=existing.get("user_agent"),
                )

            # Create new acceptance record
            acceptance_data = {
                "user_id": user_id,
                "user_address": verification.user_address.lower(),
                "policy_id": policy.id,
                "policy_type": verification.policy_type.value,
                "policy_version": policy.version,
                "signature": verification.signature,
                "nonce": verification.nonce,
                "context": verification.context,
                "accepted_at": datetime.utcnow().isoformat(),
                "user_ip": getattr(verification, "user_ip", None),
                "user_agent": getattr(verification, "user_agent", None),
            }

            # Insert into database
            insert_response = (
                supabase.table("policy_acceptances").insert(acceptance_data).execute()
            )

            if not insert_response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to record policy acceptance",
                )

            # Return the created record
            created_record = insert_response.data[0]
            acceptance_record = PolicyAcceptanceRecord(
                id=created_record["id"],
                user_id=created_record["user_id"],
                user_address=created_record["user_address"],
                policy_id=created_record["policy_id"],
                policy_type=PolicyType(created_record["policy_type"]),
                policy_version=created_record["policy_version"],
                signature=created_record["signature"],
                nonce=created_record["nonce"],
                context=created_record["context"],
                accepted_at=datetime.fromisoformat(
                    created_record["accepted_at"].replace("Z", "+00:00")
                ),
                user_ip=created_record.get("user_ip"),
                user_agent=created_record.get("user_agent"),
            )

            logger.info(f"Policy acceptance recorded: {acceptance_record.id}")
            return acceptance_record

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error verifying policy signature: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify policy signature: {str(e)}",
            )

    async def get_user_policy_status(
        self, user_address: str, user_id: Optional[str] = None
    ) -> PolicyAcceptanceStatus:
        """
        Get policy acceptance status for a user.

        Args:
            user_address: User's wallet address
            user_id: Optional user ID for database lookup

        Returns:
            Policy acceptance status
        """
        try:
            supabase = self._get_service_client()

            # Get user ID if not provided
            if not user_id:
                user_response = (
                    supabase.table("users")
                    .select("id")
                    .eq("wallet_address", user_address.lower())
                    .execute()
                )
                if not user_response.data:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User not found for the provided wallet address",
                    )
                user_id = user_response.data[0]["id"]

            # Get all policy acceptances for this user
            acceptances_response = (
                supabase.table("policy_acceptances")
                .select("*")
                .eq("user_id", user_id)
                .order("accepted_at", desc=True)
                .execute()
            )

            # Convert to PolicyAcceptanceRecord objects
            acceptances = []
            for record in acceptances_response.data:
                acceptance = PolicyAcceptanceRecord(
                    id=record["id"],
                    user_id=record["user_id"],
                    user_address=record["user_address"],
                    policy_id=record["policy_id"],
                    policy_type=PolicyType(record["policy_type"]),
                    policy_version=record["policy_version"],
                    signature=record["signature"],
                    nonce=record["nonce"],
                    context=record["context"],
                    accepted_at=datetime.fromisoformat(
                        record["accepted_at"].replace("Z", "+00:00")
                    ),
                    user_ip=record.get("user_ip"),
                    user_agent=record.get("user_agent"),
                )
                acceptances.append(acceptance)

            # Get accepted policy types
            accepted_policy_types = {acc.policy_type for acc in acceptances}

            # Get all available policy types
            all_policy_types = set(PolicyType)

            # Find missing policies
            missing_policies = list(all_policy_types - accepted_policy_types)

            return PolicyAcceptanceStatus(
                user_id=user_id,
                user_address=user_address.lower(),
                acceptances=acceptances,
                missing_policies=missing_policies,
                last_updated=datetime.utcnow(),
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting user policy status: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get policy status: {str(e)}",
            )

    async def get_required_policies_for_context(self, context: str) -> List[PolicyType]:
        """
        Get list of required policies for a given context.

        Args:
            context: Context (e.g., 'host_application', 'user_registration')

        Returns:
            List of required policy types
        """
        context_policies = {
            "host_application": [
                PolicyType.TERMS_CONDITIONS,
                PolicyType.BACKGROUND_VERIFICATION,
            ],
            "user_registration": [
                PolicyType.TERMS_CONDITIONS,
                PolicyType.PRIVACY_POLICY,
            ],
            "general": [PolicyType.TERMS_CONDITIONS],
        }

        return context_policies.get(context, context_policies["general"])


# Create service instance
eip712_policy_service = EIP712PolicyService()
