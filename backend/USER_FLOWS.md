# Mayhouse User Flows Documentation

## Overview

This document defines all user flows for the Mayhouse platform - a Web3-enabled travel experiences marketplace. The platform supports three main user types: **Travelers**, **Hosts**, and **Admins**.

---

## Table of Contents

1. [Traveler Flows](#traveler-flows)
2. [Host Flows](#host-flows)
3. [Admin Flows](#admin-flows)
4. [Shared Flows](#shared-flows)
5. [Technical Implementation Notes](#technical-implementation-notes)

---

## Traveler Flows

### Flow 1: First-Time User Onboarding

**Goal**: New user connects wallet and creates account

**Steps**:
1. User lands on homepage/explore page
2. User clicks "Connect Wallet" or "Get Started"
3. User selects wallet provider (MetaMask, WalletConnect, etc.)
4. User approves connection
5. Frontend calls `POST /auth/wallet/nonce` with wallet address
6. Backend generates nonce and message to sign
7. User signs message in wallet
8. Frontend calls `POST /auth/wallet/verify` with signature
9. Backend verifies signature and creates/retrieves user account
10. Backend returns JWT token (valid for 7 days)
11. Frontend stores token and redirects to explore page

**API Endpoints**:
- `POST /auth/wallet/nonce` → `WalletNonceResponse`
- `POST /auth/wallet/verify` → `WalletAuthResponse`

**Backend Logic**:
- Auto-generates elegant username (e.g., "Odyssey247")
- Creates user record with wallet_address
- Role defaults to "user"
- No email required (wallet-based auth)

**Edge Cases**:
- Wallet already connected → Skip to step 8
- Signature verification fails → Show error, retry
- Nonce expired → Generate new nonce

---

### Flow 2: Browse Available Experiences

**Goal**: Traveler discovers upcoming event runs

**Steps**:
1. User navigates to explore page (no auth required)
2. Frontend calls `GET /explore/` with optional filters
3. Backend returns list of upcoming event runs
4. User can filter by:
   - Domain (food, art, culture, etc.)
   - Neighborhood
   - Date range
   - Price range
5. User clicks on an event run to view details

**API Endpoints**:
- `GET /explore/` → `List[ExploreEventRun]`
- `GET /explore/{experience_id}` → Experience details
- `GET /event-runs/{event_run_id}` → Event run details

**Query Parameters**:
```typescript
{
  domain?: string;
  neighborhood?: string;
  limit?: number; // default 50
  offset?: number; // default 0
}
```

**Backend Logic**:
- Only shows approved experiences
- Only shows event runs starting from now
- Sorted by start time (soonest first)
- Includes full experience and host details

---

### Flow 3: Book an Event Run

**Goal**: Traveler books and pays for an experience

**Steps**:
1. User views event run details page
2. User selects number of seats (1-4)
3. Frontend calls `POST /blockchain/calculate-booking-cost`:
   ```json
   {
     "event_run_id": "uuid",
     "seat_count": 2
   }
   ```
4. Backend calculates:
   - Ticket price (price_per_seat × seat_count)
   - Stake (20% of ticket price)
   - Total cost (ticket + stake)
   - All amounts in both INR and Wei
5. Backend returns cost breakdown
6. Frontend displays cost summary to user
7. User clicks "Book Now" and confirms in wallet
8. Frontend calls smart contract `createBooking()`:
   ```solidity
   createBooking(
     hostWalletAddress,    // From event run
     eventRunUUID,         // Database UUID
     ticketPriceWei,       // From calculation
     seatCount,            // User selected
     eventTimestamp        // From event run
   )
   ```
9. User approves transaction in wallet (pays ticket + stake)
10. Smart contract:
    - Creates booking record
    - Transfers ticket price to host immediately
    - Holds 20% stake in contract
    - Returns blockchain booking ID
11. Frontend receives transaction hash and booking ID
12. **[TODO]** Frontend calls `POST /bookings/record-blockchain`:
    ```json
    {
      "event_run_id": "uuid",
      "blockchain_booking_id": 123,
      "transaction_hash": "0x...",
      "user_address": "0x...",
      "seat_count": 2,
      "ticket_price_wei": 1000000000000000,
      "stake_wei": 200000000000000
    }
    ```
13. Backend creates booking record linking database event run ↔ blockchain booking
14. User sees confirmation page with booking details

**API Endpoints**:
- `POST /blockchain/calculate-booking-cost` → `BookingCostResponse`
- `POST /bookings/record-blockchain` → Booking record (TODO)

**Smart Contract**:
- `MayhouseBooking.sol::createBooking()`
- Payment: Ticket price → Host immediately
- Stake: 20% held in contract (refundable if attended)

**Backend Logic**:
- Converts INR to Wei using live ETH price (CoinGecko API)
- Caches ETH price for 60 seconds
- Validates event run exists and has capacity
- Records blockchain transaction details

**Edge Cases**:
- Insufficient ETH → Show error, suggest adding funds
- Event sold out → Update UI, disable booking
- Transaction fails → Show error, allow retry
- Event cancelled → Show cancellation notice

---

### Flow 4: Attend Event & Receive Stake Back

**Goal**: Traveler attends event and receives refundable stake

**Steps**:
1. Event date arrives
2. Host marks attendance after event completes
3. Host calls `POST /blockchain/complete-event`:
   ```json
   {
     "event_run_id": "uuid",
     "attended_booking_ids": ["booking-id-1", "booking-id-2"]
   }
   ```
4. Backend:
   - Maps database booking IDs → blockchain booking IDs
   - Calls smart contract `completeBooking()` for each attended booking
5. Smart contract:
   - For attended bookings: Returns stake to traveler
   - For no-shows: Stake remains in contract (host gets it)
   - Updates booking status
6. Backend updates database booking statuses
7. Traveler receives stake refund in wallet
8. **[TODO]** Frontend shows booking history with status

**API Endpoints**:
- `POST /blockchain/complete-event` → `CompleteEventResponse`
- `GET /bookings/my` → List user bookings (TODO)

**Smart Contract**:
- `MayhouseBooking.sol::completeBooking(bookingId)`
- Stake returned to traveler wallet

**Edge Cases**:
- Host marks wrong attendees → Admin can correct
- No-show → Stake forfeited to host
- Event cancelled → Full refund (ticket + stake)

---

### Flow 5: View My Bookings

**Goal**: Traveler views their booking history

**Steps**:
1. User navigates to "My Bookings" page
2. Frontend calls `GET /bookings/my` (requires auth)
3. Backend returns all bookings for authenticated user
4. User sees:
   - Upcoming events
   - Past events
   - Booking status (confirmed, completed, no-show, cancelled)
   - Payment status
   - Stake status

**API Endpoints**:
- `GET /bookings/my` → `List[BookingResponse]` (TODO)

**Backend Logic**:
- Filters by authenticated user ID from JWT
- Includes event run and experience details
- Shows blockchain transaction links

---

## Host Flows

### Flow 6: Become a Host (Application Process)

**Goal**: User applies to become a host

**Steps**:
1. User clicks "Become a Host" button
2. Frontend calls `GET /users/host-application/eligibility`
3. Backend checks:
   - User is not already a host
   - No pending application exists
   - No recent rejection (< 30 days)
4. If eligible, frontend shows application form
5. Frontend fetches required legal documents:
   - `GET /legal/host-application/documents`
6. User reviews:
   - Terms & Conditions
   - Background Verification Policy
   - Host Agreement
7. User signs policies using EIP-712錄:
   - Frontend calls `POST /legal/eip712/prepare-bulk-signature`
   - User signs in wallet
   - Frontend calls `POST /legal/eip712/verify-signature`
8. User completes application form:
   - Experience domains
   - Sample experience idea
   - Availability preferences
   - Background information
9. User submits application:
   - Frontend calls `POST /users/host-application`
10. Backend creates application record with status "pending"
11. User sees confirmation and "Under Review" status

**API Endpoints**:
- `GET /users/host-application/eligibility` → Eligibility check
- `GET /legal/host-application/documents` → Legal documents bundle
- `POST /legal/eip712/prepare-bulk-signature` → EIP-712 structured data
- `POST /legal/eip712/verify-signature` → Policy acceptance record
- `POST /users/host-application` → `HostApplicationResponse`

**Backend Logic**:
- Validates user eligibility
- Requires EIP-712 signed policies before submission
- Stores application with structured feedback fields
- Auto-updates user status to "host" when approved (done by admin)

**Edge Cases**:
- Already a host → Show "You're already a host" message
- Pending application → Show application status
- Recent rejection → Show cooldown period remaining

---

### Flow 7: Create an Experience

**Goal**: Host creates a new experience listing

**Steps**:
1. Host navigates to "Create Experience" page
2. Host fills out experience form:
   - **Core Details**:
     - Title (10-200 chars)
     - Promise (2-line compelling promise, 20-200 chars)
     - Description (100-2000 chars)
     - Unique element (50-500 chars)
     - Host story (50-1000 chars)
   - **Categorization**:
     - Domain (food, art, culture, etc.)
     - Theme (optional)
   - **Location**:
     - Country (default: India)
     - City (default: Mumbai)
     - Neighborhood
     - Meeting landmark
     - Meeting point details
   - **Logistics**:
     - Duration (30 min - 8 hours)
     - Min capacity (default: 1)
     - Max capacity (1-4 travelers)
     - Price in INR
   - **Content**:
     - Inclusions (what's included)
     - What travelers should bring
     - Accessibility notes
     - Weather contingency plan
     - Safety guidelines
     - Photo sharing consent required (default: true)
3. Host clicks "Save as Draft" or "Submit for Review"
4. Frontend calls `POST /experiences`:
   ```json
   {
     "title": "...",
     "promise": "...",
     "description": "...",
     // ... all fields
   }
   ```
5. Backend:
   - Auto-upgrades user to "host" role if not already
   - Creates experience with status "draft"
   - If "Submit for Review" clicked, auto-submits (status → "submitted")
6. Host sees experience in "My Experiences" dashboard

**API Endpoints**:
- `POST /experiences` → `ExperienceResponse`
- `GET /experiences/my` → `List[ExperienceSummary]`

**Backend Logic**:
- Validates all required fields
- Auto-upgrades user to host role on first experience
- Experience starts as "draft" by default
- Can auto-submit if host clicks "Submit"

**Edge Cases**:
- Validation errors → Show field-specific errors
- User not authenticated → Redirect to login
- Max capacity < min capacity → Show validation error

---

### Flow 8: Submit Experience for Review

**Goal**: Host submits draft experience for admin approval

**Steps**:
1. Host views experience in "My Experiences"
2. Host clicks "Submit for Review" on draft experience
3. Frontend calls `POST /experiences/{id}/submit`:
   ```json
   {
     "submission_data": {
       "submission_notes": "Optional notes for admin",
       "ready_for_review": true
     }
   }
   ```
4. Backend validates:
   - Experience is in "draft" status
   - All required fields completed
5. Backend updates status to "submitted"
6. Host sees "Under Review" status

**API Endpoints**:
- `POST /experiences/{id}/submit` → `ExperienceResponse`

**Backend Logic**:
- Only allows submission from "draft" status
- Validates completeness
- Stores submission notes

**Edge Cases**:
- Already submitted → Show current status
- Missing required fields → Show validation errors
- Already approved/rejected → Show appropriate message

---

### Flow 9: Create Event Run

**Goal**: Host schedules an instance of their approved experience

**Steps**:
1. Host navigates to approved experience
2. Host clicks "Schedule Event Run"
3. Host fills out event run form:
   - Experience (pre-selected)
   - Start date/time (must be future)
   - End date/time (must be after start)
   - Max capacity (1-4 travelers)
   - Special pricing (optional override)
   - Meeting instructions (optional)
   - Group pairing enabled (optional)
4. Host clicks "Create Event Run"
5. Frontend calls `POST /hosts/event-runs`:
   ```json
   {
     "experience_id": "uuid",
     "start_datetime": "2025-11-15T10:00:00Z",
     "end_datetime": "2025-11-15T13:00:00Z",
     "max_capacity": 4,
     "special_pricing_inr": null,
     "host_meeting_instructions": "Look for red cap",
     "group_pairing_enabled": true
   }
   ```
6. Backend validates:
   - Experience is approved
   - Host owns the experience
   - Start time is in future
   - End time is after start
7. Backend creates event run in database with status "scheduled"
8. **[Optional]** Backend syncs to blockchain (if enabled):
   - Calls `blockchain_service.create_event_run_onchain()`
   - Stores `blockchain_event_run_id` and `tx_hash`
9. Backend returns event run details
10. Host sees event run in "My Event Runs" list

**API Endpoints**:
- `POST /hosts/event-runs` → `EventRunResponse`
- `GET /hosts/event-runs` → `List[EventRunSummary]`

**Backend Logic**:
- Validates experience ownership
- Validates datetime constraints
- Sets status to "scheduled"
- Optionally syncs to blockchain (for tracking)

**Edge Cases**:
- Experience not approved → Show error
- Past date → Show validation error
- End before start → Show validation error
- No approved experiences → Show "Create experience first" message

---

### Flow 10: Complete Event & Mark Attendance

**Goal**: Host marks which travelers attended after event completes

**Steps**:
1. Event date/time passes
2. Host navigates to event run details
3. Host sees list of all bookings
4. Host marks which travelers attended:
   - Checkboxes for each booking
   - Or "Mark All Attended" button
5. Host clicks "Complete Event"
6. Frontend calls `POST /blockchain/complete-event`:
   ```json
   {
     "event_run_id": "uuid",
     "attended_booking_ids": ["booking-1", "booking-2"]
   }
   ```
7. Backend:
   - Fetches all bookings for event run
   - Maps database booking IDs → blockchain booking IDs
   - Calls smart contract `completeBooking()` for each attended booking
8. Smart contract:
   - For each attended booking:
     - Returns 20% stake to traveler wallet
     - Updates booking status to "completed"
   - For no-show bookings:
     - Stake remains in contract (host can withdraw)
     - Updates booking status to "no_show"
9. Backend updates database:
   - Event run status → "completed"
   - Booking statuses updated
10. Host sees completion confirmation with:
    - Number of attendees
    - Number of no-shows
    - Transaction hash

**API Endpoints**:
- `POST /blockchain/complete-event` → `CompleteEventResponse`
- `GET /hosts/event-runs/{id}` → `EventRunResponse` (with bookings)

**Smart Contract**:
- `MayhouseBooking.sol::completeBooking(bookingId)`
- Returns stake to traveler

**Backend Logic**:
- Validates host ownership
- Maps database ↔ blockchain IDs
- Updates both database and blockchain state

**Edge Cases**:
- No bookings → Show "No bookings" message
- All no-shows → Stake stays in contract
- Event cancelled → Different flow (full refunds)

---

### Flow 11: View Host Dashboard

**Goal**: Host views their experiences, event runs, and earnings

**Steps**:
1. Host navigates to "Host Dashboard"
2. Frontend calls multiple endpoints:
   - `GET /experiences/my` → Experiences list
   - `GET /hosts/event-runs` → Event runs list
   - `GET /hosts/stats` → Host statistics (TODO)
3. Host sees:
   - **Experiences**:
     - Draft (can edit/submit)
     - Submitted (under review)
     - Approved (can create event runs)
     - Rejected (can edit and resubmit)
   - **Event Runs**:
     - Scheduled (upcoming)
     - Low seats (warning)
     - Sold out
     - Completed
     - Cancelled
   - **Statistics**:
     - Total bookings
     - Total earnings
     - Upcoming events count

**API Endpoints**:
- `GET /experiences/my?status_filter=draft` → Draft experiences
- `GET /hosts/event-runs?status_filter=scheduled` → Scheduled runs
- `GET /hosts/stats` → Host statistics (TODO)

---

## Admin Flows

### Flow 12: Review Host Application

**Goal**: Admin reviews and approves/rejects host applications

**Steps**:
1. Admin navigates to "Host Applications" page
2. Frontend calls `GET /admin/host-applications?status_filter=pending`
3. Admin sees list of pending applications
4. Admin clicks on an application to review
5. Frontend calls `GET /admin/host-applications/{id}`
6. Admin reviews:
   - Application details
   - User background
   - Sample experience idea
   - Policy acceptances (EIP-712 signed)
7. Admin makes decision:
   - **Approve**: Upgrade user to "host" role
   - **Reject**: Provide feedback, user can reapply after 30 days
8. Admin fills out review form:
   ```json
   {
     "decision": "approved", // or "rejected"
     "admin_feedback": "General notes",
     "structured_feedback": {
       "decision_reason": "Strong application...",
       "content_quality_notes": "...",
       "safety_concerns": [],
       "improvement_suggestions": [],
       "pricing_feedback": null,
       "next_steps": "Start creating experiences"
     }
   }
   ```
9. Admin clicks "Submit Review"
10. Frontend calls `POST /admin/host-applications/{id}/review`
11. Backend:
    - Updates application status
    - If approved: Updates user role to "host"
    - Stores review details and timestamps
12. User receives notification (email/in-app)

**API Endpoints**:
- `GET /admin/host-applications` → `List[HostApplicationSummary]`
- `GET /admin/host-applications/{id}` → `HostApplicationResponse`
- `POST /admin/host-applications/{id}/review` → `HostApplicationResponse`

**Backend Logic**:
- Only allows reviewing "pending" applications
- Auto-upgrades user role on approval
- Records admin ID and timestamp
- Stores structured feedback

---

### Flow 13: Review Experience

**Goal**: Admin reviews and approves/rejects experience submissions

**Steps**:
1. Admin navigates to "Experiences" page
2. Frontend calls `GET /admin/experiences?status_filter=submitted`
3. Admin sees list of submitted experiences
4. Admin clicks on an experience to review
5. Frontend calls `GET /admin/experiences/{id}`
6. Admin reviews:
   - Experience content (title, description, promise)
   - Location and logistics
   - Pricing and capacity
   - Safety guidelines
   - Host information
7. Admin makes decision:
   - **Approve**: Experience becomes available for booking
   - **Reject**: Provide feedback, host can edit and resubmit
8. Admin fills out review form:
   ```json
   {
     "decision": "approved",
     "admin_feedback": "Great experience idea!",
     "structured_feedback": {
       "decision_reason": "Well-documented and safe",
       "content_quality_notes": "Excellent descriptions",
       "safety_concerns": [],
       "improvement_suggestions": ["Add more photos"],
       "pricing_feedback": "Price is competitive",
       "next_steps": "Start creating event runs"
     }
   }
   ```
9. Admin clicks "Submit Review"
10. Frontend calls `POST /admin/experiences/{id}/review`
11. Backend:
    - Updates experience status
    - Stores review details
    - Records approval timestamp
12. Host receives notification

**API Endpoints**:
- `GET /admin/experiences?status_filter=submitted` → `List[ExperienceSummary]`
- `GET /admin/experiences/{id}` → `ExperienceResponse`
- `POST /admin/experiences/{id}/review` → `ExperienceResponse`

**Backend Logic**:
- Only allows reviewing "submitted" experiences
- Stores comprehensive feedback
- Records admin ID and timestamp

---

### Flow 14: Monitor Platform Activity

**Goal**: Admin views platform statistics and monitors activity

**Steps**:
1. Admin navigates to "Admin Dashboard"
2. Frontend calls statistics endpoints:
   - `GET /admin/experiences/stats` → Experience statistics
   - `GET /admin/event-runs/stats` → Event run statistics
   - `GET /admin/host-applications/stats` → Application statistics
3. Admin sees:
   - **Experiences**:
     - Total experiences
     - By status (draft, submitted, approved, rejected)
     - Monthly trends
     - Average approval time
   - **Event Runs**:
     - Total runs
     - By status
     - Capacity utilization
     - Upcoming runs (next 7 days)
   - **Host Applications**:
     - Total applications
     - By status
     - Monthly trends
     - Average review time

**API Endpoints**:
- `GET /admin/experiences/stats` → `ExperienceStats`
- `GET /admin/event-runs/stats` → `EventRunStats`
- `GET /admin/host-applications/stats` → `HostApplicationStats`

---

## Shared Flows

### Flow 15: View Current User Profile

**Goal**: User views their own profile information

**Steps**:
1. User clicks "Profile" or "My Account"
2. Frontend calls `GET /auth/me` (requires auth)
3. Backend returns current user information:
   ```json
   {
     "id": "uuid",
     "wallet_address": "0x...",
     "full_name": "User 0x1234...0x5678",
     "email": null,
     "role": "user", // or "host", "admin"
     "username": "Odyssey247",
     "created_at": "2024-01-01T00:00:00Z"
   }
   ```
4. User sees:
   - Wallet address
   - Username
   - Role
   - Account creation date
   - Profile photo (if uploaded)

**API Endpoints**:
- `GET /auth/me` → User profile

**Backend Logic**:
- Extracts user ID from JWT token
- Returns user data from database
- Includes wallet address for Web3 operations

---

### Flow 16: Upload Experience Photos

**Goal**: Host uploads photos for their experience

**Steps**:
1. Host navigates to experience edit page
2. Host clicks "Add Photos"
3. Host selects photo files (multiple allowed)
4. Frontend uploads photos:
   - `POST /experiences/{id}/photos` (multipart/form-data)
5. Backend:
   - Validates file types and sizes
   - Uploads to storage (Supabase Storage or S3)
   - Creates photo records in database
   - Links photos to experience
6. Host sees photos in experience gallery

**API Endpoints**:
- `POST /experiences/{id}/photos` → Photo upload
- `GET /experiences/{id}/photos` → List photos

**Backend Logic**:
- Validates file uploads
- Stores in cloud storage
- Creates database records with URLs

---

## Technical Implementation Notes

### Authentication Flow

**JWT Token Structure**:
```json
{
  "sub": "user-uuid",
  "wallet_address": "0x...",
  "role": "user",
  "exp": 1234567890
}
```

**Token Storage**:
- Frontend stores in localStorage or memory
- Sent in `Authorization: Bearer <token>` header
- Valid for 7 days

### Blockchain Integration

**Smart Contracts**:
- `MayhouseBooking.sol`: Handles bookings and payments
- Uses event run UUIDs (not on-chain IDs)
- Payment: Ticket price → Host immediately
- Stake: 20% held, refundable if attended

**Currency Conversion**:
- Backend uses CoinGecko API for live ETH price
- Caches price for 60 seconds
- Converts INR → Wei for blockchain transactions

**Transaction Flow**:
1. Frontend calculates cost via backend API
2. Frontend calls smart contract directly
3. Backend records transaction details
4. Backend maps database ↔ blockchain IDs

### Database Schema

**Key Tables**:
- `users`: User accounts (wallet-based)
- `experiences`: Experience listings
- `event_runs`: Scheduled experience instances
- `event_run_bookings`: Bookings (links to blockchain)
- `host_applications`: Host application submissions
- `policy_acceptances`: EIP-712 signed policies

**Status Enums**:
- Experience: `draft`, `submitted`, `approved`, `rejected`, `archived`
- Event Run: `scheduled`, `low_seats`, `sold_out`, `completed`, `cancelled`
- Booking: `confirmed`, `experience_completed`, `no_show`, `cancelled`
- Host Application: `pending`, `approved`, `rejected`

### Error Handling

**Common Errors**:
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `400 Bad Request`: Validation errors
- `500 Internal Server Error`: Server error

**Error Response Format**:
```json
{
  "detail": "Error message",
  "error": "error_code",
  "status_code": 400
}
```

### API Rate Limiting

**Current Status**: Not implemented (TODO)

**Recommendations**:
- Rate limit by IP address
- Rate limit by wallet address
- Different limits for authenticated vs anonymous
- Consider Redis for rate limiting

---

## Future Enhancements

### Planned Features

1. **Booking Management API**:
   - `POST /bookings/record-blockchain` - Record blockchain bookings
   - `GET /bookings/my` - User booking history
   - `GET /bookings/{id}` - Booking details

2. **Host Earnings Dashboard**:
   - `GET /hosts/earnings` - Total earnings
   - `GET /hosts/earnings/history` - Earnings history
   - `GET /hosts/payouts` - Payout information

3. **Notifications System**:
   - In-app notifications
   - Email notifications (optional)
   - Push notifications (future)

4. **Reviews & Ratings**:
   - Traveler reviews after event
   - Host ratings
   - Experience ratings

5. **Cancellation & Refunds**:
   - Cancel booking before event
   - Automatic refunds via smart contract
   - Cancellation policies

6. **Search & Discovery**:
   - Advanced search filters
   - Recommendation engine
   - Personalized suggestions

---

## Testing Checklist

### Traveler Flows
- [ ] Wallet connection and authentication
- [ ] Browse experiences without auth
- [ ] Book event run with payment
- [ ] Receive stake refund after attendance
- [ ] View booking history

### Host Flows
- [ ] Submit host application
- [ ] Sign legal policies (EIP-712)
- [ ] Create experience
- [ ] Submit experience for review
- [ ] Create event run
- [ ] Complete event and mark attendance
- [ ] View host dashboard

### Admin Flows
- [ ] Review host applications
- [ ] Review experiences
- [ ] View platform statistics
- [ ] Monitor activity

### Edge Cases
- [ ] Insufficient ETH for booking
- [ ] Event sold out
- [ ] Transaction failures
- [ ] Invalid signatures
- [ ] Expired tokens
- [ ] Network errors

---

## Documentation Updates

**Last Updated**: 2024-01-XX

**Next Review**: After implementing booking management API

**Maintainer**: Backend Team

---

## Questions & Clarifications

If you have questions about any flow, please:
1. Check this document first
2. Review API endpoint documentation (`/docs`)
3. Check backend code comments
4. Ask team for clarification

