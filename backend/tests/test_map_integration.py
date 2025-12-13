import pytest
from fastapi.testclient import TestClient
from main import app
from app.schemas.experience import ExperienceStatus
from unittest.mock import patch
from datetime import datetime

client = TestClient(app)

# Comprehensive dummy experience data matching ExperienceResponse schema
dummy_experience_response = {
    "id": "exp-123",
    "host_id": "test-user-id-123",
    "title": "Test Experience with Map",
    "promise": "A wonderful journey through test data",
    "description": "This is a comprehensive description that meets the minimum length requirement for testing purposes. It needs to be at least 100 characters long so I am just typing more words here.",
    "unique_element": "This experience is unique because it is automated testing.",
    "host_story": "I am a test runner and I love creating tests for the platform.",
    "experience_domain": "culture",
    "experience_theme": "Technology",
    "country": "India",
    "city": "Mumbai",
    "neighborhood": "Bandra",
    "meeting_landmark": "Bandra Fort",
    "meeting_point_details": "Meet at the main gate of the fort",
    "duration_minutes": 120,
    "traveler_min_capacity": 1,
    "traveler_max_capacity": 4,
    "price_inr": 1500.0,
    "inclusions": ["Guide", "Snacks"],
    "traveler_should_bring": ["Water", "Camera"],
    "accessibility_notes": ["Walking required"],
    "weather_contingency_plan": "Indoor alternative",
    "photo_sharing_consent_required": True,
    "experience_safety_guidelines": "Stay with the group",
    "status": "draft",
    "admin_feedback": None,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "approved_at": None,
    "approved_by": None,
    "latitude": 19.0434,
    "longitude": 72.8223
}

# Request payload (can be subset of response)
dummy_experience_payload = {
    "title": dummy_experience_response["title"],
    "promise": dummy_experience_response["promise"],
    "description": dummy_experience_response["description"],
    "unique_element": dummy_experience_response["unique_element"],
    "host_story": dummy_experience_response["host_story"],
    "experience_domain": dummy_experience_response["experience_domain"],
    "experience_theme": dummy_experience_response["experience_theme"],
    "neighborhood": dummy_experience_response["neighborhood"],
    "meeting_landmark": dummy_experience_response["meeting_landmark"],
    "meeting_point_details": dummy_experience_response["meeting_point_details"],
    "duration_minutes": dummy_experience_response["duration_minutes"],
    "traveler_max_capacity": dummy_experience_response["traveler_max_capacity"],
    "price_inr": dummy_experience_response["price_inr"],
    "inclusions": dummy_experience_response["inclusions"],
    "latitude": dummy_experience_response["latitude"],
    "longitude": dummy_experience_response["longitude"]
}

@pytest.fixture
def auth_headers():
    """Create a dummy auth token for testing"""
    from app.core.jwt_utils import create_access_token
    from datetime import timedelta
    
    token_data = {"sub": "test-user-id-123", "role": "host"}
    token = create_access_token(token_data, timedelta(days=1))
    return {"Authorization": f"Bearer {token}"}

class TestExperienceMapWorkflow:
    
    @patch('app.api.experiences.verify_token')
    def test_create_experience_with_coordinates(self, mock_verify_token, auth_headers):
        """Test creating an experience with latitude and longitude"""
        mock_verify_token.return_value = {"sub": "test-user-id-123", "role": "host"}
        
        with patch('app.services.experience_service.experience_service.create_experience') as mock_create:
            mock_create.return_value = dummy_experience_response
            
            response = client.post(
                "/experiences",
                json=dummy_experience_payload,
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["latitude"] == 19.0434
            assert data["longitude"] == 72.8223
            
            # Verify mock was called with correct data including coordinates
            call_args = mock_create.call_args[1]
            assert float(call_args["experience_data"].latitude) == 19.0434
            assert float(call_args["experience_data"].longitude) == 72.8223

    @patch('app.api.experiences.verify_token')
    def test_update_experience_coordinates(self, mock_verify_token, auth_headers):
        """Test updating coordinates for an experience"""
        mock_verify_token.return_value = {"sub": "test-user-id-123", "role": "host"}
        
        # Prepare updated response
        updated_response = dummy_experience_response.copy()
        updated_response["latitude"] = 19.0500
        updated_response["longitude"] = 72.8300
        updated_response["updated_at"] = "2023-01-02T00:00:00Z"
        
        with patch('app.services.experience_service.experience_service.update_experience') as mock_update:
            mock_update.return_value = updated_response
            
            update_payload = {
                "update_data": {
                    "latitude": 19.0500,
                    "longitude": 72.8300
                },
                "host_id": "test-user-id-123"
            }
            
            response = client.put(
                "/experiences/exp-123",
                json=update_payload,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["latitude"] == 19.0500
            assert data["longitude"] == 72.8300

    @patch('app.api.design_experience._get_user_id_from_auth')
    def test_design_wizard_logistics_step(self, mock_get_user_id):
        """Test that the design wizard logistics step accepts coordinates"""
        mock_get_user_id.return_value = "test-user-id-123"
        
        with patch('app.services.design_experience_service.design_experience_service.upsert_logistics') as mock_upsert:
            mock_upsert.return_value = {
                "id": "session-123",
                "updated_at": "2023-01-01T00:00:00Z",
                "step": "logistics"
            }
            
            payload = {
                "neighborhood": "Bandra",
                "meeting_point": "Fort",
                "latitude": 19.0434,
                "longitude": 72.8223,
                "traveler_max_capacity": 4,
                "price_inr": 1500
            }
            
            response = client.patch(
                "/design-experience/session/session-123/logistics",
                json=payload,
                headers={"Authorization": "Bearer token"}
            )
            
            assert response.status_code == 200
            
            # Verify the service was called with coordinates
            call_args = mock_upsert.call_args[0] # positional args: session_id, host_id, payload
            payload_arg = call_args[2]
            assert payload_arg.latitude == 19.0434
            assert payload_arg.longitude == 72.8223
