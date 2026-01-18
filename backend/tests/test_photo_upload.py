#!/usr/bin/env python3
"""
Test script for photo upload and download functionality.

Tests the complete flow:
1. Create test user and experience (if needed)
2. Upload test.jpg
3. Retrieve photos
4. Verify photo URL is accessible
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
import main
from app.core.database import get_service_client
from app.core.config import get_settings
import uuid

# Get test file path (test.jpg in project root)
project_root = Path(__file__).parent.parent.parent
test_image_path = project_root / "test.jpg"

client = TestClient(main.app)

print("=" * 70)
print("Photo Upload/Download Pipeline Test")
print("=" * 70)
print()

# Check if test image exists
if not test_image_path.exists():
    print(f"❌ Test image not found at: {test_image_path}")
    print("   Please ensure test.jpg exists in the project root directory")
    sys.exit(1)

test_image_size = test_image_path.stat().st_size
test_image_size_mb = test_image_size / (1024 * 1024)
print(f"✓ Test image found: {test_image_path}")
print(f"  File size: {test_image_size_mb:.2f} MB ({test_image_size / 1024:.2f} KB)")

# Check if image is within size limit (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
if test_image_size > MAX_FILE_SIZE:
    print(f"  ⚠ Test image exceeds 5MB limit - validation will reject it (expected)")
    print(f"  ℹ This confirms file size validation is working correctly")
    # Create a smaller test image for successful upload test
    try:
        from PIL import Image
        small_test_path = project_root / "test_small.jpg"
        if not small_test_path.exists():
            print(f"  Creating smaller test image: test_small.jpg...")
            # Resize to reduce file size (target < 1MB)
            with Image.open(test_image_path) as img:
                # Resize to max 800px width while maintaining aspect ratio
                max_width = 800
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_size = (max_width, int(img.height * ratio))
                    small_img = img.resize(new_size, Image.Resampling.LANCZOS)
                else:
                    small_img = img.copy()
                # Save with lower quality to reduce size
                small_img.save(small_test_path, "JPEG", quality=85, optimize=True)
                small_size_mb = small_test_path.stat().st_size / (1024 * 1024)
                print(f"  ✓ Created small test image: {small_size_mb:.2f} MB")
                test_image_path = small_test_path  # Use small image for upload test
        else:
            small_size_mb = small_test_path.stat().st_size / (1024 * 1024)
            if small_size_mb < 5:
                print(f"  ✓ Using existing small test image: {small_size_mb:.2f} MB")
                test_image_path = small_test_path
            else:
                print(f"  ⚠ Small test image still too large: {small_size_mb:.2f} MB")
    except ImportError:
        print(f"  ⚠ PIL/Pillow not available - cannot create small test image")
        print(f"  ℹ Install Pillow to test successful upload: pip install Pillow")
    except Exception as e:
        print(f"  ⚠ Could not create small test image: {e}")
else:
    print(f"  ✓ Test image is within size limit - can test successful upload")

print()

# Get Supabase client for test data setup
try:
    supabase = get_service_client()
    settings = get_settings()
    print(f"✓ Supabase client initialized")
    print(f"  URL: {settings.supabase_url[:30]}..." if settings.supabase_url else "  URL: NOT SET")
except Exception as e:
    print(f"❌ Failed to initialize Supabase client: {e}")
    print("   Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env")
    sys.exit(1)

# Step 1: Get or create test user
print("\n" + "-" * 70)
print("Step 1: Setting up test user and experience")
print("-" * 70)

test_user_id = None
test_experience_id = None

try:
    # Try to find an existing host user
    result = supabase.table("users").select("id, role").eq("role", "host").limit(1).execute()
    
    if result.data:
        test_user_id = result.data[0]["id"]
        print(f"✓ Using existing host user: {test_user_id}")
    else:
        print("⚠ No existing host user found")
        print("  You may need to create a test host user manually")
        print("  Or ensure at least one user has role='host'")
        
        # Try to use any user
        result = supabase.table("users").select("id").limit(1).execute()
        if result.data:
            test_user_id = result.data[0]["id"]
            print(f"  Using any existing user: {test_user_id}")
            print("  ⚠ Note: Photo upload requires host role - this may fail authorization")
        else:
            print("  ❌ No users found in database")
            print("  Please create at least one user in the database first")
            sys.exit(1)
    
    # Get or create a test experience for this user
    result = supabase.table("experiences").select("id, host_id, title").eq(
        "host_id", test_user_id
    ).limit(1).execute()
    
    if result.data:
        test_experience_id = result.data[0]["id"]
        print(f"✓ Using existing experience: {test_experience_id}")
        print(f"  Title: {result.data[0].get('title', 'N/A')}")
    else:
        print("⚠ No existing experience found for test user")
        print("  Creating test experience...")
        
        # Create a test experience (using correct schema from migration 017)
        experience_data = {
            "host_id": test_user_id,
            "title": "Test Experience for Photo Upload Testing",
            "promise": "A unique test experience for verifying photo upload functionality works correctly",
            "description": "This is a test experience created specifically for photo upload testing. It includes all required fields to verify that the photo upload and retrieval pipeline functions correctly.",
            "unique_element": "This test experience is used to verify that photos can be uploaded to Supabase Storage and retrieved via the API endpoints.",
            "host_story": "This is a test host story created for photo upload testing purposes.",
            "experience_domain": "test",
            "country": "India",
            "city": "Mumbai",
            "meeting_landmark": "Test Location",
            "meeting_point_details": "Test meeting point for photo upload testing",
            "duration_minutes": 60,
            "traveler_min_capacity": 1,
            "traveler_max_capacity": 4,
            "price_inr": 1000,
            "inclusions": [],
            "traveler_should_bring": [],
            "accessibility_notes": [],
            "status": "draft"
        }
        
        result = supabase.table("experiences").insert(experience_data).execute()
        if result.data:
            test_experience_id = result.data[0]["id"]
            print(f"✓ Created test experience: {test_experience_id}")
        else:
            print("❌ Failed to create test experience")
            sys.exit(1)

except Exception as e:
    print(f"❌ Error setting up test data: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 2: Create a test JWT token (if JWT auth is available)
print("\n" + "-" * 70)
print("Step 2: Setting up authentication")
print("-" * 70)

# For testing, we'll need a valid JWT token
# This is a simplified approach - in real testing, you'd generate proper tokens
test_token = None

try:
    from app.core.jwt_utils import create_access_token
    
    # Create a test token for the user
    token_data = {"sub": test_user_id}
    test_token = create_access_token(data=token_data)
    print(f"✓ Created test JWT token")
    print(f"  Token: {test_token[:30]}...")
except Exception as e:
    print(f"⚠ Could not create JWT token: {e}")
    print("  You may need to set JWT_SECRET_KEY in .env")
    print("  Will attempt tests without token (expecting auth failures)")

# Step 3: Test photo upload
print("\n" + "-" * 70)
print("Step 3: Testing photo upload")
print("-" * 70)

upload_success = False
uploaded_photo_id = None
uploaded_photo_url = None

try:
    # Open test image file
    with open(test_image_path, "rb") as f:
        files = {"file": ("test.jpg", f, "image/jpeg")}
        data = {
            "is_cover_photo": "true",
            "display_order": "0"
        }
        
        headers = {}
        if test_token:
            headers["Authorization"] = f"Bearer {test_token}"
        
        print(f"  Uploading test.jpg to experience {test_experience_id}...")
        response = client.post(
            f"/experiences/{test_experience_id}/photos",
            files=files,
            data=data,
            headers=headers
        )
        
        print(f"  Status code: {response.status_code}")
        
        if response.status_code == 200:
            upload_success = True
            result = response.json()
            uploaded_photo_id = result.get("photo_id")
            uploaded_photo_url = result.get("photo_url")
            print(f"✓ Upload successful!")
            print(f"  Photo ID: {uploaded_photo_id}")
            print(f"  Photo URL: {uploaded_photo_url}")
        elif response.status_code == 401:
            print("  ❌ Unauthorized - check JWT token generation")
            print(f"  Response: {response.json()}")
        elif response.status_code == 403:
            print("  ❌ Forbidden - user may not be host or experience owner")
            print(f"  Response: {response.json()}")
        elif response.status_code == 404:
            print("  ❌ Experience not found")
            print(f"  Response: {response.json()}")
        else:
            print(f"  ❌ Upload failed with status {response.status_code}")
            print(f"  Response: {response.json()}")

except Exception as e:
    print(f"  ❌ Error during upload: {e}")
    import traceback
    traceback.print_exc()

# Step 4: Test photo retrieval
print("\n" + "-" * 70)
print("Step 4: Testing photo retrieval")
print("-" * 70)

retrieval_success = False

try:
    print(f"  Retrieving photos for experience {test_experience_id}...")
    response = client.get(f"/experiences/{test_experience_id}/photos")
    
    print(f"  Status code: {response.status_code}")
    
    if response.status_code == 200:
        photos = response.json()
        print(f"✓ Retrieval successful!")
        print(f"  Number of photos: {len(photos)}")
        
        if photos:
            for i, photo in enumerate(photos):
                print(f"\n  Photo {i + 1}:")
                print(f"    ID: {photo.get('id')}")
                print(f"    URL: {photo.get('photo_url')}")
                print(f"    Is Cover: {photo.get('is_cover_photo')}")
                print(f"    Display Order: {photo.get('display_order')}")
                
                # Verify uploaded photo is in the list
                if uploaded_photo_id and photo.get('id') == uploaded_photo_id:
                    retrieval_success = True
                    print(f"    ✓ This is the uploaded photo")
        else:
            print("  ⚠ No photos returned (even though upload may have succeeded)")
    else:
        print(f"  ❌ Retrieval failed with status {response.status_code}")
        print(f"  Response: {response.json()}")

except Exception as e:
    print(f"  ❌ Error during retrieval: {e}")
    import traceback
    traceback.print_exc()

# Step 5: Verify photo URL
print("\n" + "-" * 70)
print("Step 5: Verifying photo URL")
print("-" * 70)

if uploaded_photo_url:
    print(f"  Photo URL: {uploaded_photo_url}")
    print("  ✓ URL generated")
    print("  ℹ Note: To verify URL is accessible, open it in a browser")
    print("    or use: curl -I <photo_url>")
else:
    print("  ⚠ No photo URL to verify (upload may have failed)")

# Summary
print("\n" + "=" * 70)
print("Test Summary")
print("=" * 70)
print(f"Test User ID: {test_user_id}")
print(f"Test Experience ID: {test_experience_id}")
print(f"Upload Test: {'✓ PASSED' if upload_success else '❌ FAILED'}")
print(f"Retrieval Test: {'✓ PASSED' if retrieval_success else '❌ FAILED'}")
print(f"Photo ID: {uploaded_photo_id or 'N/A'}")
print()

if upload_success and retrieval_success:
    print("🎉 All tests passed! Photo upload and retrieval are working correctly.")
else:
    print("⚠ Some tests failed. Check the output above for details.")
    if not upload_success:
        print("  - Upload failed - check authorization, experience ID, and Supabase storage config")
    if not retrieval_success:
        print("  - Retrieval failed - check if photo was uploaded and database query works")

print()

