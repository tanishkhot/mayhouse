# Quick Setup Guide - Photo Upload Feature

## Prerequisites
- Supabase project set up
- Backend and frontend environments configured

## Setup Steps

### 1. Database Migration

**Option A - Supabase Dashboard (Recommended)**:
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `backend/database/migrations/003_create_experience_photos_table.sql`
4. Paste and execute

**Option B - psql**:
```bash
psql -h your-supabase-host -U postgres -d postgres \
  -f backend/database/migrations/003_create_experience_photos_table.sql
```

### 2. Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Settings:
   - **Name**: `experience-photos`
   - **Public**: ✅ Yes (enable public access)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`
4. Click "Create bucket"

### 3. Configure Storage Policies (Optional)

If you need custom policies, run in SQL Editor:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'experience-photos');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'experience-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'experience-photos');
```

### 4. Verify Environment Variables

Ensure your `backend/.env` has:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 5. Install Dependencies (if needed)

**Backend**:
```bash
cd backend
pip install -r requirements.txt
```

**Frontend**:
```bash
cd frontend
npm install
```

### 6. Start Services

**Backend**:
```bash
cd backend
python main.py
# Or: uvicorn main:app --reload
```

**Frontend**:
```bash
cd frontend
npm run dev
```

### 7. Test the Feature

1. Navigate to `http://localhost:3000` (or your frontend URL)
2. Log in as a host user
3. Click "Design Experience" or go to `/design-experience`
4. Fill in experience details through Steps 1-3
5. On Step 3, click "Continue to Photos"
6. Experience is saved, and you're taken to Step 4
7. Try uploading photos:
   - Drag & drop files
   - Or click to browse
8. Verify photos appear in the grid
9. Try setting a cover photo
10. Add captions
11. Delete a photo
12. Click "Done - Go to Dashboard"

## Verification Checklist

- [ ] Migration executed successfully
- [ ] `experience-photos` bucket created in Supabase Storage
- [ ] Bucket is public
- [ ] Environment variables set
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can upload photos
- [ ] Photos appear in grid
- [ ] Cover photo badge shows on first photo
- [ ] Can change cover photo
- [ ] Can add captions
- [ ] Can delete photos

## Troubleshooting

### "Failed to upload photo to storage"
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check that `experience-photos` bucket exists
- Check bucket permissions

### "Cannot set cover photo"
- Verify migration created the unique constraint
- Check database logs for constraint violations

### Photos don't show in UI
- Verify bucket is public
- Check browser console for CORS errors
- Verify photo URLs are accessible

### Upload stuck at 0%
- Check network connection
- Verify file size is under 5MB
- Check file type is allowed (JPEG, PNG, WebP)

### Backend errors on startup
- Run migration if not already done
- Check Python dependencies installed
- Verify Supabase credentials

## API Testing (Optional)

Test the endpoints manually:

```bash
# Get your JWT token first (from browser localStorage or login response)
TOKEN="your-jwt-token"
EXPERIENCE_ID="your-experience-id"

# Upload a photo
curl -X POST "http://localhost:8000/experiences/$EXPERIENCE_ID/photos" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg" \
  -F "is_cover_photo=true" \
  -F "caption=Beautiful view"

# Get all photos for experience
curl "http://localhost:8000/experiences/$EXPERIENCE_ID/photos"

# Update photo metadata
PHOTO_ID="photo-uuid"
curl -X PATCH "http://localhost:8000/experiences/$EXPERIENCE_ID/photos/$PHOTO_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_cover_photo": true, "caption": "Updated caption"}'

# Delete photo
curl -X DELETE "http://localhost:8000/experiences/$EXPERIENCE_ID/photos/$PHOTO_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Next Steps

Once setup is complete:
1. Test thoroughly with different file types and sizes
2. Verify photos appear in experience listings
3. Check mobile responsiveness
4. Test error scenarios (invalid files, network issues)
5. Review security (authorization checks)

## Documentation

- **Feature Details**: See `PHOTO_UPLOAD_FEATURE.md`
- **Implementation Summary**: See `PHOTO_UPLOAD_SUMMARY.md`
- **API Docs**: Visit `http://localhost:8000/docs` after starting backend

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase Dashboard for errors
3. Check backend logs for detailed error messages
4. Verify browser console for frontend errors

---

**Setup Time**: ~10-15 minutes

That's it! You're ready to use the photo upload feature. 🎉

