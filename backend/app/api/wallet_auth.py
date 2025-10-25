from fastapi import APIRouter, HTTPException, status, Depends, Header
from app.schemas.wallet import (
    WalletNonceRequest,
    WalletNonceResponse,
    WalletVerifyRequest,
    WalletAuthResponse,
)
from app.services.wallet_service import (
    generate_nonce,
    verify_signature,
    get_or_create_user,
    create_auth_token,
)
from app.core.jwt_utils import verify_token
from app.core.database import get_service_client

router = APIRouter(prefix="/auth/wallet", tags=["Wallet Authentication"])
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/nonce", response_model=WalletNonceResponse)
async def request_nonce(request: WalletNonceRequest):
    """
    Request a nonce for wallet authentication.
    
    The frontend should:
    1. Call this endpoint with the wallet address
    2. Sign the returned message with the user's wallet
    3. Call /verify with the signature
    """
    try:
        nonce, message = generate_nonce(request.wallet_address)
        return WalletNonceResponse(nonce=nonce, message=message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate nonce: {str(e)}"
        )


@router.post("/verify", response_model=WalletAuthResponse)
async def verify_wallet_signature(request: WalletVerifyRequest):
    """
    Verify wallet signature and authenticate user.
    
    If signature is valid:
    - Returns JWT token
    - Creates user account if it doesn't exist
    - User can access protected endpoints with the token
    """
    try:
        # Verify signature
        is_valid = verify_signature(request.wallet_address, request.signature)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature or expired nonce"
            )
        
        # Get or create user
        user = await get_or_create_user(request.wallet_address)
        
        # Create auth token
        access_token, expires_in = create_auth_token(user)
        
        return WalletAuthResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
            user={
                "id": user["id"],
                "wallet_address": user["wallet_address"],
                "full_name": user.get("full_name"),
                "email": user.get("email"),
                "role": user.get("role", "user"),
                "created_at": user.get("created_at"),
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@auth_router.get("/me")
async def get_current_user(authorization: str = Header(None)):
    """
    Get current authenticated user info.
    
    Requires: Authorization: Bearer <token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify JWT token
        payload = verify_token(token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get user from database
        service_client = get_service_client()
        response = service_client.table("users").select("*").eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user = response.data[0]
        
        return {
            "id": user["id"],
            "wallet_address": user.get("wallet_address"),
            "full_name": user.get("full_name"),
            "email": user.get("email"),
            "role": user.get("role", "user"),
            "created_at": user.get("created_at"),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

