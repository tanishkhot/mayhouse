from supabase import create_client, Client
from app.core.config import get_settings

settings = get_settings()


def get_supabase_client() -> Client:
    """Get Supabase client instance."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise ValueError("Supabase URL and API key must be provided")

    return create_client(
        supabase_url=settings.supabase_url, supabase_key=settings.supabase_anon_key
    )


# Global client instance
supabase: Client = None


def init_database():
    """Initialize database connection."""
    global supabase
    try:
        supabase = get_supabase_client()
        print("✅ Connected to Supabase successfully")
    except ValueError as e:
        print(f"⚠️  Database connection warning: {e}")
        print("Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")


def get_db() -> Client:
    """Get database client dependency."""
    global supabase
    if supabase is None:
        init_database()
    return supabase


def get_service_client() -> Client:
    """Get service client for background operations using service key to bypass RLS."""
    if not settings.supabase_url or not settings.supabase_service_key:
        raise ValueError("Supabase URL and service key must be provided")

    return create_client(
        supabase_url=settings.supabase_url, supabase_key=settings.supabase_service_key
    )
