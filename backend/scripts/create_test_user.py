#!/usr/bin/env python3
"""
Script to create a test user for development/testing.

This creates a user in the database that can be used with TEST_USER_ID
for bypassing authentication in debug mode.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import get_service_client
from app.core.config import get_settings
import uuid


def create_test_user():
    """Create a test user in the database."""
    settings = get_settings()
    
    if not settings.supabase_url or not settings.supabase_service_key:
        print("❌ Error: Supabase credentials not configured in .env")
        print("   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY")
        return None
    
    supabase = get_service_client()
    
    # Check if test user already exists
    existing = (
        supabase.table("users")
        .select("id, email, full_name")
        .eq("email", "test@mayhouse.local")
        .execute()
    )
    
    if existing.data:
        user = existing.data[0]
        print(f"✅ Test user already exists!")
        print(f"   ID: {user['id']}")
        print(f"   Email: {user.get('email', 'N/A')}")
        print(f"   Name: {user.get('full_name', 'N/A')}")
        print(f"\n📋 Add this to your .env file:")
        print(f"   TEST_USER_ID={user['id']}")
        return user['id']
    
    # Create new test user
    test_user_id = str(uuid.uuid4())
    test_user = {
        "id": test_user_id,
        "email": "test@mayhouse.local",
        "full_name": "Test User",
        "username": "test_user",
        "role": "user",
    }
    
    try:
        result = supabase.table("users").insert(test_user).execute()
        
        if result.data:
            user = result.data[0]
            print(f"✅ Test user created successfully!")
            print(f"   ID: {user['id']}")
            print(f"   Email: {user.get('email')}")
            print(f"   Name: {user.get('full_name')}")
            print(f"\n📋 Add this to your .env file:")
            print(f"   TEST_USER_ID={user['id']}")
            return user['id']
        else:
            print("❌ Failed to create test user")
            return None
            
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return None


def list_existing_users():
    """List existing users that could be used as test user."""
    settings = get_settings()
    
    if not settings.supabase_url or not settings.supabase_service_key:
        print("❌ Error: Supabase credentials not configured")
        return
    
    supabase = get_service_client()
    
    try:
        result = (
            supabase.table("users")
            .select("id, email, full_name, role")
            .limit(10)
            .execute()
        )
        
        if result.data:
            print("\n📋 Existing users you could use as TEST_USER_ID:")
            print("-" * 80)
            for user in result.data:
                print(f"  ID: {user['id']}")
                print(f"  Email: {user.get('email', 'N/A')}")
                print(f"  Name: {user.get('full_name', 'N/A')}")
                print(f"  Role: {user.get('role', 'user')}")
                print("-" * 80)
        else:
            print("No users found in database")
            
    except Exception as e:
        print(f"❌ Error listing users: {e}")


if __name__ == "__main__":
    print("=" * 80)
    print("Test User Setup Script")
    print("=" * 80)
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        list_existing_users()
    else:
        user_id = create_test_user()
        if not user_id:
            print("\n💡 Tip: Run with --list to see existing users")
            print("   python scripts/create_test_user.py --list")

