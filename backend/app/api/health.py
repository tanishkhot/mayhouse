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
        from app.core.database import get_db

        db = get_db()
        # Simple query to test connection
        result = db.table("users").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "message": "Database connection successful",
        }
    except Exception as e:
        return {"status": "unhealthy", "database": "error", "error": str(e)}
