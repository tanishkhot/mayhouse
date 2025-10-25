# Experience Creation - Fixed!

## Issues Fixed

### 1. Backend API - JWT Authentication ✅
**Problem:** Backend expected `host_id` and `experience_data` in request body  
**Solution:** Updated to extract `host_id` from JWT token

**Changes in `experiences.py`:**
```python
# Before
async def create_experience(request: ExperienceCreateRequest)

# After  
async def create_experience(
    experience_data: ExperienceCreate,
    authorization: str = Header(None),
)
```

Now extracts user ID from JWT token automatically, just like host_application endpoints.

### 2. Frontend API Client ✅
**Problem:** Using `fetch` with manual token handling and wrong error parsing  
**Solution:** Use axios `api` client with automatic auth headers

**Changes in `design-experience/page.tsx`:**
```typescript
// Before
const response = await fetch('/api/experiences', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(experienceData)
});

// After
const response = await api.post('/experiences', experienceData);
```

### 3. Error Message Display ✅
**Problem:** Showing `[object Object]` instead of actual error  
**Solution:** Proper axios error handling with detailed messages

**Error Handling:**
```typescript
if (error.response) {
  const errorData = error.response.data;
  if (error.response.status === 422 && errorData.detail) {
    // Show validation errors properly
    if (Array.isArray(errorData.detail)) {
      errorMessage += errorData.detail.map((err: any) => 
        `${err.loc?.join(' -> ')}: ${err.msg}`
      ).join('\n');
    }
  }
}
```

### 4. Syntax Error ✅
**Problem:** Missing closing brace in nested if-else  
**Solution:** Fixed brace structure

---

## How It Works Now

### Backend Flow:
1. **Receive POST to `/experiences`**
2. **Extract user_id from JWT token** (from Authorization header)
3. **Auto-upgrade user to host** (if first experience)
4. **Create experience with status "submitted"**
5. **Return experience data**

### Frontend Flow:
1. **User fills out 3-step form**
2. **Click "Create Experience"**
3. **Send data via `api.post('/experiences', data)`**
   - Axios automatically adds `Authorization: Bearer <token>`
   - API client handles routing (proxy in prod, direct in dev)
4. **Backend validates and creates**
5. **Success:** Redirect to host dashboard
6. **Error:** Show detailed validation messages

---

## API Endpoint

**POST `/experiences`**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:** (ExperienceCreate schema)
```json
{
  "title": "Experience Title",
  "promise": "Short compelling promise...",
  "description": "Full description...",
  "unique_element": "What makes it special...",
  "host_story": "Your story...",
  "experience_domain": "food",
  "experience_theme": "street_food",
  "neighborhood": "Colaba",
  "meeting_landmark": "Gateway of India",
  "meeting_point_details": "Meet at the main entrance...",
  "duration_minutes": 180,
  "traveler_max_capacity": 4,
  "price_inr": 2500,
  "inclusions": ["Guide", "Food tastings"],
  "traveler_should_bring": ["Comfortable shoes"],
  "accessibility_notes": [],
  "experience_safety_guidelines": "Safety info..."
}
```

**Response:** (ExperienceResponse)
```json
{
  "id": "uuid",
  "title": "Experience Title",
  "status": "submitted",
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

---

## Required Fields

All these fields are required:
- ✅ `title` (10-200 chars)
- ✅ `promise` (20-200 chars)
- ✅ `description` (100-2000 chars)
- ✅ `unique_element` (50-500 chars)
- ✅ `host_story` (50-1000 chars)
- ✅ `experience_domain` (enum: food, culture, etc.)
- ✅ `meeting_landmark` (max 200 chars)
- ✅ `meeting_point_details` (max 500 chars)
- ✅ `duration_minutes` (30-480)
- ✅ `traveler_max_capacity` (1-4)
- ✅ `price_inr` (> 0)
- ✅ `inclusions` (array, min 1 item)

---

## Testing

1. **Connect wallet and login**
2. **Go to `/design-experience`**
3. **Fill out the form:**
   - Step 1: Basic info
   - Step 2: Location
   - Step 3: Logistics
4. **Click "Create Experience"**
5. **Should see:** "Experience created successfully!"
6. **Redirected to:** `/host-dashboard`
7. **Status:** "Submitted" (yellow badge)

---

## What Happens Next

1. **User creates experience** → Status: **Submitted**
2. **Moderator reviews** at `/moderator`
3. **Moderator approves/rejects** with feedback
4. **If approved** → User can create event runs
5. **If rejected** → User sees feedback, can edit and resubmit

---

## Common Errors

### "Authentication failed"
- Token expired or invalid
- Solution: Reconnect wallet

### "Validation error: Field required"
- Missing required field
- Check all required fields are filled

### "Network error"
- Backend not running or unreachable
- Check backend is running on port 8000

### "Access denied"
- User role issue (shouldn't happen with auto-upgrade)
- Check user has host role in database

---

## All Fixed! 🎉

The experience creation flow is now fully functional:
- ✅ JWT authentication working
- ✅ Auto-upgrade to host
- ✅ Auto-submit for review
- ✅ Proper error messages
- ✅ Clean user experience

**Try creating an experience now!**

