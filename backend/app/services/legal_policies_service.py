"""
Legal Policies Service for Mayhouse Backend

Service for managing and serving legal policy documents like terms & conditions,
background verification consent, and privacy policies.
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status

from app.core.database import get_service_client
from app.schemas.legal_policies import (
    LegalPolicyResponse,
    PolicyType,
    PolicyStatus,
    LegalDocumentsBundle,
    PolicyAcceptanceCreate,
    PolicyAcceptanceResponse,
    UserPolicyStatus,
)

logger = logging.getLogger(__name__)


class LegalPoliciesService:
    """Service for managing legal policy documents."""

    def _get_service_client(self):
        """Get database service client."""
        return get_service_client()

    async def get_policy_by_type(
        self, policy_type: PolicyType
    ) -> Optional[LegalPolicyResponse]:
        """Get the active policy document by type."""
        try:
            # For now, return in-memory policies (will use database later)
            policies = self._get_default_policies_dict()

            if policy_type.value in policies:
                policy_data = policies[policy_type.value]
                return LegalPolicyResponse(**policy_data)

            return None

        except Exception as e:
            logger.error(f"Error getting policy {policy_type}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve {policy_type} policy",
            )

    async def get_host_application_legal_bundle(self) -> LegalDocumentsBundle:
        """Get all legal documents required for host application."""
        try:
            # Get required policies
            terms_conditions = await self.get_policy_by_type(
                PolicyType.TERMS_CONDITIONS
            )
            background_verification = await self.get_policy_by_type(
                PolicyType.BACKGROUND_VERIFICATION
            )
            host_agreement = await self.get_policy_by_type(PolicyType.HOST_AGREEMENT)

            if not terms_conditions:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Terms & Conditions policy not found",
                )

            if not background_verification:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Background Verification policy not found",
                )

            return LegalDocumentsBundle(
                terms_conditions=terms_conditions,
                background_verification=background_verification,
                host_agreement=host_agreement,
                last_updated=datetime.utcnow(),
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting legal bundle: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve legal documents",
            )

    async def create_default_policies(self):
        """Create default policy documents (in-memory for now)."""
        try:
            logger.info("Default legal policies initialized (in-memory)")
            return True
        except Exception as e:
            logger.error(f"Error creating default policies: {str(e)}")
            raise

    def _get_default_policies_dict(self) -> dict:
        """Get default policies as dictionary."""
        now = datetime.utcnow()

        return {
            "terms_conditions": {
                "id": "terms-v1-2025",
                "policy_type": PolicyType.TERMS_CONDITIONS,
                "title": "Terms & Conditions for Mayhouse Hosts",
                "version": "1.0",
                "content": self._get_terms_conditions_content(),
                "summary": "Agreement outlining host responsibilities, platform usage, and service terms.",
                "effective_date": now,
                "last_updated": now,
                "status": PolicyStatus.ACTIVE,
            },
            "background_verification": {
                "id": "background-v1-2025",
                "policy_type": PolicyType.BACKGROUND_VERIFICATION,
                "title": "Background Verification Consent",
                "version": "1.0",
                "content": self._get_background_verification_content(),
                "summary": "Consent for identity verification and background checks for host safety.",
                "effective_date": now,
                "last_updated": now,
                "status": PolicyStatus.ACTIVE,
            },
        }

    def _get_terms_conditions_content(self) -> str:
        """Get Terms & Conditions content (Lorem ipsum for now)."""
        return """
        <div class="legal-document">
            <h2>Terms & Conditions for Mayhouse Hosts</h2>
            <p><em>Last Updated: October 2025</em></p>
            
            <h3>1. Host Agreement Overview</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
            
            <h3>2. Host Responsibilities</h3>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident:</p>
            <ul>
                <li>Provide authentic and safe experiences</li>
                <li>Maintain professional conduct with travelers</li>
                <li>Adhere to local laws and regulations</li>
                <li>Deliver experiences as described</li>
            </ul>
            
            <h3>3. Platform Usage</h3>
            <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.</p>
            
            <h3>4. Revenue Sharing</h3>
            <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti:</p>
            <ul>
                <li>Hosts receive 70% of experience price</li>
                <li>Mayhouse retains 30% platform fee</li>
                <li>Monthly payouts on the 15th</li>
            </ul>
            
            <h3>5. Cancellation Policy</h3>
            <p>Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.</p>
            
            <h3>6. Agreement Termination</h3>
            <p>Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.</p>
            
            <p><strong>By accepting these terms, you agree to provide authentic experiences while maintaining the highest standards of safety and professionalism.</strong></p>
        </div>
        """

    def _get_background_verification_content(self) -> str:
        """Get Background Verification content (Lorem ipsum for now)."""
        return """
        <div class="legal-document">
            <h2>Background Verification Consent</h2>
            <p><em>Last Updated: October 2025</em></p>
            
            <h3>Purpose of Verification</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mayhouse requires background verification to ensure the safety and security of all travelers using our platform.</p>
            
            <h3>What We Verify</h3>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat:</p>
            <ul>
                <li>Identity verification through government-issued ID</li>
                <li>Address verification</li>
                <li>Criminal background check (where legally permissible)</li>
                <li>Professional references (optional)</li>
            </ul>
            
            <h3>Verification Process</h3>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. The verification process includes:</p>
            <ol>
                <li>Document submission through secure portal</li>
                <li>Third-party verification service processing</li>
                <li>Manual review by our safety team</li>
                <li>Approval notification within 3-5 business days</li>
            </ol>
            
            <h3>Data Protection</h3>
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollitia animi. All verification data is:</p>
            <ul>
                <li>Encrypted during transmission and storage</li>
                <li>Accessed only by authorized personnel</li>
                <li>Retained only as long as necessary</li>
                <li>Protected under applicable privacy laws</li>
            </ul>
            
            <h3>Your Rights</h3>
            <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. You have the right to:</p>
            <ul>
                <li>Access your verification data</li>
                <li>Request corrections to inaccurate information</li>
                <li>Withdraw consent (may affect host eligibility)</li>
                <li>Contact our privacy team with concerns</li>
            </ul>
            
            <p><strong>By consenting to background verification, you acknowledge that this process is necessary for platform safety and you authorize Mayhouse to conduct the verification checks described above.</strong></p>
        </div>
        """


# Create service instance
legal_policies_service = LegalPoliciesService()
