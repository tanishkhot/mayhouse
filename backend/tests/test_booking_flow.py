"""
Tests for Booking Flow
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from main import app
from datetime import datetime

client = TestClient(app)

@pytest.fixture
def mock_verify_token():
    """Mock verify_token to bypass authentication"""
    with patch("app.api.bookings.verify_token") as mock:
        mock.return_value = {"sub": "test-user-123", "role": "user"}
        yield mock

@pytest.fixture
def mock_booking_service():
    """Mock booking_service to avoid DB calls"""
    with patch("app.api.bookings.booking_service") as mock:
        mock.create_booking = AsyncMock()
        mock.get_user_bookings = AsyncMock()
        yield mock

class TestBookingFlow:
    """Test complete booking flow via API endpoints"""

    def test_create_booking_success(self, mock_verify_token, mock_booking_service):
        """Test successful booking creation"""
        mock_response = {
            "id": "booking-123",
            "event_run_id": "run-123",
            "user_id": "test-user-123",
            "seat_count": 2,
            "total_amount_inr": 3000.0,
            "booking_status": "confirmed",
            "payment": {
                "payment_id": "pay-123",
                "status": "completed",
                "amount_inr": 3000.0,
                "transaction_id": "tx-123",
                "timestamp": "2024-01-01T12:00:00Z",
                "payment_method": "dummy"
            },
            "created_at": "2024-01-01T12:00:00Z"
        }
        mock_booking_service.create_booking.return_value = mock_response

        response = client.post(
            "/bookings",
            json={"event_run_id": "run-123", "seat_count": 2},
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == "booking-123"
        assert data["booking_status"] == "confirmed"
        assert data["total_amount_inr"] == 3000.0

    def test_get_my_bookings(self, mock_verify_token, mock_booking_service):
        """Test fetching user bookings"""
        # Explicitly set AsyncMock to ensure awaitability
        mock_booking_service.get_user_bookings = AsyncMock()
    
        mock_bookings = [
            {
                "id": "booking-123",
                "event_run_id": "run-123",
                "seat_count": 2,
                "total_amount_inr": 3000.0,
                "booking_status": "confirmed",
                "created_at": "2024-01-01T12:00:00Z",
                "event_run": {
                    "id": "run-123",
                    "title": "Test Experience",
                    "start_datetime": "2025-10-15T10:00:00Z",
                    "end_datetime": "2025-10-15T13:00:00Z",
                    "status": "scheduled",
                    "experiences": {
                         "id": "exp-123",
                         "title": "Test Experience",
                         "experience_domain": "art"
                    }
                }
            }
        ]
        mock_booking_service.get_user_bookings.return_value = mock_bookings
    
        response = client.get(
            "/bookings/my",
            headers={"Authorization": "Bearer valid-token"}
        )
    
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == "booking-123"

    def test_calculate_booking_cost(self):
        """Test calculating booking cost"""
        # Mock DB response for event run
        mock_response = MagicMock()
        mock_response.data = [{
            "id": "run-123",
            "special_pricing_inr": None,
            "experiences": {"price_inr": 1500.0}
        }]
        
        with patch("app.api.bookings.get_service_client") as mock_db_client:
            mock_db_client.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client.post(
                "/bookings/calculate-cost",
                json={"event_run_id": "run-123", "seat_count": 2}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["total_price_inr"] == 3000.0  # 1500 * 2
            assert data["stake_inr"] == 600.0         # 20% of 3000
            assert data["total_cost_inr"] == 3600.0

