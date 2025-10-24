from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router

# Create FastAPI app
app = FastAPI(
    title="Mayhouse Backend",
    version="0.1.0",
    description="FastAPI backend for Mayhouse travel experiences platform",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mayhouse-frontend.vercel.app",  # Production Vercel domain
        "http://localhost:3000",  # Local development
        "http://127.0.0.1:3000",  # Local development alternative
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# Include routers
app.include_router(health_router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Mayhouse Backend",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health/",
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
