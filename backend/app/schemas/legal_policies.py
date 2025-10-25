"""
Legal Policies Schemas for Mayhouse Backend

Schemas for serving terms & conditions, privacy policy, and other legal documents.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class PolicyType(str, Enum):
    """Types of legal policies available."""

    TERMS_CONDITIONS = "terms_conditions"
    BACKGROUND_VERIFICATION = "background_verification"
    PRIVACY_POLICY = "privacy_policy"
    HOST_AGREEMENT = "host_agreement"
    CANCELLATION_POLICY = "cancellation_policy"


class PolicyStatus(str, Enum):
    """Policy document status."""

    ACTIVE = "active"
    DRAFT = "draft"
    ARCHIVED = "archived"


class LegalPolicyResponse(BaseModel):
    """Schema for legal policy document responses."""

    id: str
    policy_type: PolicyType
    title: str
    version: str
    content: str  # HTML or markdown content
    summary: Optional[str] = Field(None, description="Brief summary of the policy")
    effective_date: datetime
    last_updated: datetime
    status: PolicyStatus

    class Config:
        from_attributes = True


class PolicyAcceptanceCreate(BaseModel):
    """Schema for recording policy acceptance."""

    policy_id: str
    policy_version: str
    accepted: bool = True
    user_ip: Optional[str] = None
    user_agent: Optional[str] = None


class PolicyAcceptanceResponse(BaseModel):
    """Schema for policy acceptance responses."""

    id: str
    user_id: str
    policy_id: str
    policy_type: PolicyType
    policy_version: str
    accepted_at: datetime
    user_ip: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True


class UserPolicyStatus(BaseModel):
    """Schema for checking user's policy acceptance status."""

    user_id: str
    policy_acceptances: Dict[
        PolicyType, Dict[str, Any]
    ]  # policy_type -> acceptance details
    all_required_accepted: bool
    missing_policies: list[PolicyType] = []


class LegalDocumentsBundle(BaseModel):
    """Bundle of all legal documents for host application."""

    terms_conditions: LegalPolicyResponse
    background_verification: LegalPolicyResponse
    host_agreement: Optional[LegalPolicyResponse] = None
    last_updated: datetime
