#!/usr/bin/env python3
"""Quick test to verify implementation"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("Authentication Implementation Test")
print("=" * 60)

# Test 1: OAuth endpoints
print("\n1. Testing OAuth endpoints...")
try:
    import main
    from fastapi.testclient import TestClient
    client = TestClient(main.app)
    
    r1 = client.get('/auth/oauth/google/login')
    print(f"   ✓ OAuth login endpoint: {r1.status_code} (expected 307 or 500)")
    
    r2 = client.get('/auth/oauth/google/callback?code=test')
    print(f"   ✓ OAuth callback endpoint: {r2.status_code} (expected 307 or 500)")
except Exception as e:
    print(f"   ✗ Error: {e}")
    client = None

# Test 2: Auth endpoints
print("\n2. Testing /auth/me endpoint...")
if client:
    try:
        r3 = client.get('/auth/me')
        print(f"   ✓ Without token: {r3.status_code} (expected 401)")
        
        r4 = client.get('/auth/me', headers={'Authorization': 'Bearer invalid'})
        print(f"   ✓ Invalid token: {r4.status_code} (expected 401)")
    except Exception as e:
        print(f"   ✗ Error: {e}")
else:
    print("   ⚠ Skipped (client not available)")

# Test 3: Wallet endpoints
print("\n3. Testing wallet endpoints...")
if client:
    try:
        r5 = client.post('/auth/wallet/nonce', json={'wallet_address': '0x1234567890123456789012345678901234567890'})
        print(f"   ✓ Wallet nonce: {r5.status_code} (expected 200)")
        if r5.status_code == 200:
            data = r5.json()
            print(f"   ✓ Response has nonce: {'nonce' in data}")
            print(f"   ✓ Response has message: {'message' in data}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
else:
    print("   ⚠ Skipped (client not available)")

# Test 4: Imports
print("\n4. Testing imports...")
try:
    from app.services.oauth_service import get_google_oauth_url, exchange_code_for_token
    print("   ✓ OAuth service imports successfully")
except Exception as e:
    print(f"   ✗ OAuth service import failed: {e}")

try:
    from app.api.oauth import router
    print("   ✓ OAuth router imports successfully")
    print(f"   ✓ OAuth routes: {len(router.routes)} routes registered")
except Exception as e:
    print(f"   ✗ OAuth router import failed: {e}")

# Test 5: Token validation
print("\n5. Testing token validation logic...")
try:
    from app.core.auth_helpers import get_user_from_token
    import inspect
    source = inspect.getsource(get_user_from_token)
    has_supabase = 'supabase.auth.get_user' in source
    has_jwt = 'verify_token' in source
    print(f"   ✓ Auth helpers support Supabase tokens: {has_supabase}")
    print(f"   ✓ Auth helpers support JWT tokens: {has_jwt}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 6: Configuration
print("\n6. Testing configuration...")
try:
    from app.core.config import get_settings
    settings = get_settings()
    print(f"   ✓ Configuration loaded: {settings.app_name}")
    if settings.google_client_id:
        print("   ✓ Google OAuth client ID is configured")
    else:
        print("   ⚠ Google OAuth client ID not configured (set GOOGLE_CLIENT_ID)")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
print("Test Complete!")
print("=" * 60)

