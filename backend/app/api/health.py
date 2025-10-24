from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "Mayhouse Backend is running",
        "timestamp": "2024-01-01T00:00:00Z",
    }


@router.get("/database")
async def database_health():
    """Database health check."""
    try:
        # TODO: Add database connection check when we set up Supabase
        return {
            "status": "healthy",
            "database": "not_configured_yet",
            "message": "Database connection not yet implemented",
        }
    except Exception as e:
        return {"status": "unhealthy", "database": "error", "error": str(e)}
