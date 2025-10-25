"""
EIP-712 Policy Signing Schemas for Mayhouse Backend

This module defines the EIP-712 structured data schemas for policy acceptance signing.
EIP-712 provides a standardized way to sign structured data, making policy agreements
more secure and legally compliant.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

from app.schemas.legal_policies import PolicyType


class EIP712Domain(BaseModel):
    """EIP-712 Domain Separator for policy signing."""

    name: str = Field(default="Mayhouse", description="Application name")
    version: str = Field(default="1", description="Domain version")
    chainId: int = Field(
        default=1, description="Ethereum chain ID (1 for mainnet, 5 for Goerli)"
    )
    verifyingContract: Optional[str] = Field(
        default=None, description="Contract address if applicable"
    )


class PolicyAcceptanceData(BaseModel):
    """EIP-712 structured data for policy acceptance."""

    policyId: str = Field(..., description="Unique policy identifier")
    policyType: str = Field(..., description="Type of policy being accepted")
    policyVersion: str = Field(..., description="Version of the policy")
    userAddress: str = Field(..., description="User's wallet address")
    acceptedAt: int = Field(..., description="Unix timestamp of acceptance")
    context: str = Field(
        default="host_application",
        description="Context of acceptance (host_application, etc.)",
    )
    nonce: str = Field(..., description="Unique nonce to prevent replay attacks")


class PolicySignatureRequest(BaseModel):
    """Request to sign a policy acceptance."""

    policy_type: PolicyType = Field(..., description="Type of policy to sign")
    user_address: str = Field(..., description="User's wallet address")
    context: str = Field(default="host_application", description="Context of signing")
    nonce: Optional[str] = Field(
        default=None, description="Optional nonce (generated if not provided)"
    )


class PolicySignatureResponse(BaseModel):
    """Response containing EIP-712 signing data."""

    domain: EIP712Domain = Field(..., description="EIP-712 domain separator")
    types: Dict[str, List[Dict[str, str]]] = Field(
        ..., description="EIP-712 type definitions"
    )
    primaryType: str = Field(
        default="PolicyAcceptance", description="Primary type for signing"
    )
    message: PolicyAcceptanceData = Field(..., description="Structured data to sign")
    nonce: str = Field(..., description="Nonce used for this signing request")


class PolicySignatureVerification(BaseModel):
    """Request to verify a policy signature."""

    policy_type: PolicyType = Field(..., description="Type of policy that was signed")
    user_address: str = Field(..., description="User's wallet address")
    signature: str = Field(..., description="EIP-712 signature")
    nonce: str = Field(..., description="Nonce used in signing")
    context: str = Field(default="host_application", description="Context of signing")
    user_ip: Optional[str] = Field(default=None, description="User's IP address")
    user_agent: Optional[str] = Field(default=None, description="User's browser agent")


class PolicyAcceptanceRecord(BaseModel):
    """Record of a policy acceptance with signature."""

    id: str = Field(..., description="Unique acceptance record ID")
    user_id: str = Field(..., description="User ID who accepted the policy")
    user_address: str = Field(..., description="User's wallet address")
    policy_id: str = Field(..., description="Policy ID that was accepted")
    policy_type: PolicyType = Field(..., description="Type of policy")
    policy_version: str = Field(..., description="Version of policy accepted")
    signature: str = Field(..., description="EIP-712 signature")
    nonce: str = Field(..., description="Nonce used in signing")
    context: str = Field(..., description="Context of acceptance")
    accepted_at: datetime = Field(..., description="Timestamp of acceptance")
    user_ip: Optional[str] = Field(default=None, description="User's IP address")
    user_agent: Optional[str] = Field(default=None, description="User's browser agent")

    class Config:
        from_attributes = True


class PolicyAcceptanceStatus(BaseModel):
    """Status of policy acceptances for a user."""

    user_id: str = Field(..., description="User ID")
    user_address: str = Field(..., description="User's wallet address")
    acceptances: List[PolicyAcceptanceRecord] = Field(
        ..., description="List of policy acceptances"
    )
    missing_policies: List[PolicyType] = Field(
        ..., description="Policies not yet accepted"
    )
    last_updated: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class BulkPolicySignatureRequest(BaseModel):
    """Request to sign multiple policies at once."""

    policy_types: List[PolicyType] = Field(
        ..., description="List of policy types to sign"
    )
    user_address: str = Field(..., description="User's wallet address")
    context: str = Field(default="host_application", description="Context of signing")
    nonce: Optional[str] = Field(
        default=None, description="Optional nonce (generated if not provided)"
    )


class BulkPolicySignatureResponse(BaseModel):
    """Response containing multiple EIP-712 signing data."""

    domain: EIP712Domain = Field(..., description="EIP-712 domain separator")
    types: Dict[str, List[Dict[str, str]]] = Field(
        ..., description="EIP-712 type definitions"
    )
    primaryType: str = Field(
        default="BulkPolicyAcceptance", description="Primary type for bulk signing"
    )
    message: Dict[str, Any] = Field(..., description="Bulk structured data to sign")
    nonce: str = Field(..., description="Nonce used for this signing request")
    policy_count: int = Field(
        ..., description="Number of policies in this bulk signing"
    )


# EIP-712 Type Definitions
EIP712_TYPES = {
    "EIP712Domain": [
        {"name": "name", "type": "string"},
        {"name": "version", "type": "string"},
        {"name": "chainId", "type": "uint256"},
        {"name": "verifyingContract", "type": "address"},
    ],
    "PolicyAcceptance": [
        {"name": "policyId", "type": "string"},
        {"name": "policyType", "type": "string"},
        {"name": "policyVersion", "type": "string"},
        {"name": "userAddress", "type": "address"},
        {"name": "acceptedAt", "type": "uint256"},
        {"name": "context", "type": "string"},
        {"name": "nonce", "type": "string"},
    ],
    "BulkPolicyAcceptance": [
        {"name": "policyIds", "type": "string[]"},
        {"name": "policyTypes", "type": "string[]"},
        {"name": "policyVersions", "type": "string[]"},
        {"name": "userAddress", "type": "address"},
        {"name": "acceptedAt", "type": "uint256"},
        {"name": "context", "type": "string"},
        {"name": "nonce", "type": "string"},
    ],
}
