from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import init_database
from app.api.health import router as health_router
from app.api.explore import router as explore_router

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="FastAPI backend for Mayhouse travel experiences platform",
    debug=settings.debug,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    init_database()


# Include routers
app.include_router(health_router)
app.include_router(explore_router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health/",
        "explore": "/explore/",
    }


# Test endpoint
@app.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify server is running."""
    return {
        "status": "success",
        "message": "FastAPI server is running!",
        "endpoint": "/test",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
