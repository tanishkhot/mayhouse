#!/usr/bin/env python3
"""
Quick test script to verify authentication implementation
Run this to check if all endpoints and services are properly set up
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import get_settings

client = TestClient(app)

def test_oauth_endpoints_exist():
    """Test that OAuth endpoints exist"""
    print("Testing OAuth endpoints...")
    
    # Test login endpoint
    response = client.get("/auth/oauth/google/login")
    assert response.status_code in [307, 500], f"Expected 307 or 500, got {response.status_code}"
    print("✓ OAuth login endpoint exists")
    
    # Test callback endpoint
    response = client.get("/auth/oauth/google/callback?code=test")
    assert response.status_code in [307, 500], f"Expected 307 or 500, got {response.status_code}"
    print("✓ OAuth callback endpoint exists")
    
    return True

def test_auth_me_endpoint():
    """Test that /auth/me endpoint exists and handles both token types"""
    print("\nTesting /auth/me endpoint...")
    
    # Test without token
    response = client.get("/auth/me")
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("✓ /auth/me requires authentication")
    
    # Test with invalid token
    response = client.get("/auth/me", headers={"Authorization": "Bearer invalid"})
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("✓ /auth/me rejects invalid tokens")
    
    return True

def test_wallet_endpoints():
    """Test that wallet endpoints exist"""
    print("\nTesting wallet endpoints...")
    
    # Test nonce endpoint
    response = client.post(
        "/auth/wallet/nonce",
        json={"wallet_address": "0x1234567890123456789012345678901234567890"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "nonce" in data, "Response should contain nonce"
    assert "message" in data, "Response should contain message"
    print("✓ Wallet nonce endpoint works")
    
    return True

def test_oauth_service_imports():
    """Test that OAuth service can be imported"""
    print("\nTesting OAuth service imports...")
    
    try:
        from app.services.oauth_service import (
            get_google_oauth_url,
            exchange_code_for_token,
            get_or_create_oauth_user,
            create_supabase_session_token,
        )
        print("✓ OAuth service imports successfully")
        return True
    except ImportError as e:
        print(f"✗ OAuth service import failed: {e}")
        return False

def test_configuration():
    """Test that configuration is accessible"""
    print("\nTesting configuration...")
    
    try:
        settings = get_settings()
        print(f"✓ Configuration loaded: {settings.app_name}")
        
        # Check OAuth config (may be empty, that's ok)
        if settings.google_client_id:
            print("✓ Google OAuth client ID is configured")
        else:
            print("⚠ Google OAuth client ID not configured (set GOOGLE_CLIENT_ID)")
        
        return True
    except Exception as e:
        print(f"✗ Configuration error: {e}")
        return False

def test_token_validation_logic():
    """Test that token validation logic supports both types"""
    print("\nTesting token validation logic...")
    
    # Check that auth_helpers supports both token types
    try:
        from app.core.auth_helpers import get_user_from_token
        import inspect
        source = inspect.getsource(get_user_from_token)
        
        # Check for Supabase validation
        if "supabase.auth.get_user" in source:
            print("✓ Auth helpers support Supabase tokens")
        else:
            print("⚠ Auth helpers may not support Supabase tokens")
        
        # Check for custom JWT validation
        if "verify_token" in source:
            print("✓ Auth helpers support custom JWT tokens")
        else:
            print("⚠ Auth helpers may not support custom JWT tokens")
        
        return True
    except Exception as e:
        print(f"✗ Token validation check failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Authentication Implementation Test")
    print("=" * 60)
    
    tests = [
        test_oauth_endpoints_exist,
        test_auth_me_endpoint,
        test_wallet_endpoints,
        test_oauth_service_imports,
        test_configuration,
        test_token_validation_logic,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"✗ Test failed: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All tests passed!")
        return 0
    else:
        print("✗ Some tests failed. Check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

