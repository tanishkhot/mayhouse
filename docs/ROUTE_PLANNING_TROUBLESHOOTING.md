# Route Planning Troubleshooting Guide

This guide helps diagnose and resolve common issues with route planning integration.

## Issue Categories

### 1. Waypoints Not Saving

**Symptoms**:
- Waypoints are added on the map but disappear after saving
- Experience saves successfully but `route_data` is empty or missing
- Console shows no errors but waypoints don't persist

**Possible Causes**:
1. **API payload missing route_data**
   - Check: Open browser DevTools > Network tab > Find POST/PUT request to `/experiences`
   - Verify: Request payload includes `route_data` field
   - Fix: Check `mapFormToExperienceCreate` in `experience-mapper.ts` - ensure `form.waypoints` is mapped to `route_data`

2. **Form state not syncing with waypoints**
   - Check: In `DesignExperienceV2.tsx`, verify `setForm(p => ({ ...p, waypoints: updated }))` is called after waypoint changes
   - Fix: Ensure `addWaypoint`, `removeWaypoint`, `handleWaypointChange` all sync to form state

3. **Backend validation rejecting route_data**
   - Check: Backend logs for validation errors
   - Verify: `route_data` structure matches Pydantic schema in `backend/app/schemas/experience.py`
   - Fix: Ensure waypoints array structure matches expected format

**Diagnostic Steps**:
```javascript
// In browser console, check form state before save:
// Navigate to DesignExperienceV2 component
// Check: form.waypoints array exists and has data

// Check API request payload:
// DevTools > Network > Find POST /api/experiences
// Verify: body.route_data.waypoints exists
```

**SQL Verification**:
```sql
-- Check if route_data was saved
SELECT id, title, route_data 
FROM experiences 
WHERE id = '<experience-id>';

-- If route_data is NULL or empty, waypoints didn't save
```

**Solutions**:
- Verify `waypoints` state is included in `finalFormData` before calling mapper
- Check that `mapFormToExperienceCreate` includes: `route_data: form.waypoints ? { waypoints: form.waypoints } : undefined`
- Ensure backend Pydantic schema accepts `route_data: Optional[Dict[str, Any]]`

---

### 2. Waypoints Not Loading in Edit Mode

**Symptoms**:
- Experience loads in edit mode but map is empty
- Waypoints don't appear on map
- Console shows waypoints in API response but UI doesn't display them

**Possible Causes**:
1. **Deserialization issue**
   - Check: `mapExperienceResponseToForm` in `experience-mapper.ts`
   - Verify: `experience.route_data?.waypoints` is correctly mapped to `form.waypoints`
   - Fix: Ensure waypoints array is properly deserialized with all required fields

2. **Waypoint initialization timing**
   - Check: `useEffect` in `DesignExperienceV2.tsx` that initializes waypoints
   - Verify: Effect runs after experience data loads
   - Fix: Ensure dependency array includes `isLoadingExperience` and checks for loaded data

3. **MapPicker not receiving waypoints**
   - Check: `MapPicker` component receives `routeWaypoints` prop
   - Verify: Waypoints prop is passed correctly from `DesignExperienceV2`
   - Fix: Ensure `routeWaypoints={waypoints}` is passed to `MapPicker`

**Diagnostic Steps**:
```javascript
// In browser console, check API response:
// DevTools > Network > Find GET /api/experiences/<id>
// Verify: response.route_data.waypoints exists

// Check form state after load:
// In DesignExperienceV2, check: form.waypoints array

// Check MapPicker props:
// Verify: routeWaypoints prop is passed with waypoints data
```

**SQL Verification**:
```sql
-- Verify route_data exists in database
SELECT id, route_data->'waypoints' as waypoints
FROM experiences 
WHERE id = '<experience-id>';

-- Check waypoint structure
SELECT jsonb_array_elements(route_data->'waypoints') as waypoint
FROM experiences 
WHERE id = '<experience-id>';
```

**Solutions**:
- Ensure `mapExperienceResponseToForm` handles `route_data` correctly:
  ```typescript
  const waypoints = (experience.route_data?.waypoints || []).map((wp: any) => ({
    id: wp.id || `waypoint-${Date.now()}`,
    lat: wp.lat,
    lng: wp.lng,
    name: wp.name || '', // Ensure name is always string
    type: wp.type || 'stop',
    description: wp.description,
  }));
  ```
- Check `useEffect` dependency array includes `isLoadingExperience` and prevents overwriting loaded data
- Verify `MapPicker` receives `routeWaypoints` prop correctly

---

### 3. Route Not Displaying in Moderator Dashboard

**Symptoms**:
- Experience has `route_data` in database but route section doesn't appear
- Map doesn't render in preview modal
- Waypoint count text is missing or incorrect

**Possible Causes**:
1. **Normalizer not mapping route_data**
   - Check: `normalizeModeratorExperience` in `experience-preview-normalizer.ts`
   - Verify: `exp.route_data` is mapped to `routeData` in normalized data
   - Fix: Ensure normalizer checks for waypoints array and maps correctly

2. **Component not receiving routeData**
   - Check: `ExperiencePreviewContent` component receives `routeData` prop
   - Verify: Prop is passed from parent component (moderator dashboard)
   - Fix: Ensure normalized data includes `routeData` and is passed to preview component

3. **Conditional rendering logic**
   - Check: `ExperiencePreviewContent` conditionally renders route section
   - Verify: Condition checks `experience.routeData?.waypoints?.length > 0`
   - Fix: Ensure condition correctly identifies when to show route section

**Diagnostic Steps**:
```javascript
// Check normalized data:
// In moderator dashboard, check normalized experience object
// Verify: routeData property exists

// Check component props:
// In ExperiencePreviewContent, check: experience.routeData
// Verify: routeData.waypoints array exists and has length > 0
```

**SQL Verification**:
```sql
-- Verify route_data exists for moderator view
SELECT 
    id, 
    title, 
    jsonb_array_length(route_data->'waypoints') as waypoint_count,
    route_data->'waypoints' as waypoints
FROM experiences 
WHERE id = '<experience-id>';
```

**Solutions**:
- Ensure `normalizeModeratorExperience` includes:
  ```typescript
  routeData: exp.route_data && exp.route_data.waypoints
    ? { waypoints: exp.route_data.waypoints }
    : undefined,
  ```
- Verify `ExperiencePreviewContent` conditionally renders:
  ```typescript
  {experience.routeData?.waypoints && experience.routeData.waypoints.length > 0 && (
    <div>...</div>
  )}
  ```
- Check `MapPicker` receives correct props: `routeWaypoints`, `readOnly={true}`, `showSearch={false}`

---

### 4. Map Not Rendering

**Symptoms**:
- Map container appears but map tiles don't load
- Map shows gray/blank area
- Console errors related to Leaflet or map initialization

**Possible Causes**:
1. **Leaflet CSS not loaded**
   - Check: `leaflet/dist/leaflet.css` is imported in `MapPicker` component
   - Fix: Ensure CSS import exists: `import 'leaflet/dist/leaflet.css';`

2. **Map container ref is null**
   - Check: `mapContainerRef.current` is not null before calling `L.map()`
   - Fix: Ensure ref is attached to DOM element and checked before map initialization

3. **Invalid coordinates**
   - Check: Waypoint coordinates are valid (lat: -90 to 90, lng: -180 to 180)
   - Fix: Validate coordinates before passing to map

4. **Map container size is zero**
   - Check: Map container has explicit height/width
   - Fix: Ensure container has `height` prop or CSS height set

**Diagnostic Steps**:
```javascript
// Check map container ref:
// In MapPicker component, verify: mapContainerRef.current !== null

// Check coordinates:
// Verify: waypoints have valid lat/lng values
// Check: defaultCenter prop is valid

// Check console errors:
// Look for Leaflet-related errors or CORS issues
```

**Solutions**:
- Ensure CSS import: `import 'leaflet/dist/leaflet.css';`
- Check ref initialization:
  ```typescript
  useEffect(() => {
    if (!mapContainerRef.current) return;
    // Initialize map
  }, []);
  ```
- Validate coordinates before rendering
- Set explicit map container height

---

### 5. Waypoint Types Incorrect

**Symptoms**:
- All waypoints show as same type (all "stop" instead of start/stop/end)
- First waypoint is not "start"
- Last waypoint is not "end"

**Possible Causes**:
1. **Type assignment logic**
   - Check: `addWaypoint` and `removeWaypoint` functions in `DesignExperienceV2.tsx`
   - Verify: Types are reassigned after adding/removing waypoints
   - Fix: Ensure type assignment logic: first = 'start', last = 'end', middle = 'stop'

2. **Database data incorrect**
   - Check: Waypoint types in database match expected values
   - Fix: Ensure type assignment happens before saving

**Diagnostic Steps**:
```javascript
// Check waypoint types before save:
// In DesignExperienceV2, verify: waypoints array has correct types
// First: 'start', Last: 'end', Middle: 'stop'

// Check saved data:
// SQL query to verify types in database
```

**SQL Verification**:
```sql
-- Check waypoint types
SELECT 
    jsonb_array_elements(route_data->'waypoints')->>'type' as waypoint_type,
    jsonb_array_elements(route_data->'waypoints')->>'name' as waypoint_name
FROM experiences 
WHERE id = '<experience-id>';
```

**Solutions**:
- Ensure type assignment in `addWaypoint`:
  ```typescript
  const updated = newWaypoints.map((wp, idx) => ({
    ...wp,
    type: idx === 0 ? 'start' : (idx === newWaypoints.length - 1 ? 'end' : 'stop')
  }));
  ```
- Ensure type reassignment in `removeWaypoint`:
  ```typescript
  const updated = filtered.map((wp, idx) => ({
    ...wp,
    type: idx === 0 ? 'start' : (idx === filtered.length - 1 ? 'end' : 'stop')
  }));
  ```

---

### 6. Meeting Point Not Syncing with First Waypoint

**Symptoms**:
- Meeting Point field doesn't update when first waypoint changes
- First waypoint name doesn't match Meeting Point
- Changes to one don't reflect in the other

**Possible Causes**:
1. **Bidirectional sync missing**
   - Check: `handleWaypointChange` updates Meeting Point when first waypoint changes
   - Fix: Ensure Meeting Point syncs with first waypoint name

2. **Initialization issue**
   - Check: Meeting Point is set from first waypoint on load
   - Fix: Ensure `useEffect` sets Meeting Point from loaded waypoints

**Diagnostic Steps**:
```javascript
// Check form.meetingPoint matches waypoints[0].name
// Verify: Changes to first waypoint update meetingPoint
```

**Solutions**:
- Sync Meeting Point when first waypoint changes:
  ```typescript
  if (id === 'start' && field === 'name') {
    setForm(p => ({ ...p, meetingPoint: value }));
  }
  ```

---

### 7. Edit Mode Overwrites Loaded Waypoints

**Symptoms**:
- Waypoints load correctly but then disappear
- Map shows waypoints briefly then clears
- Console shows waypoints being overwritten

**Possible Causes**:
1. **useEffect running after load**
   - Check: `useEffect` that initializes waypoints from form coordinates
   - Verify: Effect checks `isLoadingExperience` before running
   - Fix: Prevent effect from running when waypoints are already loaded

**Diagnostic Steps**:
```javascript
// Check useEffect dependency array
// Verify: includes isLoadingExperience check
// Verify: doesn't overwrite if waypoints already exist
```

**Solutions**:
- Update `useEffect` to check for loaded waypoints:
  ```typescript
  useEffect(() => {
    if (isLoadingExperience) return; // Don't initialize while loading
    if (form.waypoints && form.waypoints.length > 0) return; // Don't overwrite loaded waypoints
    // Initialize from coordinates
  }, [form.latitude, form.longitude, form.meetingPoint, isLoadingExperience]);
  ```

---

### 8. Invalid Waypoint Data Structure

**Symptoms**:
- Database errors when saving
- Waypoints missing required fields (id, lat, lng, name, type)
- JSON parsing errors

**Possible Causes**:
1. **Missing required fields**
   - Check: All waypoints have `id`, `lat`, `lng`, `name`, `type`
   - Fix: Ensure waypoint creation includes all required fields

2. **Invalid data types**
   - Check: `lat` and `lng` are numbers, not strings
   - Fix: Ensure coordinates are parsed as numbers

**Diagnostic Steps**:
```sql
-- Check waypoint structure
SELECT 
    jsonb_array_elements(route_data->'waypoints') as waypoint
FROM experiences 
WHERE id = '<experience-id>';

-- Check for missing fields
SELECT 
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE wp->>'id' IS NULL 
        OR wp->>'lat' IS NULL 
        OR wp->>'lng' IS NULL 
        OR wp->>'name' IS NULL
        OR wp->>'type' IS NULL) as missing_fields_count
FROM experiences 
WHERE id = '<experience-id>';
```

**Solutions**:
- Ensure waypoint creation includes all fields:
  ```typescript
  {
    id: `waypoint-${Date.now()}`,
    lat: number,
    lng: number,
    name: string, // Always string, never null/undefined
    type: 'start' | 'stop' | 'end',
    description?: string
  }
  ```

---

## General Diagnostic Checklist

When troubleshooting route planning issues, follow this checklist:

1. **Check Browser Console**
   - Look for JavaScript errors
   - Check network requests/responses
   - Verify API payloads include `route_data`

2. **Check Database**
   - Run SQL queries to verify `route_data` exists
   - Check waypoint structure matches expected format
   - Verify coordinates are valid

3. **Check Component State**
   - Verify `waypoints` state in `DesignExperienceV2`
   - Check `form.waypoints` is synced
   - Verify props passed to `MapPicker`

4. **Check API Responses**
   - Verify `GET /experiences/<id>` returns `route_data`
   - Check `POST/PUT /experiences` accepts `route_data`
   - Verify response structure matches frontend expectations

5. **Check Data Flow**
   - Frontend form → mapper → API payload
   - API response → mapper → frontend form
   - Normalizer → preview component

## Common SQL Queries for Diagnosis

```sql
-- Find experiences with route_data
SELECT id, title, route_data 
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb;

-- Check waypoint count
SELECT 
    id, 
    title,
    jsonb_array_length(route_data->'waypoints') as waypoint_count
FROM experiences 
WHERE route_data IS NOT NULL;

-- Verify waypoint structure
SELECT 
    jsonb_pretty(route_data->'waypoints') as waypoints
FROM experiences 
WHERE id = '<experience-id>';

-- Find invalid waypoints
SELECT 
    id,
    title,
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE (wp->>'lat')::float NOT BETWEEN -90 AND 90
        OR (wp->>'lng')::float NOT BETWEEN -180 AND 180) as invalid_coords
FROM experiences 
WHERE route_data IS NOT NULL;
```

## Getting Help

If issues persist after following this guide:

1. **Collect Information**:
   - Browser console logs
   - Network request/response details
   - SQL query results
   - Component state (React DevTools)

2. **Document Steps**:
   - What you were trying to do
   - What happened vs what you expected
   - Steps to reproduce

3. **Check Related Files**:
   - `frontend/src/lib/experience-mapper.ts`
   - `frontend/src/components/design-experience-v2/DesignExperienceV2.tsx`
   - `frontend/src/components/ui/map-picker.tsx`
   - `frontend/src/lib/experience-preview-normalizer.ts`
   - `backend/app/schemas/experience.py`

