# Design Experience Page Fix

## Issue
React error: "Cannot access 'fetchExperienceData' before initialization"

## Root Cause
In React, when using `useCallback` or defining functions that are used in a `useEffect` dependency array, the function must be defined **before** the `useEffect` that references it.

**Original Code (WRONG):**
```tsx
useEffect(() => {
  const editId = searchParams.get('edit');
  if (editId) {
    fetchExperienceData(editId);  // ❌ Using before definition
  }
}, [searchParams, fetchExperienceData]);  // ❌ In dependency array

const fetchExperienceData = useCallback(async (id: string) => {
  // Function definition comes AFTER useEffect
}, [router]);
```

## The Fix
1. Added `useCallback` to imports
2. Moved `fetchExperienceData` definition **before** the `useEffect`

**Fixed Code (CORRECT):**
```tsx
// ✅ Define the function FIRST
const fetchExperienceData = useCallback(async (id: string) => {
  try {
    const token = localStorage.getItem('mayhouse_token');
    // ... fetch logic
  } catch (error) {
    // ... error handling
  } finally {
    setIsLoading(false);
  }
}, [router]);

// ✅ Use it in useEffect AFTER definition
useEffect(() => {
  const editId = searchParams.get('edit');
  if (editId) {
    setIsEditMode(true);
    setExperienceId(editId);
    fetchExperienceData(editId);  // ✅ Now defined above
  } else {
    setIsLoading(false);
  }
}, [searchParams, fetchExperienceData]);  // ✅ Safe to include in deps
```

## Changes Made
1. **Line 3:** Added `useCallback` to React imports
2. **Lines 34-76:** Moved `fetchExperienceData` definition before `useEffect`
3. **Lines 78-88:** Placed `useEffect` after function definition

## Why This Matters
- React hooks like `useEffect` need their dependencies to be defined before they run
- `useCallback` creates a memoized version of the function
- The dependency array (`[searchParams, fetchExperienceData]`) references the function, so it must exist first

## Result
✅ No more initialization errors
✅ Edit mode works correctly
✅ Experience data loads when `?edit=<id>` is in URL
✅ Proper React hooks order

## Testing
1. Go to `/design-experience` - Should load empty form
2. Go to `/design-experience?edit=some-id` - Should fetch and populate form
3. No console errors about initialization

