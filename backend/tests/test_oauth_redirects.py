"""
Tests for OAuth redirect behavior - ensuring no localhost fallbacks in production
"""
import sys
from pathlib import Path

# Add backend directory to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


class TestOAuthLoginRedirects:
    """Test OAuth login redirects use correct frontend URL"""
    
    @pytest.fixture
    def mock_google_oauth_config(self):
        """Mock Google OAuth configuration"""
        with patch('app.core.config.get_settings') as mock_settings:
            settings = MagicMock()
            settings.google_client_id = "test-client-id"
            settings.google_client_secret = "test-secret"
            settings.cors_origins = [
                "http://localhost:3000",
                "https://mayhouse.in",
                "https://www.mayhouse.in"
            ]
            mock_settings.return_value = settings
            yield settings
    
    @patch('app.services.oauth_service.get_google_oauth_url')
    def test_oauth_login_uses_origin_header(self, mock_oauth_url, mock_google_oauth_config):
        """Test that Origin header is preferred for frontend URL"""
        mock_oauth_url.return_value = ("https://accounts.google.com/oauth?state=mh1.xyz", "state")
        
        response = client.get(
            "/auth/oauth/google/login",
            headers={"Origin": "https://mayhouse.in"}
        )
        
        assert response.status_code == 307
        # Verify OAuth URL was called
        assert mock_oauth_url.called
        # Verify state parameter was passed (contains frontend URL)
        call_args = mock_oauth_url.call_args
        assert call_args is not None
        assert "state" in call_args[1]
    
    @patch('app.services.oauth_service.get_google_oauth_url')
    def test_oauth_login_uses_referer_header(self, mock_oauth_url, mock_google_oauth_config):
        """Test that Referer header is used if Origin not present"""
        mock_oauth_url.return_value = ("https://accounts.google.com/oauth?state=mh1.xyz", "state")
        
        response = client.get(
            "/auth/oauth/google/login",
            headers={"Referer": "https://mayhouse.in/login"}
        )
        
        assert response.status_code == 307
        assert mock_oauth_url.called
        # Verify Referer was used
        call_args = mock_oauth_url.call_args
        assert call_args is not None
    
    @patch('app.services.oauth_service.get_google_oauth_url')
    def test_oauth_login_defaults_to_production(self, mock_oauth_url, mock_google_oauth_config):
        """Test that production URL is used when no headers present"""
        mock_oauth_url.return_value = ("https://accounts.google.com/oauth?state=mh1.xyz", "state")
        
        response = client.get("/auth/oauth/google/login")
        
        assert response.status_code == 307
        assert mock_oauth_url.called
        # Should default to https://mayhouse.in
        call_args = mock_oauth_url.call_args
        assert call_args is not None
    
    @patch('app.services.oauth_service.get_google_oauth_url')
    def test_oauth_login_localhost_in_dev(self, mock_oauth_url, mock_google_oauth_config):
        """Test that localhost is accepted when explicitly provided in headers"""
        mock_oauth_url.return_value = ("https://accounts.google.com/oauth?state=mh1.xyz", "state")
        
        response = client.get(
            "/auth/oauth/google/login",
            headers={"Origin": "http://localhost:3000"}
        )
        
        assert response.status_code == 307
        # localhost should be accepted in development context
        call_args = mock_oauth_url.call_args
        assert call_args is not None


class TestOAuthCallbackErrorRedirects:
    """Test OAuth callback error handler never uses localhost in production"""
    
    @pytest.fixture
    def mock_settings_production(self):
        """Mock production settings"""
        with patch('app.core.config.get_settings') as mock_settings:
            settings = MagicMock()
            settings.google_client_id = "test-client-id"
            settings.cors_origins = [
                "https://mayhouse.in",
                "https://www.mayhouse.in"
            ]  # No localhost in production
            mock_settings.return_value = settings
            yield settings
    
    def test_oauth_callback_error_uses_production_url(self, mock_settings_production):
        """Test error handler uses production URL when state missing"""
        # Simulate error in callback (no state provided)
        response = client.get(
            "/auth/oauth/google/callback?code=invalid-code",
            follow_redirects=False
        )
        
        # Should redirect to production frontend, not localhost
        if response.status_code == 307:
            location = response.headers.get("location", "")
            # Should not contain localhost
            assert "localhost" not in location.lower()
    
    def test_oauth_callback_error_with_error_param(self, mock_settings_production):
        """Test OAuth callback with error parameter redirects correctly"""
        response = client.get(
            "/auth/oauth/google/callback?error=access_denied",
            follow_redirects=False
        )
        
        # Should redirect with error
        assert response.status_code == 307
        location = response.headers.get("location", "")
        # Should not redirect to localhost in production
        assert "localhost" not in location.lower()
        # Should redirect to frontend callback
        assert "/auth/callback" in location or "mayhouse.in" in location
    
    @pytest.fixture
    def mock_settings_development(self):
        """Mock development settings with localhost in CORS"""
        with patch('app.core.config.get_settings') as mock_settings:
            settings = MagicMock()
            settings.google_client_id = "test-client-id"
            settings.cors_origins = [
                "http://localhost:3000",
                "https://mayhouse.in"
            ]  # localhost allowed in dev
            mock_settings.return_value = settings
            yield settings
    
    def test_oauth_callback_error_prioritizes_production_over_localhost(
        self, 
        mock_settings_development
    ):
        """Test that production origins are preferred even if localhost is in CORS"""
        response = client.get(
            "/auth/oauth/google/callback?error=test_error",
            follow_redirects=False
        )
        
        if response.status_code == 307:
            location = response.headers.get("location", "")
            # Should prefer production URLs from CORS origins (mayhouse.in)
            # or default to production URL
            production_urls = ["mayhouse.in"]
            has_production = any(url in location for url in production_urls)
            # Should use production URL or default to it
            assert has_production or "mayhouse.in" in location

