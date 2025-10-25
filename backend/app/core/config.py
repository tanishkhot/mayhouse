import os
from functools import lru_cache
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import field_validator

load_dotenv()


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "Mayhouse ETH Backend"
    app_version: str = "1.0.0"
    debug: bool = False

    # CORS settings - stored as string, parsed to list when needed
    cors_origins_str: str = "http://localhost:3000,http://127.0.0.1:3000"
    
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

    # JWT settings
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    # OAuth settings (optional)
    google_client_id: str = ""
    google_client_secret: str = ""
    oauth_redirect_uri: str = "http://localhost:8000/auth/oauth/google/callback"

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
    return Settings()
