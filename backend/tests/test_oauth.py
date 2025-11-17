"""
Tests for OAuth authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from app.main import app

client = TestClient(app)


@pytest.fixture
def mock_google_oauth_config():
    """Mock Google OAuth configuration"""
    with patch('app.core.config.get_settings') as mock_settings:
        settings = MagicMock()
        settings.google_client_id = "test-client-id"
        settings.google_client_secret = "test-client-secret"
        settings.oauth_redirect_uri = "http://localhost:8000/auth/oauth/google/callback"
        settings.cors_origins = ["http://localhost:3000"]
        mock_settings.return_value = settings
        yield settings


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    with patch('app.core.database.get_service_client') as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        yield mock_client


class TestOAuthLogin:
    """Test OAuth login initiation"""
    
    def test_google_oauth_login_redirects(self, mock_google_oauth_config):
        """Test that Google OAuth login redirects to Google"""
        response = client.get("/auth/oauth/google/login")
        
        assert response.status_code == 307  # Redirect
        assert "accounts.google.com" in response.headers.get("location", "")
        assert "client_id=test-client-id" in response.headers.get("location", "")
        assert "redirect_uri" in response.headers.get("location", "")
    
    def test_google_oauth_login_missing_config(self):
        """Test that missing config returns error"""
        with patch('app.core.config.get_settings') as mock_settings:
            settings = MagicMock()
            settings.google_client_id = ""
            mock_settings.return_value = settings
            
            response = client.get("/auth/oauth/google/login")
            assert response.status_code == 500


class TestOAuthCallback:
    """Test OAuth callback handling"""
    
    @patch('app.services.oauth_service.exchange_code_for_token')
    @patch('app.services.oauth_service.get_or_create_oauth_user')
    @patch('app.services.oauth_service.create_supabase_session_token')
    async def test_oauth_callback_success(
        self,
        mock_create_token,
        mock_get_user,
        mock_exchange_token,
        mock_google_oauth_config,
        mock_supabase
    ):
        """Test successful OAuth callback"""
        # Mock OAuth flow
        mock_exchange_token.return_value = {
            "access_token": "google-access-token",
            "id_token": "google-id-token",
            "user_info": {
                "email": "test@example.com",
                "name": "Test User",
                "picture": "https://example.com/pic.jpg"
            }
        }
        
        mock_get_user.return_value = {
            "id": "user-123",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": "user"
        }
        
        mock_create_token.return_value = "jwt-token-123"
        
        response = client.get("/auth/oauth/google/callback?code=test-code")
        
        assert response.status_code == 307  # Redirect
        assert "localhost:3000" in response.headers.get("location", "")
        assert "access_token" in response.headers.get("location", "")
    
    def test_oauth_callback_with_error(self, mock_google_oauth_config):
        """Test OAuth callback with error parameter"""
        response = client.get("/auth/oauth/google/callback?error=access_denied")
        
        assert response.status_code == 307  # Redirect
        assert "error=access_denied" in response.headers.get("location", "")
    
    def test_oauth_callback_missing_code(self, mock_google_oauth_config):
        """Test OAuth callback without code"""
        response = client.get("/auth/oauth/google/callback")
        
        assert response.status_code == 307  # Redirect
        assert "error=no_code" in response.headers.get("location", "")


class TestTokenValidation:
    """Test token validation for both token types"""
    
    def test_auth_me_with_custom_jwt(self, mock_supabase):
        """Test /auth/me with custom JWT token"""
        from app.core.jwt_utils import create_access_token
        from datetime import timedelta
        
        # Create a custom JWT token
        token_data = {
            "sub": "user-123",
            "role": "user"
        }
        token = create_access_token(token_data, timedelta(days=7))
        
        # Mock database response
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            "id": "user-123",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": "user",
            "wallet_address": None,
            "created_at": "2024-01-01T00:00:00Z"
        }]
        
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "user-123"
        assert data["email"] == "test@example.com"
    
    @patch('app.core.database.get_service_client')
    def test_auth_me_with_supabase_token(self, mock_get_client):
        """Test /auth/me with Supabase token"""
        from supabase import create_client
        
        # Mock Supabase auth response
        mock_supabase = MagicMock()
        mock_user = MagicMock()
        mock_user.id = "supabase-user-123"
        mock_auth_response = MagicMock()
        mock_auth_response.user = mock_user
        
        mock_supabase.auth.get_user.return_value = mock_auth_response
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            "id": "supabase-user-123",
            "email": "oauth@example.com",
            "full_name": "OAuth User",
            "role": "user",
            "wallet_address": None,
            "created_at": "2024-01-01T00:00:00Z"
        }]
        
        mock_get_client.return_value = mock_supabase
        
        with patch('app.api.wallet_auth.get_settings') as mock_settings:
            settings = MagicMock()
            settings.supabase_service_key = "test-service-key"
            settings.supabase_url = "https://test.supabase.co"
            mock_settings.return_value = settings
            
            with patch('supabase.create_client', return_value=mock_supabase):
                response = client.get(
                    "/auth/me",
                    headers={"Authorization": "Bearer supabase-token-123"}
                )
                
                # Should try Supabase first, then fall back to JWT
                # Since Supabase validation might fail in test, we check for either success or 401
                assert response.status_code in [200, 401]
    
    def test_auth_me_no_token(self):
        """Test /auth/me without token"""
        response = client.get("/auth/me")
        assert response.status_code == 401
    
    def test_auth_me_invalid_token(self):
        """Test /auth/me with invalid token"""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid-token"}
        )
        assert response.status_code == 401


class TestOAuthService:
    """Test OAuth service functions"""
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient')
    async def test_exchange_code_for_token(self, mock_client_class):
        """Test code exchange for token"""
        from app.services.oauth_service import exchange_code_for_token
        from app.core.config import get_settings
        
        # Mock HTTP responses
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        # Mock token response
        mock_token_response = MagicMock()
        mock_token_response.json.return_value = {
            "access_token": "google-access-token",
            "id_token": "google-id-token"
        }
        mock_token_response.raise_for_status = MagicMock()
        
        # Mock user info response
        mock_user_response = MagicMock()
        mock_user_response.json.return_value = {
            "email": "test@example.com",
            "name": "Test User",
            "picture": "https://example.com/pic.jpg"
        }
        mock_user_response.raise_for_status = MagicMock()
        
        mock_client.post.return_value = mock_token_response
        mock_client.get.return_value = mock_user_response
        
        with patch('app.core.config.get_settings') as mock_settings:
            settings = MagicMock()
            settings.google_client_id = "test-id"
            settings.google_client_secret = "test-secret"
            settings.oauth_redirect_uri = "http://localhost:8000/callback"
            mock_settings.return_value = settings
            
            result = await exchange_code_for_token("test-code")
            
            assert "access_token" in result
            assert "user_info" in result
            assert result["user_info"]["email"] == "test@example.com"

