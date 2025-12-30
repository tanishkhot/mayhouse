"""
Routes API endpoints for Mayhouse Backend

Proxy endpoints for fetching walking routes from OSRM to avoid CORS issues.
"""

import httpx
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.get(
    "/walking",
    summary="Get Walking Route",
    description="Get walking route between waypoints using OSRM (proxy to avoid CORS)",
)
async def get_walking_route(
    waypoints: str = Query(..., description="Waypoints in format: lon,lat;lon,lat;...")
) -> dict:
    """
    Proxy OSRM route requests to avoid CORS issues.

    Args:
        waypoints: Coordinates in format "lon,lat;lon,lat;..." (e.g., "72.8777,19.0760;72.8780,19.0765")

    Returns:
        OSRM route response with geometry, duration, and distance
    """
    try:
        # Validate waypoints format
        if not waypoints or ";" not in waypoints:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid waypoints format. Expected: lon,lat;lon,lat;...",
            )

        # Fetch route from OSRM
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://router.project-osrm.org/route/v1/foot/{waypoints}",
                params={"overview": "full", "geometries": "geojson"},
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"OSRM service returned error: {response.status_code}",
                )

            data = response.json()

            # Validate OSRM response
            if data.get("code") != "Ok" or not data.get("routes"):
                return {
                    "code": data.get("code", "UnknownError"),
                    "routes": [],
                    "message": "No route found between waypoints",
                }

            return data

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="OSRM service timeout. Please try again.",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect to OSRM service: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error fetching route: {str(e)}",
        )





