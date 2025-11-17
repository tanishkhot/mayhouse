"""
Integration tests for authentication flow
Tests both wallet and OAuth authentication
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)


class TestAuthenticationFlow:
    """Test complete authentication flows"""
    
    def test_wallet_auth_flow(self):
        """Test complete wallet authentication flow"""
        # Step 1: Request nonce
        response = client.post(
            "/auth/wallet/nonce",
            json={"wallet_address": "0x1234567890123456789012345678901234567890"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "nonce" in data
        assert "message" in data
        
        # Note: Actual signature verification would require real wallet signing
        # This test verifies the endpoint exists and returns expected structure
    
    def test_oauth_login_endpoint_exists(self):
        """Test that OAuth login endpoint exists"""
        response = client.get("/auth/oauth/google/login")
        # Should redirect (307) or return error if not configured
        assert response.status_code in [307, 500]
    
    def test_oauth_callback_endpoint_exists(self):
        """Test that OAuth callback endpoint exists"""
        response = client.get("/auth/oauth/google/callback?code=test")
        # Should redirect (307) or return error
        assert response.status_code in [307, 500]
    
    def test_auth_me_endpoint_exists(self):
        """Test that /auth/me endpoint exists"""
        response = client.get("/auth/me")
        # Should return 401 without token
        assert response.status_code == 401


class TestTokenCompatibility:
    """Test that both token types work with same endpoints"""
    
    def test_custom_jwt_works_with_auth_me(self):
        """Test custom JWT token works with /auth/me"""
        from app.core.jwt_utils import create_access_token
        from datetime import timedelta
        
        token_data = {"sub": "test-user-123", "role": "user"}
        token = create_access_token(token_data, timedelta(days=7))
        
        with patch('app.core.database.get_service_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
                "id": "test-user-123",
                "email": "test@example.com",
                "full_name": "Test User",
                "role": "user",
                "wallet_address": None,
                "created_at": "2024-01-01T00:00:00Z"
            }]
            mock_get_client.return_value = mock_client
            
            response = client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == "test-user-123"


class TestPublicEndpoints:
    """Test that public endpoints don't require authentication"""
    
    def test_oauth_endpoints_are_public(self):
        """Test OAuth endpoints are accessible without auth"""
        response = client.get("/auth/oauth/google/login")
        # Should not require authentication
        assert response.status_code != 401
        
        response = client.get("/auth/oauth/google/callback?code=test")
        assert response.status_code != 401
    
    def test_health_endpoint_is_public(self):
        """Test health endpoint is public"""
        response = client.get("/health/")
        assert response.status_code == 200
    
    def test_explore_endpoint_is_public(self):
        """Test explore endpoint is public"""
        response = client.get("/explore/")
        # Should not require authentication
        assert response.status_code != 401


class TestErrorHandling:
    """Test error handling in authentication"""
    
    def test_missing_oauth_config_returns_error(self):
        """Test missing OAuth config returns appropriate error"""
        with patch('app.core.config.get_settings') as mock_settings:
            settings = MagicMock()
            settings.google_client_id = ""
            mock_settings.return_value = settings
            
            response = client.get("/auth/oauth/google/login")
            assert response.status_code == 500
    
    def test_invalid_token_returns_401(self):
        """Test invalid token returns 401"""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid-token-123"}
        )
        assert response.status_code == 401
    
    def test_missing_token_returns_401(self):
        """Test missing token returns 401"""
        response = client.get("/auth/me")
        assert response.status_code == 401

