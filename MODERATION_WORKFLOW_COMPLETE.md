# Moderation Workflow - Complete Implementation

## ✅ All Changes Complete

### Overview
Implemented a full moderation workflow where all user-created experiences must be reviewed and approved by a moderator before they can be used to create event runs.

---

## 🔄 Experience Lifecycle

```
User Creates → SUBMITTED → Moderator Reviews → APPROVED/REJECTED → Event Runs (if approved)
```

### Status Flow:
1. **SUBMITTED** - User creates experience (auto-submitted)
2. **APPROVED** - Moderator approves (can create event runs)
3. **REJECTED** - Moderator rejects with feedback (cannot create event runs)

---

## 📋 Changes Made

### 1. Renamed Admin → Moderator ✅

**Directory:**
- `/app/admin/` → `/app/moderator/`

**Component:**
- `AdminDashboard` → `ModeratorDashboard`
- `AdminExperience` → `ModeratorExperience`
- `AdminEventRun` → `ModeratorEventRun`

**Access Control:**
- Changed from `AdminOnlyRoute` to `AuthenticatedRoute`
- Currently open to all authenticated users
- Ready for future wallet whitelist implementation

**UI Text:**
- All "Admin" references → "Moderator"
- Updated error messages and instructions

### 2. Added Moderator Link to Navbar ✅

- **Location:** Appears for all authenticated users
- **Color:** Purple (to distinguish from other links)
- **Route:** `/moderator`
- **Label:** "Moderator"

### 3. Updated Experience Creation Flow ✅

**Backend Change (`experience_service.py`):**
```python
# Before
"status": ExperienceStatus.DRAFT.value,

# After
"status": ExperienceStatus.SUBMITTED.value,  # Auto-submit for moderator review
```

**What This Means:**
- When a user creates an experience, it's automatically set to "submitted"
- No "draft" mode - all experiences go straight to moderation queue
- User sees immediate feedback that their submission is pending review

### 4. Enforced Approval Requirement ✅

**Already Implemented (`event_run_service.py` lines 65-70):**
```python
# Check if experience is approved
if experience.status != "approved":
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Event runs can only be created for approved experiences",
    )
```

**What This Prevents:**
- Users cannot create event runs for submitted experiences
- Users cannot create event runs for rejected experiences
- Only approved experiences can proceed to event scheduling

---

## 🎯 How It Works Now

### For Users (Experience Creators):

1. **Connect Wallet** → Login automatically
2. **Click "Create Experience"** in navbar
3. **Fill out the 3-step form**
   - Step 1: Basic info (title, domain, duration)
   - Step 2: Location & details
   - Step 3: What to expect & logistics
4. **Submit** → Experience is created with status "submitted"
5. **Auto-upgrade to host** (first time creators)
6. **Wait for moderator approval**
7. **Once approved** → Can create event runs via `/test-contract` or host dashboard

### For Moderators:

1. **Connect Wallet** → Login
2. **Click "Moderator"** in navbar (purple link)
3. **View "Experiences" tab** (default view)
4. **See all submitted experiences**
5. **Click to review** → See full details
6. **Approve or Reject** with feedback
   - **Approve**: Experience becomes available, host can create event runs
   - **Reject**: Send feedback, host sees rejection reason
7. Can also monitor:
   - **Applications tab**: Host applications (auto-approved now)
   - **Event Runs tab**: All scheduled events and bookings

---

## 🔒 Security & Access (Current vs Future)

### Current State (Open for Testing):
```typescript
<AuthenticatedRoute>  // Any connected wallet can access
  <ModeratorDashboard />
</AuthenticatedRoute>
```

### Future State (Wallet Whitelist):
```typescript
const { address } = useAccount();
const MODERATOR_WALLETS = [
  '0xYourWalletAddressHere',  // Add your wallet
  // Add more moderators as needed
];

useEffect(() => {
  if (address && !MODERATOR_WALLETS.includes(address.toLowerCase())) {
    router.push('/');
    setError('Only authorized moderators can access this page');
  }
}, [address]);
```

**To Implement Later:**
1. Add your wallet address to `MODERATOR_WALLETS` array
2. Add the useEffect check at the top of `ModeratorDashboard`
3. Only whitelisted wallets will see moderator features

---

## 📊 Moderator Dashboard Features

### Experiences Tab (Default):
- **View all** submitted experiences
- **Filter** by: All, Submitted, Approved, Rejected
- **Review** full experience details:
  - Title, description, domain
  - Duration, capacity, pricing
  - Location, meeting point
  - Inclusions, safety guidelines
  - What to bring, accessibility notes
- **Actions:**
  - ✅ Approve with feedback
  - ❌ Reject with detailed reason

### Applications Tab:
- Host application reviews
- Currently auto-approved
- Mostly empty for now

### Event Runs Tab:
- All scheduled events
- Booking details
- Attendance tracking
- Event status monitoring

---

## 🎨 UI/UX Updates

### User Feedback:
- **On Create:** "Experience submitted for review"
- **On Host Dashboard:** Shows status badges (Submitted, Approved, Rejected)
- **On Event Run Creation:** Error if trying to use unapproved experience

### Moderator Experience:
- Clean, organized interface
- One-click approve/reject
- Feedback forms for rejections
- Real-time status updates

---

## 🧪 Testing the Flow

### Test as User:
```bash
1. Go to frontend
2. Connect wallet (any address)
3. Click "Create Experience"
4. Fill form and submit
5. Go to "My Experiences"
6. See status: "Submitted" (yellow badge)
7. Try to create event run → Error (not approved yet)
```

### Test as Moderator:
```bash
1. Connect wallet (any address for now)
2. Click "Moderator" in navbar
3. See submitted experiences
4. Click on one to review
5. Click "Approve Experience"
6. See status change to "Approved"
```

### Test Event Run Creation:
```bash
1. After approval, go back to "My Experiences"
2. Now see status: "Approved" (green badge)
3. Can now create event runs
4. Go to `/test-contract` or host dashboard
5. Create event run successfully
```

---

## 📝 Database Schema

No changes needed! Uses existing columns:
- `experiences.status` - ENUM('draft', 'submitted', 'approved', 'rejected')
- `experiences.admin_feedback` - TEXT (moderator feedback)
- All existing columns work as-is

---

## 🚀 Ready to Use

Everything is implemented and working:
- ✅ Moderator dashboard accessible at `/moderator`
- ✅ Experiences auto-submit for review
- ✅ Only approved experiences can create event runs
- ✅ Moderation workflow enforced by backend
- ✅ Clean UI for both users and moderators

### Next Steps (Optional):
1. Add wallet whitelist for moderator access
2. Add email notifications for approval/rejection
3. Add analytics/metrics on moderator dashboard
4. Add bulk approve/reject features

**The moderation system is fully functional!** 🎉

