"""
Payment Service - Dummy Payment Processor

This service simulates payment processing for bookings.
Will be replaced with Razorpay integration later.
"""

import uuid
import asyncio
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any


class PaymentService:
    """Service for processing payments (dummy implementation)."""

    @staticmethod
    async def process_booking_payment(
        amount_inr: Decimal, user_id: str, booking_id: str
    ) -> Dict[str, Any]:
        """
        Process a booking payment (dummy implementation).

        Args:
            amount_inr: Amount to charge in INR
            user_id: User ID making the payment
            booking_id: Booking ID for reference

        Returns:
            Dictionary with payment details:
            - payment_id: Unique payment ID
            - status: Payment status (always "completed" for dummy)
            - amount_inr: Amount charged
            - transaction_id: Transaction reference
            - timestamp: Payment timestamp
            - payment_method: Payment method used
        """
        # Simulate payment processing delay (0.5 seconds)
        await asyncio.sleep(0.5)

        # Generate dummy payment details
        payment_id = f"dummy_{uuid.uuid4().hex[:16]}"
        transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"

        return {
            "payment_id": payment_id,
            "status": "completed",
            "amount_inr": float(amount_inr),
            "transaction_id": transaction_id,
            "timestamp": datetime.utcnow().isoformat(),
            "payment_method": "dummy",
        }


# Create service instance
payment_service = PaymentService()

