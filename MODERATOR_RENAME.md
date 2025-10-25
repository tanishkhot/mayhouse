# Admin → Moderator Rename

## Changes Made

### 1. Renamed Directory
- `/src/app/admin/` → `/src/app/moderator/`

### 2. Updated Navbar
- Added "Moderator" link (purple color) for all authenticated users
- Route: `/moderator`

### 3. Updated Component Names
- `AdminDashboard` → `ModeratorDashboard`
- `AdminExperience` → `ModeratorExperience`
- `AdminEventRun` → `ModeratorEventRun`

### 4. Changed Protection Level
- **Before:** `<AdminOnlyRoute>` (required admin role)
- **After:** `<AuthenticatedRoute>` (any logged-in user can access)

### 5. Updated UI Text
- "Admin Dashboard" → "Moderator Dashboard"
- "Admin access required" → "Moderator access required"
- "Please log in as an administrator" → "Connect your wallet to access moderator features"
- Changed default tab from 'applications' to 'experiences'

### 6. Interface Updates
- `admin_feedback` → `moderator_feedback`
- All UI-facing "Admin" text replaced with "Moderator"

## What Wasn't Changed (Intentionally)

✅ Backend API endpoints still use `/admin/*` (internal implementation detail)
✅ `admin-api.ts` file name unchanged (internal API client)
✅ Backend references to "admin" in database/services (internal)

## Access Control - Current State

**Now:** Anyone with a connected wallet can access `/moderator`
- No role-based restrictions
- Open for testing and development

**Future:** Will add wallet whitelist
- Only specific wallet addresses can access moderator features
- Your wallet will be the only moderator initially
- Easy to add more moderators later by adding their wallet addresses

## How to Implement Wallet-Based Moderation (Future)

```typescript
// In moderator/page.tsx
const { address } = useAccount();
const MODERATOR_ADDRESSES = [
  '0xYourWalletAddress',  // Add your wallet here
];

useEffect(() => {
  if (address && !MODERATOR_ADDRESSES.includes(address.toLowerCase())) {
    setError('Only authorized moderators can access this page');
    router.push('/');
  }
}, [address]);
```

## Moderator Dashboard Features

### Experiences Tab (Default)
- View all submitted experiences
- Filter by: All, Submitted, Approved, Rejected
- Approve/Reject experiences with feedback
- View full experience details

### Applications Tab  
- Review host applications
- Approve/Reject with feedback
- (Note: Auto-approved now, so mostly empty)

### Event Runs Tab
- View all scheduled event runs
- See bookings and attendance
- Monitor event status

## Testing
1. Connect any wallet
2. Click "Moderator" in navbar
3. You'll see the Moderator Dashboard
4. Default view shows "Experiences" tab
5. Can review and approve/reject experiences

## URL
- **Old:** `/admin`
- **New:** `/moderator`

Links to `/admin` will 404 now - all updated to `/moderator`

