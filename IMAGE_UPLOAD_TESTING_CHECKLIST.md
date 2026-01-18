# Image Upload/Download Pipeline - Testing Checklist

This checklist verifies that all code changes for the image upload/download pipeline are working correctly.

## Code Implementation Status

✅ **Phase 1: Frontend Fixes** - Complete
- Content-Type header removed from upload request
- API interceptor updated to handle FormData correctly

✅ **Phase 2: Backend Validation** - Complete
- File size validation now checks after reading content
- Validation method converted to async

## Manual Testing Required

### Phase 3.1: Test Upload Flow

**Frontend Upload Test:**
1. Navigate to experience edit/design page
2. Upload a small test image (< 5MB, JPEG/PNG/WebP)
3. Verify in browser DevTools:
   - Request to `POST /experiences/{id}/photos` succeeds (200)
   - Response includes `photo_id` and `photo_url`
   - Check Network tab for:
     - `Content-Type: multipart/form-data; boundary=...` (should be auto-set by browser)
     - `Authorization: Bearer {token}` header present

**Backend Verification:**
- Check backend logs for successful upload
- Verify no errors in Supabase storage upload

**Database Verification:**
```sql
SELECT * FROM experience_photos WHERE experience_id = '{test_id}' ORDER BY uploaded_at DESC;
```
- Verify record created with:
  - `photo_url` (valid Supabase URL)
  - `is_cover_photo` (true for first photo)
  - `display_order` (correct order)

**Storage Verification:**
- Extract storage path from `photo_url`
- Verify file exists in Supabase Storage bucket `experience-photos`
- Test public URL access in browser (should load image)

### Phase 3.2: Test Download/Retrieval Flow

**API Retrieval Test:**
```bash
curl http://localhost:8000/experiences/{experience_id}/photos
```
- Verify returns array of photo objects
- Verify photos sorted by `display_order`
- Verify `photo_url` is valid Supabase URL

**Frontend Retrieval Test:**
- Refresh experience page
- Verify photos display in gallery
- Verify cover photo badge shows correctly
- Test photo URLs load in browser

**Authorization Tests:**
- Upload as host (should succeed)
- Attempt upload as non-host (should return 403)
- Test without auth token (should return 401)

### Phase 3.3: Verify Supabase Configuration

**Storage Bucket Checks:**
- [ ] Bucket `experience-photos` exists in Supabase Dashboard
- [ ] Bucket is public (public read permissions)
- [ ] Service key has write permissions
- [ ] Storage path structure matches: `experiences/{experience_id}/{timestamp}_{uuid}.{ext}`

### Phase 4: Edge Cases

**Test Scenarios:**
1. **Large file (> 5MB)**: Frontend validation should prevent upload; backend should reject if it reaches backend
2. **Invalid file type**: Frontend validation should show error; backend should reject with 400
3. **Multiple photos upload**: All photos upload correctly; `display_order` increments; only first photo is cover
4. **Cover photo changes**: Setting new cover photo unsets previous; database constraint prevents multiple covers
5. **Delete photo**: Photo removed from storage; database record deleted; authorization check works

## Expected Behavior After Fixes

- Upload requests should include correct `Content-Type` with boundary (set by browser automatically)
- Authorization headers should be present on all requests
- Files > 5MB should be rejected with clear error message
- Valid files should pass validation and upload successfully
- Photos should be retrievable via GET endpoint
- Public URLs should be accessible in browser

## Code Changes Summary

### Frontend (`frontend/src/components/ExperiencePhotoUpload.tsx`)
- Removed explicit `Content-Type` header from upload request (lines 92-101)

### Frontend (`frontend/src/lib/api.ts`)
- Updated request interceptor to detect FormData and remove Content-Type override (lines 123-138)

### Backend (`backend/app/services/photo_upload_service.py`)
- Converted `_validate_file` to async method (lines 33-49)
- Updated file size validation to check after reading content
- Updated `upload_photo_to_storage` to await async validation (line 77)

## Notes

- File size validation reads file twice (once for validation, once for upload). This is acceptable for files < 5MB.
- All upload endpoints require host authorization.
- Supabase bucket must be public for public URLs to work.

