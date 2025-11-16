#!/usr/bin/env python3
"""
Quick test script to verify Supabase connection
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_service_client, get_db
from app.core.config import get_settings

def test_connection():
    """Test Supabase connection"""
    print("🔍 Testing Supabase Connection...")
    print("=" * 50)
    
    settings = get_settings()
    
    # Check settings
    print(f"\n📋 Configuration Check:")
    print(f"  SUPABASE_URL: {'✅ SET' if settings.supabase_url else '❌ NOT SET'}")
    print(f"  SUPABASE_ANON_KEY: {'✅ SET' if settings.supabase_anon_key else '❌ NOT SET'}")
    print(f"  SUPABASE_SERVICE_KEY: {'✅ SET' if settings.supabase_service_key else '❌ NOT SET'}")
    
    if not all([settings.supabase_url, settings.supabase_anon_key, settings.supabase_service_key]):
        print("\n❌ Missing required configuration. Please check your .env file.")
        return False
    
    # Test service client
    print(f"\n🔌 Testing Service Client...")
    try:
        service_client = get_service_client()
        print("✅ Service client created successfully")
        
        # Try a simple query
        print("\n📊 Testing database query...")
        result = service_client.table("users").select("id").limit(1).execute()
        print(f"✅ Database query successful! (Found {len(result.data)} user(s))")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test anon client
    print(f"\n🔌 Testing Anon Client...")
    try:
        anon_client = get_db()
        print("✅ Anon client created successfully")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Supabase is configured correctly.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please check your configuration.")
        sys.exit(1)

