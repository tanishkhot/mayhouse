import os
from functools import lru_cache
from typing import List
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import field_validator

# Try to load .env file from multiple possible locations
# This handles both local development and Docker/systemd deployments
env_paths = [
    Path(__file__).parent.parent.parent / ".env",  # backend/.env
    Path(__file__).parent.parent.parent.parent / "backend" / ".env",  # project/backend/.env
    Path("/app/.env"),  # Docker container path
    Path.cwd() / ".env",  # Current working directory
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)
        print(f"✅ Loaded .env from: {env_path}")
        break
else:
    # Fallback: try loading from current directory (for systemd)
    load_dotenv()
    print("⚠️  Using default .env loading (may not find .env file)")


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "Mayhouse ETH Backend"
    app_version: str = "1.0.0"
    debug: bool = False
    test_user_id: str = ""  # Optional: Test user ID for bypassing auth in debug mode

    # CORS settings - stored as string, parsed to list when needed
    cors_origins_str: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
    
    @field_validator('debug', mode='before')
    @classmethod
    def parse_debug(cls, v):
        """Parse debug from string to boolean."""
        if isinstance(v, str):
            return v.lower() in ('true', '1', 'yes')
        return v

    # Supabase settings
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # JWT settings (for wallet authentication)
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    # OAuth settings (optional)
    google_client_id: str = ""
    google_client_secret: str = ""
    # oauth_redirect_uri should be set via environment variable
    # No default - must be configured for production (e.g., https://api.mayhouse.in/auth/oauth/google/callback)
    oauth_redirect_uri: str = ""

    # AI/LLM settings
    groq_api_key: str = ""

    # Blockchain settings
    # NOTE: Commented out - Not needed for regular payment flow
    # Can be re-enabled if Web3 integration is restored
    # blockchain_rpc_url: str = "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
    # contract_address: str = "0x09aB660CEac220678b42E0e23DebCb1475e1eAD5"
    # platform_private_key: str = ""  # Private key for platform account (for gas)
    # eth_price_inr: str = "200000"  # Current ETH price in INR for conversions
    
    # Placeholder values to prevent errors (will be None/empty)
    blockchain_rpc_url: str = ""
    contract_address: str = ""
    platform_private_key: str = ""
    eth_price_inr: str = "200000"

    model_config = {
        "env_file": ".env",
        "env_prefix": "",
        "case_sensitive": False,
        "extra": "allow",  # Allow extra fields from .env
    }
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as a list."""
        # Check if CORS_ORIGINS env var exists, otherwise use default
        cors_str = os.getenv("CORS_ORIGINS", self.cors_origins_str)
        return [origin.strip() for origin in cors_str.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    settings = Settings()
    # Log CORS configuration for debugging
    print(f"🔧 CORS configuration loaded: {settings.cors_origins}")
    return settings
