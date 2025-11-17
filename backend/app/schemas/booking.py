"""
Booking schemas for API request/response validation.
"""

from datetime import datetime
from typing import Optional
from decimal import Decimal

from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    """Schema for creating a new booking."""

    event_run_id: str = Field(..., description="ID of the event run to book")
    seat_count: int = Field(..., ge=1, le=4, description="Number of seats to book (1-4)")


class PaymentResponse(BaseModel):
    """Schema for payment processing response."""

    payment_id: str = Field(..., description="Payment transaction ID")
    status: str = Field(..., description="Payment status (completed, failed, pending)")
    amount_inr: Decimal = Field(..., description="Amount paid in INR")
    transaction_id: str = Field(..., description="Transaction reference ID")
    timestamp: str = Field(..., description="Payment timestamp (ISO format)")
    payment_method: str = Field(default="dummy", description="Payment method used")

    class Config:
        json_encoders = {Decimal: lambda v: float(v)}


class BookingResponse(BaseModel):
    """Schema for booking response."""

    id: str = Field(..., description="Booking ID")
    event_run_id: str = Field(..., description="Event run ID")
    user_id: str = Field(..., description="User ID who made the booking")
    seat_count: int = Field(..., description="Number of seats booked")
    total_amount_inr: Decimal = Field(..., description="Total amount paid in INR")
    booking_status: str = Field(..., description="Booking status")
    payment: PaymentResponse = Field(..., description="Payment details")
    created_at: str = Field(..., description="Booking creation timestamp")

    class Config:
        json_encoders = {Decimal: lambda v: float(v)}


class BookingSummary(BaseModel):
    """Schema for booking summary (simplified)."""

    id: str
    event_run_id: str
    seat_count: int
    total_amount_inr: Decimal
    booking_status: str
    created_at: str

    class Config:
        json_encoders = {Decimal: lambda v: float(v)}

