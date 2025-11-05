# Mayhouse User Flows - Quick Reference

## Overview

Mayhouse is a Web3-enabled travel experiences marketplace connecting travelers with local hosts. The platform uses blockchain for payments and stake management, while keeping experience data in a traditional database.

## User Types

1. **Traveler**: Books and attends experiences
2. **Host**: Creates and manages experiences
3. **Admin**: Reviews applications and experiences

---

## Core User Journeys

### 🔵 Traveler Journey

```
1. Connect Wallet
   ↓
2. Browse Experiences (Public)
   ↓
3. View Event Run Details
   ↓
4. Book Event Run
   ├─ Calculate Cost (Backend API)
   ├─ Pay via Smart Contract (ETH + 20% Stake)
   └─ Record Booking (Backend)
   ↓
5. Attend Event
   ↓
6. Host Marks Attendance
   ↓
7. Receive Stake Refund (Smart Contract)
```

**Key Endpoints**:
- `POST /auth/wallet/nonce` - Get nonce for signing
- `POST /auth/wallet/verify` - Verify signature, get JWT
- `GET /explore/` - Browse available experiences
- `POST /blockchain/calculate-booking-cost` - Calculate payment
- `POST /bookings/record-blockchain` - Record booking (TODO)

---

### 🟢 Host Journey

```
1. Apply to Become Host
   ├─ Check Eligibility
   ├─ Review Legal Documents
   ├─ Sign Policies (EIP-712)
   └─ Submit Application
   ↓
2. Admin Approves Application
   ↓
3. Create Experience
   ├─ Fill Experience Form
   ├─ Save as Draft / Submit
   └─ Wait for Admin Review
   ↓
4. Admin Approves Experience
   ↓
5. Create Event Runs
   ├─ Schedule Date/Time
   ├─ Set Capacity (1-4 travelers)
   └─ Optionally Sync to Blockchain
   ↓
6. Travelers Book Your Events
   ↓
7. Event Occurs
   ↓
8. Complete Event
   ├─ Mark Attendees
   ├─ Call Smart Contract
   └─ Stake Distribution (Attendees get refund, No-shows forfeit)
```

**Key Endpoints**:
- `GET /users/host-application/eligibility` - Check eligibility
- `POST /users/host-application` - Submit application
- `POST /experiences` - Create experience
- `POST /experiences/{id}/submit` - Submit for review
- `POST /hosts/event-runs` - Create event run
- `POST /blockchain/complete-event` - Complete event

---

### 🔴 Admin Journey

```
1. Review Host Applications
   ├─ View Pending Applications
   ├─ Review Application Details
   ├─ Approve or Reject
   └─ Provide Feedback
   ↓
2. Review Experiences
   ├─ View Submitted Experiences
   ├─ Review Content & Safety
   ├─ Approve or Reject
   └─ Provide Structured Feedback
   ↓
3. Monitor Platform
   ├─ View Statistics
   ├─ Track Activity
   └─ Manage Issues
```

**Key Endpoints**:
- `GET /admin/host-applications` - List applications
- `POST /admin/host-applications/{id}/review` - Review application
- `GET /admin/experiences` - List experiences
- `POST /admin/experiences/{id}/review` - Review experience
- `GET /admin/*/stats` - View statistics

---

## Authentication Flow

**Wallet-Based Authentication**:
1. User connects wallet (MetaMask, etc.)
2. Backend generates nonce + message
3. User signs message in wallet
4. Backend verifies signature
5. Backend returns JWT token (7-day expiry)
6. Frontend stores token for authenticated requests

**No Password Required**: Pure Web3 authentication via wallet signatures

---

## Booking & Payment Flow

**Hybrid Architecture**:
- **Event Runs**: Stored in database (off-chain)
- **Bookings**: Recorded on blockchain (on-chain)
- **Payments**: Handled by smart contract

**Payment Breakdown**:
- Ticket Price: Paid to host immediately
- Stake (20%): Held in contract, refundable if attended
- Platform Fee (5%): Deducted from host payment

**Smart Contract Functions**:
- `createBooking()` - Book event, pay ticket + stake
- `completeBooking()` - Mark attended, return stake
- `markNoShow()` - Mark no-show, forfeit stake

---

## Status Lifecycles

### Experience Status
```
draft → submitted → approved ✅ / rejected ❌
                    ↓
                  archived (optional)
```

### Event Run Status
```
scheduled → low_seats → sold_out
         ↓
      completed / cancelled
```

### Booking Status
```
confirmed → experience_completed ✅
          → no_show ❌
          → cancelled 🔄
```

### Host Application Status
```
pending → approved ✅ / rejected ❌
```

---

## Key Features

### 1. EIP-712 Policy Signing
- Legally compliant policy acceptances
- Signed with wallet (non-repudiable)
- Required for host applications

### 2. Blockchain Payments
- Trustless payment system
- 20% refundable stake mechanism
- Automatic stake distribution

### 3. Experience Approval Workflow
- Host creates → Admin reviews → Approved experiences available

### 4. Intimate Experiences
- Maximum 4 travelers per event
- Small group experiences
- Personal connection with hosts

---

## API Structure

### Public Endpoints (No Auth)
- `GET /explore/` - Browse experiences
- `GET /event-runs/{id}` - View event run details
- `GET /health/` - Health check

### Authenticated Endpoints (JWT Required)
- `GET /auth/me` - Current user profile
- `GET /experiences/my` - Host's experiences
- `GET /hosts/event-runs` - Host's event runs
- `POST /bookings/*` - Booking operations

### Admin Endpoints (Admin Role Required)
- `GET /admin/*` - Admin operations
- `POST /admin/*/review` - Review operations

---

## Technical Stack

**Backend**:
- FastAPI (Python)
- Supabase (PostgreSQL database)
- Web3.py (Blockchain integration)
- JWT (Authentication)

**Blockchain**:
- Ethereum Sepolia (Testnet)
- Smart Contract: `MayhouseBooking.sol`
- Web3 wallet integration

**Frontend**:
- Next.js (React)
- Wallet integration (MetaMask, WalletConnect)
- Web3.js / Ethers.js

---

## Common Use Cases

### Use Case 1: First-Time Traveler
**Goal**: Book first experience

1. Connect wallet → Get JWT token
2. Browse explore page → Find interesting experience
3. Click event run → View details
4. Select seats → Calculate cost
5. Approve transaction → Pay ticket + stake
6. Receive confirmation → Wait for event
7. Attend event → Host marks attendance
8. Receive stake refund → Experience completed

**Time**: ~5 minutes (excluding event attendance)

---

### Use Case 2: Host Creates First Experience
**Goal**: Host creates and publishes first experience

1. Connect wallet → Authenticate
2. Apply to become host → Sign policies
3. Wait for admin approval → Get host role
4. Create experience → Fill form
5. Submit for review → Wait for admin
6. Admin approves → Experience published
7. Create event run → Schedule dates
8. Travelers can now book → Start earning

**Time**: ~2-3 days (includes review time)

---

### Use Case 3: Admin Reviews Batch
**Goal**: Admin reviews 10 pending items

1. Login as admin → Access admin dashboard
2. View pending host applications → Review and approve/reject
3. View submitted experiences → Review and approve/reject
4. Provide feedback → Users notified
5. Monitor statistics → Track platform health

**Time**: ~30-60 minutes for 10 items

---

## Data Flow Diagrams

### Booking Flow
```
Traveler                  Frontend              Backend            Blockchain
   │                         │                     │                   │
   │─── Browse ──────────────>│                     │                   │
   │<── Event Runs ──────────│                     │                   │
   │                         │                     │                   │
   │─── Calculate Cost ─────>│─── POST ───────────>│                   │
   │                         │   /blockchain/      │                   │
   │                         │   calculate-cost   │                   │
   │<── Cost Breakdown ──────│<── Response ───────│                   │
   │                         │                     │                   │
   │─── Approve Payment ────>│─── createBooking() ──────────────────>│
   │                         │                     │                   │
   │                         │                     │<── Booking ID ───│
   │<── Confirmation ────────│<── Tx Hash ─────────│                   │
   │                         │                     │                   │
   │                         │─── Record ─────────>│                   │
   │                         │   Booking          │                   │
```

### Experience Creation Flow
```
Host                     Frontend              Backend            Database
  │                         │                     │                   │
  │─── Create ──────────────>│─── POST ───────────>│                   │
  │   Experience            │   /experiences      │                   │
  │                         │                     │                   │
  │                         │                     │─── INSERT ───────>│
  │                         │                     │   (draft)         │
  │<── Experience ──────────│<── Response ───────│<── UUID ──────────│
  │                         │                     │                   │
  │─── Submit ──────────────>│─── POST ───────────>│                   │
  │   for Review            │   /experiences/     │                   │
  │                         │   {id}/submit      │                   │
  │                         │                     │─── UPDATE ───────>│
  │                         │                     │   (submitted)     │
  │<── Updated ─────────────│<── Response ───────│                   │
```

---

## Next Steps

### Implementation Priorities

1. **High Priority**:
   - ✅ Wallet authentication
   - ✅ Experience creation
   - ✅ Event run creation
   - ⏳ Booking recording API
   - ⏳ Booking history

2. **Medium Priority**:
   - ✅ Host applications
   - ✅ Admin reviews
   - ⏳ Earnings dashboard
   - ⏳ Notifications

3. **Low Priority**:
   - ⏳ Reviews & ratings
   - ⏳ Advanced search
   - ⏳ Recommendations

---

## Resources

- **Full User Flows**: See `USER_FLOWS.md`
- **API Documentation**: `http://localhost:8000/docs`
- **Blockchain Integration**: See `BLOCKCHAIN_INTEGRATION.md`
- **Testing Guide**: See `TESTING_GUIDE.md`

---

**Last Updated**: 2024-01-XX
**Version**: 1.0

