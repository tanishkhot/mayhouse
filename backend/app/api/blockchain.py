"""
Blockchain API endpoints for Web3-enabled booking and payments.

This module provides:
- Booking cost calculation (including stake)
- Event completion with stake distribution
- Blockchain status checking
"""

from typing import List, Optional
from decimal import Decimal
from datetime import datetime
import requests
from functools import lru_cache
import time

from fastapi import APIRouter, HTTPException, status, Query, Path, Body
from pydantic import BaseModel, Field

from app.services.blockchain_service import blockchain_service
from app.core.database import get_service_client


router = APIRouter(prefix="/blockchain", tags=["Blockchain Operations"])


# Cache for ETH price (cache for 60 seconds)
_eth_price_cache = {"price": None, "timestamp": 0, "cache_duration": 60}  # seconds


def get_live_eth_price_inr() -> float:
    """
    Fetch live ETH price in INR from CoinGecko API.
    Uses caching to avoid hitting rate limits.

    Returns:
        float: Current ETH price in INR
    """
    current_time = time.time()

    # Check if cache is still valid
    if (
        _eth_price_cache["price"] is not None
        and current_time - _eth_price_cache["timestamp"]
        < _eth_price_cache["cache_duration"]
    ):
        return _eth_price_cache["price"]

    try:
        # Fetch from CoinGecko API (free tier, no API key needed)
        response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={"ids": "ethereum", "vs_currencies": "inr"},
            timeout=5,  # 5 second timeout
        )
        response.raise_for_status()

        data = response.json()
        eth_price_inr = float(data["ethereum"]["inr"])

        # Update cache
        _eth_price_cache["price"] = eth_price_inr
        _eth_price_cache["timestamp"] = current_time

        print(f"[ETH PRICE] Fetched live price from CoinGecko: ₹{eth_price_inr:,.2f}")
        return eth_price_inr

    except requests.exceptions.RequestException as e:
        print(f"[ETH PRICE] CoinGecko API error: {e}")
        # Fallback to cached value if available
        if _eth_price_cache["price"] is not None:
            print(f"[ETH PRICE] Using cached price: ₹{_eth_price_cache['price']:,.2f}")
            return _eth_price_cache["price"]
        # Last resort fallback
        print("[ETH PRICE] Using fallback hardcoded price: ₹200,000")
        return 200000.0
    except (KeyError, ValueError) as e:
        print(f"[ETH PRICE] Error parsing CoinGecko response: {e}")
        # Fallback to cached or hardcoded
        if _eth_price_cache["price"] is not None:
            return _eth_price_cache["price"]
        return 200000.0


# Request/Response schemas
class BookingCostRequest(BaseModel):
    """Request to calculate booking cost."""

    event_run_id: str = Field(..., description="Database event run ID")
    seat_count: int = Field(..., ge=1, le=4, description="Number of seats to book")


class BookingCostResponse(BaseModel):
    """Response with booking cost breakdown."""

    event_run_id: str
    blockchain_event_run_id: int
    seat_count: int
    price_per_seat_inr: Decimal
    total_price_inr: Decimal
    stake_inr: Decimal  # 20% of total price
    total_cost_inr: Decimal  # price + stake
    price_per_seat_wei: int
    stake_wei: int
    total_cost_wei: int

    class Config:
        json_encoders = {Decimal: lambda v: float(v)}


class CompleteEventRequest(BaseModel):
    """Request to complete an event on blockchain."""

    event_run_id: str = Field(..., description="Database event run ID")
    attended_booking_ids: List[str] = Field(
        ..., description="List of database booking IDs that attended"
    )


class CompleteEventResponse(BaseModel):
    """Response after completing event."""

    event_run_id: str
    blockchain_event_run_id: int
    transaction_hash: str
    attended_count: int
    no_show_count: int
    message: str


class BlockchainStatusResponse(BaseModel):
    """Blockchain sync status for an event."""

    event_run_id: str
    blockchain_event_run_id: Optional[int]
    blockchain_tx_hash: Optional[str]
    blockchain_status: str  # pending, confirmed, failed
    on_chain_data: Optional[dict] = None


# =============================================
# BOOKING COST CALCULATION
# =============================================


@router.post(
    "/calculate-booking-cost",
    response_model=BookingCostResponse,
    summary="Calculate Booking Cost",
    description="Calculate total cost including 20% stake for booking an event",
)
async def calculate_booking_cost(request: BookingCostRequest) -> BookingCostResponse:
    """
    Calculate the total cost for booking an event.

    Returns:
    - Ticket price
    - 20% stake (refundable if attended)
    - Total cost to pay

    All amounts in both INR and Wei.
    """
    # Get event run from database
    service_client = get_service_client()
    response = (
        service_client.table("event_runs")
        .select("*, experiences(price_inr)")
        .eq("id", request.event_run_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event run not found"
        )

    event_run = response.data[0]
    blockchain_event_run_id = event_run.get("blockchain_event_run_id")

    if not blockchain_event_run_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event not yet synced to blockchain",
        )

    # Get price (special pricing or base price)
    price_per_seat_inr = Decimal(
        str(
            event_run.get("special_pricing_inr")
            or event_run["experiences"]["price_inr"]
        )
    )

    # Calculate costs in INR
    total_price_inr = price_per_seat_inr * request.seat_count
    stake_inr = total_price_inr * Decimal("0.20")  # 20% stake
    total_cost_inr = total_price_inr + stake_inr

    # Calculate costs in Wei
    price_per_seat_wei = blockchain_service.convert_inr_to_wei(price_per_seat_inr)

    # Get exact cost from blockchain
    try:
        payment_wei, stake_wei, total_wei = (
            await blockchain_service.calculate_booking_cost(
                blockchain_event_run_id, request.seat_count
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate cost from blockchain: {str(e)}",
        )

    return BookingCostResponse(
        event_run_id=request.event_run_id,
        blockchain_event_run_id=blockchain_event_run_id,
        seat_count=request.seat_count,
        price_per_seat_inr=price_per_seat_inr,
        total_price_inr=total_price_inr,
        stake_inr=stake_inr,
        total_cost_inr=total_cost_inr,
        price_per_seat_wei=price_per_seat_wei,
        stake_wei=stake_wei,
        total_cost_wei=total_wei,
    )


# =============================================
# EVENT COMPLETION
# =============================================


@router.post(
    "/complete-event",
    response_model=CompleteEventResponse,
    summary="Complete Event on Blockchain",
    description="Mark event as complete and distribute stakes based on attendance",
)
async def complete_event_blockchain(
    request: CompleteEventRequest,
) -> CompleteEventResponse:
    """
    Complete an event on the blockchain.

    Process:
    1. Fetches all bookings for the event
    2. Maps database booking IDs to blockchain booking IDs
    3. Calls smart contract to distribute funds:
       - Attendees get stakes back
       - No-shows forfeit stakes
       - Host gets payment + stake back
    4. Updates database booking statuses

    Requirements:
    - Event must exist on blockchain
    - Event timestamp must have passed
    - Only host or admin can complete
    """
    service_client = get_service_client()

    # Get event run
    event_response = (
        service_client.table("event_runs")
        .select(
            "*, experiences(host_id, users!experiences_host_id_fkey(wallet_address))"
        )
        .eq("id", request.event_run_id)
        .execute()
    )

    if not event_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event run not found"
        )

    event_run = event_response.data[0]
    blockchain_event_run_id = event_run.get("blockchain_event_run_id")

    if not blockchain_event_run_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Event not on blockchain"
        )

    # Get host wallet address
    host_wallet_address = event_run["experiences"]["users"]["wallet_address"]

    if not host_wallet_address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Host wallet address not found",
        )

    # Get all bookings for this event
    bookings_response = (
        service_client.table("event_run_bookings")
        .select("id, blockchain_booking_id")
        .eq("event_run_id", request.event_run_id)
        .execute()
    )

    all_bookings = bookings_response.data

    # Map database IDs to blockchain IDs for attended bookings
    attended_blockchain_ids = []
    for booking in all_bookings:
        if booking["id"] in request.attended_booking_ids:
            if booking.get("blockchain_booking_id"):
                attended_blockchain_ids.append(booking["blockchain_booking_id"])

    # Complete event on blockchain
    try:
        tx_hash = await blockchain_service.complete_event_onchain(
            blockchain_event_run_id=blockchain_event_run_id,
            attended_blockchain_booking_ids=attended_blockchain_ids,
            host_wallet_address=host_wallet_address,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete event on blockchain: {str(e)}",
        )

    # Update event run status
    service_client.table("event_runs").update(
        {"status": "completed", "updated_at": datetime.utcnow().isoformat()}
    ).eq("id", request.event_run_id).execute()

    # Update booking statuses
    # Attended bookings -> completed
    if request.attended_booking_ids:
        service_client.table("event_run_bookings").update(
            {"booking_status": "experience_completed"}
        ).in_("id", request.attended_booking_ids).execute()

    # No-show bookings -> no_show
    no_show_ids = [
        b["id"] for b in all_bookings if b["id"] not in request.attended_booking_ids
    ]
    if no_show_ids:
        service_client.table("event_run_bookings").update(
            {"booking_status": "no_show"}
        ).in_("id", no_show_ids).execute()

    return CompleteEventResponse(
        event_run_id=request.event_run_id,
        blockchain_event_run_id=blockchain_event_run_id,
        transaction_hash=tx_hash,
        attended_count=len(attended_blockchain_ids),
        no_show_count=len(no_show_ids),
        message=f"Event completed successfully. {len(attended_blockchain_ids)} attended, {len(no_show_ids)} no-shows.",
    )


# =============================================
# BLOCKCHAIN STATUS
# =============================================


@router.get(
    "/status/{event_run_id}",
    response_model=BlockchainStatusResponse,
    summary="Get Blockchain Sync Status",
    description="Check if event is synced to blockchain and get on-chain data",
)
async def get_blockchain_status(
    event_run_id: str = Path(..., description="Database event run ID")
) -> BlockchainStatusResponse:
    """
    Get blockchain synchronization status for an event.

    Returns:
    - Sync status (pending/confirmed/failed)
    - Blockchain event run ID
    - Transaction hash
    - On-chain data (if available)
    """
    service_client = get_service_client()
    response = (
        service_client.table("event_runs")
        .select("blockchain_event_run_id, blockchain_tx_hash, blockchain_status")
        .eq("id", event_run_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event run not found"
        )

    event_data = response.data[0]
    blockchain_event_run_id = event_data.get("blockchain_event_run_id")

    # If event is on blockchain, fetch on-chain data
    on_chain_data = None
    if blockchain_event_run_id:
        try:
            on_chain_data = await blockchain_service.get_event_run_from_chain(
                blockchain_event_run_id
            )
            # Convert Wei to INR for display
            on_chain_data["pricePerSeatINR"] = float(
                blockchain_service.convert_wei_to_inr(on_chain_data["pricePerSeat"])
            )
        except:
            pass

    return BlockchainStatusResponse(
        event_run_id=event_run_id,
        blockchain_event_run_id=blockchain_event_run_id,
        blockchain_tx_hash=event_data.get("blockchain_tx_hash"),
        blockchain_status=event_data.get("blockchain_status", "pending"),
        on_chain_data=on_chain_data,
    )


# =============================================
# UTILITY ENDPOINTS
# =============================================


@router.get(
    "/conversion/inr-to-wei",
    summary="Convert INR to Wei",
    description="Convert Indian Rupees to Wei for blockchain transactions",
)
async def convert_inr_to_wei(
    amount_inr: Decimal = Query(..., description="Amount in INR")
) -> dict:
    """Convert INR amount to Wei using live ETH price."""
    eth_price_inr = Decimal(str(get_live_eth_price_inr()))
    wei_amount = blockchain_service.convert_inr_to_wei(amount_inr, eth_price_inr)
    eth_amount = blockchain_service.w3.from_wei(wei_amount, "ether")

    return {
        "amount_inr": float(amount_inr),
        "amount_wei": wei_amount,
        "amount_eth": float(eth_amount),
        "eth_price_inr": float(eth_price_inr),
    }


@router.get(
    "/conversion/wei-to-inr",
    summary="Convert Wei to INR",
    description="Convert Wei to Indian Rupees",
)
async def convert_wei_to_inr(
    amount_wei: int = Query(..., description="Amount in Wei")
) -> dict:
    """Convert Wei amount to INR using live ETH price."""
    eth_price_inr = Decimal(str(get_live_eth_price_inr()))
    inr_amount = blockchain_service.convert_wei_to_inr(amount_wei, eth_price_inr)
    eth_amount = blockchain_service.w3.from_wei(amount_wei, "ether")

    return {
        "amount_wei": amount_wei,
        "amount_eth": float(eth_amount),
        "amount_inr": float(inr_amount),
        "eth_price_inr": float(eth_price_inr),
    }


@router.get(
    "/eth-price",
    summary="Get Current ETH Price in INR",
    description="Get the current ETH price in INR from CoinGecko API",
)
async def get_eth_price() -> dict:
    """
    Get current ETH price in INR from CoinGecko API.

    Features:
    - Fetches live price from CoinGecko
    - Caches for 60 seconds to avoid rate limits
    - Falls back to cached/hardcoded if API fails

    Returns:
        Current ETH price in INR with metadata
    """
    eth_price_inr = get_live_eth_price_inr()

    # Determine source
    source = "coingecko"
    if (
        _eth_price_cache["price"] == eth_price_inr
        and _eth_price_cache["price"] != 200000
    ):
        if (
            time.time() - _eth_price_cache["timestamp"]
            < _eth_price_cache["cache_duration"]
        ):
            source = "coingecko_cached"
    elif eth_price_inr == 200000:
        source = "fallback_hardcoded"

    return {
        "eth_price_inr": eth_price_inr,
        "currency": "INR",
        "last_updated": (
            datetime.fromtimestamp(_eth_price_cache["timestamp"]).isoformat()
            if _eth_price_cache["timestamp"] > 0
            else datetime.utcnow().isoformat()
        ),
        "source": source,
        "cache_ttl_seconds": _eth_price_cache["cache_duration"],
    }
