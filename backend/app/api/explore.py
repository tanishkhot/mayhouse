"""
Explore API endpoints for Mayhouse Backend

Public endpoints for browsing experiences without authentication.
These endpoints are accessible to all users and provide general
information about available experiences in Mumbai.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, Request, HTTPException, status
from app.middleware.auth_middleware import get_user_from_request, is_authenticated
from app.schemas.user import UserResponse
from app.schemas.event_run import ExploreEventRun
from app.services.event_run_service import event_run_service
from app.core.database import get_supabase_client

# Create router with explore prefix
router = APIRouter(prefix="/explore", tags=["Explore"])


@router.get(
    "/",
    response_model=List[ExploreEventRun],
    summary="Explore Upcoming Experiences",
    description="Get all upcoming event runs starting from now. Perfect for discovering what's available to book today and beyond.",
)
async def explore_upcoming_experiences(
    request: Request,
    domain: Optional[str] = Query(
        None, description="Filter by experience domain (food, art, culture, etc.)"
    ),
    neighborhood: Optional[str] = Query(None, description="Filter by neighborhood"),
    limit: int = Query(
        50, ge=1, le=100, description="Maximum number of event runs to return"
    ),
    offset: int = Query(
        0, ge=0, description="Number of results to skip for pagination"
    ),
) -> List[ExploreEventRun]:
    """
    Explore upcoming event runs starting from the current date and time.

    This endpoint returns all available event runs that:
    - Start from the current time onwards
    - Are from approved experiences only
    - Are not cancelled
    - Are sorted by start time (soonest first)

    Perfect for travelers to discover what experiences are available to book
    right now and in the coming days/weeks.

    Args:
        domain: Optional filter by experience domain (e.g., 'food', 'art', 'culture')
        neighborhood: Optional filter by neighborhood (e.g., 'Bandra', 'Colaba')
        limit: Maximum number of event runs to return (1-100)
        offset: Number of results to skip (for pagination)

    Returns:
        List of upcoming event runs with full experience and host details
    """
    try:
        # Use the singleton event_run_service instance
        upcoming_runs = await event_run_service.explore_upcoming_event_runs(
            limit=limit, offset=offset, domain=domain, neighborhood=neighborhood
        )

        return upcoming_runs

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch upcoming experiences: {str(e)}",
        )


@router.get(
    "/categories",
    summary="Get Experience Categories",
    description="Get available experience categories (public access)",
)
async def get_categories() -> Dict[str, Any]:
    """
    Get list of available experience categories.

    This endpoint is publicly accessible.
    """
    categories = [
        {
            "id": "food",
            "name": "Food & Culinary",
            "description": "Authentic local cuisine and street food tours",
            "icon": "🍽️",
            "count": 25,
        },
        {
            "id": "culture",
            "name": "Culture & Heritage",
            "description": "Historical sites and cultural experiences",
            "icon": "🏛️",
            "count": 18,
        },
        {
            "id": "entertainment",
            "name": "Entertainment",
            "description": "Bollywood, music, and local entertainment",
            "icon": "🎭",
            "count": 12,
        },
        {
            "id": "adventure",
            "name": "Adventure & Nature",
            "description": "Outdoor activities and nature exploration",
            "icon": "🌊",
            "count": 8,
        },
        {
            "id": "shopping",
            "name": "Shopping & Markets",
            "description": "Local markets and unique shopping experiences",
            "icon": "🛍️",
            "count": 15,
        },
    ]

    return {"categories": categories, "total": len(categories)}


@router.get(
    "/featured",
    summary="Get Featured Experiences",
    description="Get curated featured experiences (public access)",
)
async def get_featured_experiences(
    request: Request,
    limit: int = Query(5, ge=1, le=10, description="Number of featured experiences"),
) -> Dict[str, Any]:
    """
    Get curated featured experiences.

    This endpoint is publicly accessible but may show personalized
    featured content for authenticated users.
    """
    user = get_user_from_request(request)
    authenticated = is_authenticated(request)

    # Mock featured experiences
    featured = [
        {
            "id": "exp_featured_001",
            "title": "Mumbai Local Train Experience",
            "description": "Travel like a true Mumbaikar on the lifeline of the city",
            "category": "culture",
            "price": 800,
            "duration": "2 hours",
            "rating": 4.9,
            "featured_reason": "Most Popular This Month",
            "discount": 20,  # 20% off
            "host": {"name": "Arjun Patel", "verified": True},
        }
    ]

    return {
        "featured_experiences": featured[:limit],
        "personalized": authenticated,
        "user_preferences": user.id if user else None,
    }


@router.get(
    "/{experience_id}",
    summary="Get Experience Details",
    description="Get detailed information about a specific experience (public access)",
)
async def get_experience_details(
    experience_id: str, request: Request
) -> Dict[str, Any]:
    """
    Get detailed information about a specific experience.

    This endpoint is publicly accessible, allowing users to view
    experience details before signing up or logging in.
    """
    user = get_user_from_request(request)
    authenticated = is_authenticated(request)

    # Mock experience detail - in real implementation, query database
    if experience_id == "exp_001":
        experience = {
            "id": "exp_001",
            "title": "Street Food Safari in Colaba",
            "description": "Embark on a culinary adventure through the bustling streets of Colaba...",
            "long_description": """
            Join us for an unforgettable street food journey through Colaba, one of Mumbai's 
            most vibrant neighborhoods. This 3-hour experience will take you to hidden gems 
            and local favorites that only true Mumbaikars know about.
            
            What you'll experience:
            • Authentic vada pav from the best local vendor
            • Fresh bhel puri made to order
            • Traditional pav bhaji at a century-old establishment
            • Sweet treats from heritage shops
            • Stories about Mumbai's food culture and history
            """,
            "category": "food",
            "price": 1500,
            "duration": "3 hours",
            "rating": 4.8,
            "review_count": 127,
            "max_participants": 4,
            "host": {
                "name": "Priya Sharma",
                "bio": "Born and raised in Mumbai, Priya knows every street corner and food stall...",
                "rating": 4.9,
                "experience_count": 45,
                "verified": True,
                "languages": ["Hindi", "English", "Marathi"],
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  # Mock wallet address for testing
            },
            "location": {
                "area": "Colaba",
                "city": "Mumbai",
                "meeting_point": "Colaba Causeway Metro Station",
                "coordinates": {"lat": 18.9067, "lng": 72.8147},
            },
            "includes": [
                "All food tastings",
                "Local guide",
                "Cultural insights",
                "Photo opportunities",
            ],
            "what_to_bring": [
                "Comfortable walking shoes",
                "Appetite for adventure",
                "Camera (optional)",
            ],
            "upcoming_sessions": [
                {"date": "2024-01-15T10:00:00Z", "available_spots": 2},
                {"date": "2024-01-17T15:00:00Z", "available_spots": 4},
            ],
            "reviews": [
                {
                    "user": "Sarah J.",
                    "rating": 5,
                    "comment": "Amazing experience! Priya was so knowledgeable...",
                    "date": "2024-01-10",
                }
            ],
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experience with ID '{experience_id}' not found",
        )

    # Add authentication context
    experience["viewer_context"] = {
        "authenticated": authenticated,
        "can_book": authenticated,  # Only authenticated users can book
        "user_id": user.id if user else None,
    }

    return experience
