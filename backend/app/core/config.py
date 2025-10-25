import os
from functools import lru_cache
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = os.getenv("APP_NAME", "Mayhouse Backend")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Supabase settings
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # OAuth settings
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    oauth_redirect_uri: str = os.getenv(
        "OAUTH_REDIRECT_URI", "http://localhost:8000/auth/oauth/google/callback"
    )

    model_config = {"env_file": ".env"}


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
