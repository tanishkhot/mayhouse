import secrets
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from eth_account.messages import encode_defunct
from web3 import Web3
from app.core.database import get_db, get_service_client
from app.core.jwt_utils import create_access_token

# In-memory nonce storage (use Redis in production)
_nonce_store: Dict[str, Dict[str, Any]] = {}

NONCE_EXPIRY_SECONDS = 300  # 5 minutes


def generate_nonce(wallet_address: str) -> tuple[str, str]:
    """
    Generate a nonce for wallet authentication.
    
    Args:
        wallet_address: Ethereum wallet address
        
    Returns:
        Tuple of (nonce, message_to_sign)
    """
    # Normalize address
    wallet_address = wallet_address.lower()
    
    # Generate random nonce
    nonce = secrets.token_hex(32)
    timestamp = int(time.time())
    
    # Store nonce with expiry
    _nonce_store[wallet_address] = {
        "nonce": nonce,
        "timestamp": timestamp,
        "expires_at": timestamp + NONCE_EXPIRY_SECONDS
    }
    
    # Create message to sign
    message = f"Sign this message to authenticate with Mayhouse.\n\nNonce: {nonce}\nTimestamp: {timestamp}"
    
    return nonce, message


def verify_signature(wallet_address: str, signature: str) -> bool:
    """
    Verify the signature from the wallet.
    
    Args:
        wallet_address: Ethereum wallet address
        signature: Signed message
        
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Normalize address
        wallet_address = wallet_address.lower()
        
        # Get nonce from store
        nonce_data = _nonce_store.get(wallet_address)
        if not nonce_data:
            return False
        
        # Check expiry
        if time.time() > nonce_data["expires_at"]:
            del _nonce_store[wallet_address]
            return False
        
        # Reconstruct message
        message = f"Sign this message to authenticate with Mayhouse.\n\nNonce: {nonce_data['nonce']}\nTimestamp: {nonce_data['timestamp']}"
        
        # Verify signature
        w3 = Web3()
        message_hash = encode_defunct(text=message)
        recovered_address = w3.eth.account.recover_message(message_hash, signature=signature)
        
        # Clean up nonce after verification attempt
        if wallet_address in _nonce_store:
            del _nonce_store[wallet_address]
        
        # Compare addresses (case-insensitive)
        return recovered_address.lower() == wallet_address.lower()
    
    except Exception as e:
        print(f"Error verifying signature: {e}")
        return False


async def get_or_create_user(wallet_address: str) -> Dict[str, Any]:
    """
    Get existing user or create new one for wallet address.
    
    Args:
        wallet_address: Ethereum wallet address
        
    Returns:
        User data dictionary
    """
    try:
        # Normalize address
        wallet_address = wallet_address.lower()
        
        # Use service client to bypass RLS
        supabase = get_service_client()
        
        # Check if user exists
        result = supabase.table("users").select("*").eq("wallet_address", wallet_address).execute()
        
        if result.data and len(result.data) > 0:
            # User exists, return it
            return result.data[0]
        
        # Create new user
        new_user = {
            "wallet_address": wallet_address,
            "role": "user",
            "full_name": f"User {wallet_address[:6]}...{wallet_address[-4:]}",
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = supabase.table("users").insert(new_user).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        
        raise Exception("Failed to create user")
    
    except Exception as e:
        print(f"Error getting/creating user: {e}")
        raise


def create_auth_token(user: Dict[str, Any]) -> tuple[str, int]:
    """
    Create JWT token for authenticated user.
    
    Args:
        user: User data dictionary
        
    Returns:
        Tuple of (access_token, expires_in_seconds)
    """
    expires_delta = timedelta(days=7)  # Token valid for 7 days
    
    token_data = {
        "sub": user["id"],
        "wallet_address": user.get("wallet_address"),
        "role": user.get("role", "user"),
    }
    
    access_token = create_access_token(token_data, expires_delta)
    expires_in = int(expires_delta.total_seconds())
    
    return access_token, expires_in

