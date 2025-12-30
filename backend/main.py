from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import init_database
from app.api.health import router as health_router
from app.api.explore import router as explore_router
from app.api.wallet_auth import router as wallet_auth_router, auth_router
from app.api.host_application import user_router as host_application_user_router
from app.api.host_application import admin_router as host_application_admin_router
from app.api.experiences import host_router as experience_host_router
from app.api.experiences import admin_router as experience_admin_router
from app.api.event_runs import host_router as event_run_host_router
from app.api.event_runs import public_router as event_run_public_router
from app.api.event_runs import admin_router as event_run_admin_router
from app.api.legal_policies import router as legal_policies_router
from app.api.eip712_policy import router as eip712_policy_router
from app.api.blockchain import router as blockchain_router
from app.api.bookings import router as bookings_router
from app.api.experience_photos import router as experience_photos_router
from app.api.users import (
    public_router as users_public_router,
    user_router as users_user_router,
)
from app.api.design_experience import router as design_experience_router
from app.api.oauth import router as oauth_router
from app.api.routes import router as routes_router

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="FastAPI backend for Mayhouse ETH - Web3 enabled travel experiences platform",
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
    print(f"🌐 CORS origins configured: {settings.cors_origins}")
    init_database()


# Include routers
app.include_router(health_router)
app.include_router(explore_router)
app.include_router(wallet_auth_router)  # Wallet authentication endpoints
app.include_router(auth_router)  # General auth endpoints (/auth/me)
app.include_router(oauth_router)  # OAuth endpoints (/auth/oauth)
app.include_router(host_application_user_router)  # Host application user endpoints
app.include_router(host_application_admin_router)  # Host application admin endpoints
app.include_router(experience_host_router)  # Experience management host endpoints
app.include_router(experience_admin_router)  # Experience management admin endpoints
app.include_router(event_run_host_router)  # Event run management host endpoints
app.include_router(event_run_public_router)  # Event run public endpoints
app.include_router(event_run_admin_router)  # Event run admin endpoints
app.include_router(legal_policies_router)  # Legal policies endpoints
app.include_router(eip712_policy_router)  # EIP-712 policy signing endpoints
app.include_router(
    blockchain_router
)  # Blockchain operations endpoints (cost calculation)
app.include_router(bookings_router)  # Bookings endpoints
app.include_router(experience_photos_router)  # Experience photos endpoints
app.include_router(users_public_router)  # Public user profile endpoints
app.include_router(users_user_router)  # Authenticated user profile endpoints
app.include_router(design_experience_router)  # Design Experience wizard endpoints
app.include_router(routes_router)  # Routes proxy endpoints (OSRM)


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
        "wallet_auth": "/auth/wallet",
        "oauth": "/auth/oauth",
        "host_applications": "/users/host-application",
        "admin_host_applications": "/admin/host-applications",
        "experiences": "/experiences",
        "admin_experiences": "/admin/experiences",
        "host_event_runs": "/hosts/event-runs",
        "public_event_runs": "/event-runs",
        "admin_event_runs": "/admin/event-runs",
        "legal_policies": "/legal",
        "eip712_policy_signing": "/legal/eip712",
        "blockchain": "/blockchain",
        "bookings": "/bookings",
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
