# Experience Photo Upload Feature

## Overview

This document describes the photo upload functionality for Mayhouse experiences, which allows hosts to upload and manage photos for their experiences using Supabase Storage.

## Features

- **Multi-photo Upload**: Upload up to 10 photos per experience
- **Cover Photo Management**: Designate one photo as the cover photo
- **Drag & Drop**: Intuitive drag-and-drop interface
- **Photo Captions**: Add optional captions to each photo
- **Display Order**: Control the order in which photos are displayed
- **Delete Photos**: Remove unwanted photos
- **Image Validation**: Automatic validation of file type and size
- **Progress Tracking**: Real-time upload progress indication

## Database Schema

### Table: `experience_photos`

```sql
CREATE TABLE experience_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    is_cover_photo BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    caption TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_cover_photo_per_experience 
        EXCLUDE (experience_id WITH =) WHERE (is_cover_photo = true)
);
```

**Key Constraints:**
- Only one cover photo per experience (enforced by exclusion constraint)
- Photos are automatically deleted when the parent experience is deleted (CASCADE)

**Indexes:**
- `idx_experience_photos_experience_id`: Fast lookups by experience
- `idx_experience_photos_cover`: Optimized cover photo queries
- `idx_experience_photos_display_order`: Ordered photo retrieval

## Backend API

### Upload Photo
**POST** `/experiences/{experience_id}/photos`

**Form Data:**
- `file` (required): Image file (JPEG, PNG, WebP, max 5MB)
- `is_cover_photo` (optional): Boolean, default false
- `display_order` (optional): Integer, default 0
- `caption` (optional): String, max 500 characters

**Response:**
```json
{
  "photo_id": "uuid",
  "photo_url": "https://...",
  "is_cover_photo": false,
  "message": "Photo uploaded successfully"
}
```

### Get Experience Photos
**GET** `/experiences/{experience_id}/photos`

**Response:**
```json
[
  {
    "id": "uuid",
    "experience_id": "uuid",
    "photo_url": "https://...",
    "is_cover_photo": true,
    "display_order": 0,
    "caption": "Amazing view",
    "uploaded_at": "2025-10-26T..."
  }
]
```

### Update Photo Metadata
**PATCH** `/experiences/{experience_id}/photos/{photo_id}`

**Request Body:**
```json
{
  "is_cover_photo": true,
  "display_order": 1,
  "caption": "Updated caption"
}
```

### Delete Photo
**DELETE** `/experiences/{experience_id}/photos/{photo_id}`

**Response:**
```json
{
  "message": "Photo deleted successfully"
}
```

## Storage Configuration

### Supabase Storage Bucket

**Bucket Name**: `experience-photos`

**Storage Path Structure**:
```
experience-photos/
  └── experiences/
      └── {experience_id}/
          └── {timestamp}_{uuid}.{ext}
```

**Example Path**:
```
experiences/a1b2c3d4-e5f6-7890/20251026_143052_f9e8d7c6.jpg
```

### File Restrictions
- **Allowed Types**: JPEG, JPG, PNG, WebP
- **Max Size**: 5MB per file
- **Max Photos**: 10 per experience

## Frontend Components

### ExperiencePhotoUpload Component

**Location**: `frontend/src/components/ExperiencePhotoUpload.tsx`

**Props:**
```typescript
interface ExperiencePhotoUploadProps {
  experienceId: string;           // Required: ID of the experience
  onPhotosUpdate?: (photos: Photo[]) => void;  // Optional: Callback when photos change
  existingPhotos?: Photo[];       // Optional: Pre-loaded photos
  maxPhotos?: number;             // Optional: Max photos (default: 10)
}
```

**Usage:**
```tsx
<ExperiencePhotoUpload 
  experienceId={experienceId}
  maxPhotos={10}
  onPhotosUpdate={(photos) => console.log('Photos updated', photos)}
/>
```

### Design Experience Flow

The photo upload is integrated as **Step 4** in the experience creation flow:

1. **Step 1**: Basic Information (title, description, category, duration)
2. **Step 2**: Experience Details (capacity, price, neighborhood, meeting point)
3. **Step 3**: Additional Information (requirements, what to bring, good to know)
4. **Step 4**: Photos & Final Review (photo upload, preview)

**Flow Logic:**
- Experience must be saved before photos can be uploaded
- When moving from Step 3 to Step 4, the experience is automatically created
- Photos can be uploaded and managed in Step 4
- Users can navigate back to edit experience details
- Final "Done" button takes users to their dashboard

## Implementation Details

### Photo Upload Service

**Location**: `backend/app/services/photo_upload_service.py`

**Key Methods:**

```python
class PhotoUploadService:
    async def upload_photo_to_storage(file, experience_id) -> str
    async def create_photo_record(experience_id, photo_url, ...) -> dict
    async def get_experience_photos(experience_id) -> List[dict]
    async def delete_photo(photo_id, user_id) -> None
    async def update_photo_metadata(photo_id, user_id, ...) -> dict
```

**Features:**
- Generates unique filenames with timestamps and UUIDs
- Validates file types and sizes
- Handles Supabase storage operations
- Manages cover photo constraints (unsets old cover when setting new)
- Authorizes operations (verifies user is the host)

### Frontend State Management

The photo upload component manages its own state:
- **Local photo list**: Synced with backend
- **Upload progress**: Real-time percentage
- **Error handling**: User-friendly error messages
- **Drag state**: Visual feedback for drag-and-drop

### Authorization

All photo operations require authentication:
- User must be logged in (JWT token)
- User must be the host of the experience
- Backend validates ownership before any CRUD operation

## Migration

**File**: `backend/database/migrations/003_create_experience_photos_table.sql`

To apply the migration:

```bash
# Via Supabase Dashboard:
# 1. Navigate to SQL Editor
# 2. Copy and paste the migration SQL
# 3. Execute

# Or via psql:
psql -h your-supabase-host -U postgres -d postgres -f backend/database/migrations/003_create_experience_photos_table.sql
```

## Environment Setup

### Backend Requirements

Ensure these environment variables are set in `backend/.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Supabase Storage Setup

1. **Create Storage Bucket**:
   - Navigate to Supabase Dashboard → Storage
   - Click "New Bucket"
   - Name: `experience-photos`
   - Public: Yes (for public photo URLs)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp`

2. **Configure Storage Policies** (if needed):
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
```

## User Experience

### Host Flow

1. Host creates a new experience (Steps 1-3)
2. On Step 3, they click "Continue to Photos"
3. Experience is saved as draft
4. Step 4 opens with photo upload interface
5. Host uploads photos via:
   - Drag & drop files into the upload area
   - Or click to browse and select files
6. First uploaded photo is automatically set as cover
7. Host can:
   - Add captions to photos
   - Change which photo is the cover
   - Delete unwanted photos
   - Photos are displayed in a responsive grid
8. Click "Done - Go to Dashboard" to finish

### Visual Features

- **Upload Area**: Dashed border box with upload icon
- **Drag Active**: Highlighted border when dragging files over
- **Progress Bar**: Shows upload progress
- **Photo Grid**: Responsive 2-3 column layout
- **Cover Badge**: Red badge indicating cover photo
- **Hover Actions**: Buttons appear on hover (Set as Cover, Delete)
- **Caption Input**: Below each photo for adding descriptions

## Error Handling

The system handles various error scenarios:

- **No Authentication**: Prompts user to log in
- **Invalid File Type**: Shows error message, continues with valid files
- **File Too Large**: Shows error message, skips oversized files
- **Storage Failure**: Shows generic upload error
- **Network Issues**: Catches and displays connection errors
- **Authorization Errors**: 403 if user is not the host
- **Not Found Errors**: 404 if experience/photo doesn't exist

## Security Considerations

1. **Authentication**: All operations require valid JWT token
2. **Authorization**: Only hosts can manage their experience photos
3. **File Validation**: Server-side validation of file types and sizes
4. **Storage Isolation**: Photos organized by experience ID
5. **Delete Cascade**: Photos automatically deleted with parent experience
6. **Cover Photo Constraint**: Database ensures only one cover photo

## Performance Optimizations

1. **Indexed Queries**: All common queries use database indexes
2. **Batch Uploads**: Multiple files can be uploaded in sequence
3. **Optimistic UI**: Photos shown immediately after upload
4. **Lazy Loading**: Photos loaded only when needed
5. **CDN Delivery**: Supabase Storage serves via CDN
6. **Caching**: Browser caches photo URLs

## Future Enhancements

Potential improvements for the photo system:

- [ ] Image compression before upload
- [ ] Image cropping/editing tools
- [ ] Reordering photos via drag & drop
- [ ] Bulk photo upload
- [ ] Photo gallery lightbox view
- [ ] AI-powered photo quality suggestions
- [ ] Automatic cover photo selection based on quality
- [ ] Photo tags and search
- [ ] Photo usage analytics

## Testing

### Manual Testing Checklist

- [ ] Upload single photo
- [ ] Upload multiple photos at once
- [ ] Upload via drag & drop
- [ ] Set cover photo
- [ ] Change cover photo
- [ ] Add photo caption
- [ ] Edit photo caption
- [ ] Delete photo
- [ ] Verify photo appears in experience listing
- [ ] Test with invalid file types
- [ ] Test with oversized files
- [ ] Test with no authentication
- [ ] Test with non-host user

### API Testing

```bash
# Upload photo
curl -X POST http://localhost:8000/experiences/{id}/photos \
  -H "Authorization: Bearer {token}" \
  -F "file=@photo.jpg" \
  -F "is_cover_photo=true"

# Get photos
curl http://localhost:8000/experiences/{id}/photos

# Update photo
curl -X PATCH http://localhost:8000/experiences/{id}/photos/{photo_id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"caption": "Updated caption"}'

# Delete photo
curl -X DELETE http://localhost:8000/experiences/{id}/photos/{photo_id} \
  -H "Authorization: Bearer {token}"
```

## Troubleshooting

### Common Issues

**Issue**: "Failed to upload photo to storage"
- **Solution**: Check Supabase credentials and storage bucket exists

**Issue**: "Photo uploaded but not showing"
- **Solution**: Verify storage bucket is public and policies allow read access

**Issue**: "Cannot set cover photo"
- **Solution**: Check database constraint, may be existing cover photo conflict

**Issue**: "Photos not loading in UI"
- **Solution**: Check CORS settings in Supabase, verify photo URLs are accessible

**Issue**: "Upload stuck at 0%"
- **Solution**: Check network connection, verify file size is within limits

## Conclusion

The experience photo upload feature provides a robust, user-friendly way for hosts to add visual content to their experiences. It leverages Supabase Storage for reliable file hosting and includes comprehensive validation, error handling, and authorization checks to ensure data integrity and security.

For questions or issues, refer to:
- Backend API documentation: `/docs` endpoint (FastAPI auto-docs)
- Supabase Storage documentation: https://supabase.com/docs/guides/storage
- Component source code in `frontend/src/components/ExperiencePhotoUpload.tsx`

