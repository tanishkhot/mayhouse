from pydantic import BaseModel, Field
from typing import Optional


class WalletNonceRequest(BaseModel):
    """Request schema for wallet nonce."""
    wallet_address: str = Field(..., description="Ethereum wallet address")


class WalletNonceResponse(BaseModel):
    """Response schema for wallet nonce."""
    nonce: str = Field(..., description="Unique nonce for signing")
    message: str = Field(..., description="Message to sign")


class WalletVerifyRequest(BaseModel):
    """Request schema for wallet signature verification."""
    wallet_address: str = Field(..., description="Ethereum wallet address")
    signature: str = Field(..., description="Signed message")


class WalletAuthResponse(BaseModel):
    """Response schema for wallet authentication."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

