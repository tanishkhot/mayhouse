# Booking & Payment Flow Analysis

**Last Updated**: 2024  
**Status**: Current State Assessment

This document provides a comprehensive analysis of the booking flow and payment integration, including what's implemented, what's missing, and recommended next steps.

---

## Table of Contents

1. [Current Booking Flow](#current-booking-flow)
2. [Payment System Status](#payment-system-status)
3. [Database Schema](#database-schema)
4. [What's Implemented](#whats-implemented)
5. [What's Missing](#whats-missing)
6. [Issues & Gaps](#issues--gaps)
7. [Recommended Next Steps](#recommended-next-steps)
8. [Technical Details](#technical-details)

---

## Current Booking Flow

### Flow Diagram

```
User clicks "Book Event"
  ↓
Frontend: BookEventButton.tsx
  ↓
1. Calculate Cost: POST /bookings/calculate-cost
   - Returns: price_per_seat, total_price, stake (20%), total_cost
   ↓
2. Create Booking: POST /bookings
   - Validates event run availability
   - Checks seat availability
   - Processes payment (dummy)
   - Creates booking record
   - Updates event run status
   ↓
3. Returns: Booking confirmation with payment details
```

### Backend Endpoints

**Location**: `backend/app/api/bookings.py`

| Endpoint                   | Method | Purpose                                    | Status    |
| -------------------------- | ------ | ------------------------------------------ | --------- |
| `/bookings/calculate-cost` | POST   | Calculate booking cost (price + 20% stake) | ✅ Active |
| `/bookings`                | POST   | Create new booking                         | ✅ Active |
| `/bookings/my`             | GET    | Get user's bookings                        | ✅ Active |
| `/bookings/{id}`           | GET    | Get booking details                        | ✅ Active |

### Frontend Components

**Location**: `frontend/src/components/BookEventButton.tsx`

- Handles booking UI flow
- Fetches cost calculation
- Creates booking via API
- Shows success/error states

---

## Payment System Status

### Current Implementation

**Location**: `backend/app/services/payment_service.py`

**Status**: ⚠️ **Dummy Implementation** (Ready for Razorpay integration)

**Current Behavior**:

- Simulates payment processing (0.5s delay)
- Always returns "completed" status
- Generates dummy payment IDs and transaction IDs
- No actual payment gateway integration

**Payment Flow**:

```
Booking Service → Payment Service
  ↓
process_booking_payment(amount_inr, user_id, booking_id)
  ↓
Returns: {
  payment_id: "dummy_xxx",
  status: "completed",
  amount_inr: 3000.00,
  transaction_id: "TXN_XXX",
  payment_method: "dummy",
  timestamp: "2024-..."
}
```

### Payment Cost Structure

```
Price per seat: ₹1,000
Seats booked: 2
─────────────────────
Total price: ₹2,000 (80%)
Stake (20%): ₹400 (refundable if attended)
─────────────────────
Total cost: ₹2,400
```

**Stake Mechanism**:

- 20% refundable deposit
- Refunded if traveler attends experience
- Forfeited if no-show (not implemented yet)

---

## Database Schema

### Tables

#### 1. `event_run_bookings`

**Purpose**: Stores booking records

**Key Fields**:

- `id` - Booking UUID
- `event_run_id` - Reference to event run
- `traveler_id` - User who made booking
- `traveler_count` - Number of seats (1-4)
- `total_experience_cost_inr` - Total amount (price + stake)
- `booking_status` - Experience lifecycle status
- `booking_type` - "solo" (default, can be updated)
- `booking_created_at` - Timestamp

**Booking Status Values**:

- `confirmed` - Booking created and confirmed
- `cancelled` - Booking cancelled by user
- `no_show` - Traveler didn't attend
- `experience_completed` - Experience completed successfully

#### 2. `payments`

**Purpose**: Stores payment records (separate from bookings)

**Key Fields**:

- `status` - Payment gateway state
- `amount_inr` - Payment amount
- `payment_method` - Payment method used
- `transaction_id` - Gateway transaction ID

**Payment Status Values**:

- `created` - Payment order created
- `attempted` - Payment attempted
- `paid` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

### Separation of Concerns

**Architecture**: Clean separation between booking lifecycle and payment processing

| Table                | Responsibility           | Status Field     | Purpose                              |
| -------------------- | ------------------------ | ---------------- | ------------------------------------ |
| `event_run_bookings` | **Experience Lifecycle** | `booking_status` | Tracks traveler's experience journey |
| `payments`           | **Payment Processing**   | `status`         | Tracks payment gateway state         |

**Benefits**:

- ✅ No data drift - Single source of truth for each status type
- ✅ Clear responsibilities - Booking vs Payment concerns separated
- ✅ Better performance - Indexed status fields
- ✅ Easier debugging - Clear which table owns which status
- ✅ Future-proof - Can extend each status independently

**Reference**: See `docs/booking-payment-separation.md` for detailed architecture

---

## What's Implemented

### ✅ Booking System

1. **Cost Calculation**

   - Calculates price per seat
   - Calculates 20% stake
   - Returns total cost breakdown
   - Handles special pricing vs base price

2. **Booking Creation**

   - Validates event run exists
   - Checks event run availability (status: scheduled/low_seats)
   - Validates seat availability
   - Prevents overbooking
   - Creates booking record
   - Updates event run status (sold_out/low_seats)

3. **Booking Retrieval**

   - Get user's bookings
   - Get booking by ID
   - Includes event run and experience details

4. **Seat Availability**
   - Real-time availability checking
   - Prevents booking more seats than available
   - Updates event run status based on availability

### ✅ Payment System (Dummy)

1. **Payment Processing**

   - Dummy payment processor
   - Simulates payment flow
   - Returns payment details
   - Ready for Razorpay integration

2. **Payment Structure**
   - Payment ID generation
   - Transaction ID generation
   - Payment status tracking
   - Amount tracking

### ✅ Frontend Integration

1. **Booking UI**

   - BookEventButton component
   - Cost calculation display
   - Seat selection (1-4)
   - Booking confirmation flow
   - Error handling

2. **API Integration**
   - BookingsAPI client
   - Cost calculation API calls
   - Booking creation API calls
   - Error handling and user feedback

### ✅ Authentication

- OAuth authentication support
- JWT token validation
- User ID extraction from tokens
- Test mode support (for development)

---

## What's Missing

### ❌ Real Payment Integration

**Status**: Not Implemented

**Missing Components**:

1. **Razorpay Integration**

   - No Razorpay account setup
   - No API keys configured
   - No payment gateway integration

2. **Payment Endpoints**

   - `POST /payments/create-order` - Create Razorpay order
   - `POST /payments/verify` - Verify payment signature
   - `GET /payments/{id}/status` - Check payment status

3. **Payment Flow**

   - Order creation
   - Payment verification
   - Webhook handling for payment events
   - Payment status updates

4. **Payment Records**
   - Payment service doesn't save to `payments` table
   - No link between booking and payment records
   - No payment history tracking

### ❌ Commission & Payout System

**Status**: Not Implemented

**Missing Components**:

1. **Commission Calculation**

   - No 30/70 split logic (platform/host)
   - No commission tracking
   - No tax handling

2. **Payout System**

   - No monthly payout calculation
   - No host payout tracking
   - No payout status management
   - No payout history

3. **Revenue Tracking**
   - No platform revenue tracking
   - No host earnings tracking
   - No financial reporting

### ❌ Advanced Booking Features

**Status**: Partially Implemented

**Missing Components**:

1. **Cancellation Flow**

   - No cancellation endpoint
   - No cancellation policy enforcement
   - No cancellation fee calculation

2. **Refund Processing**

   - No refund endpoint
   - No refund policy implementation
   - No partial refund handling
   - No automatic refund on cancellation

3. **Booking Modifications**

   - No booking update endpoint
   - No seat count modification
   - No date/time change support

4. **Waitlist Management**
   - No waitlist system
   - No automatic booking from waitlist
   - No waitlist notifications

### ❌ Event Completion Flow

**Status**: Partially Implemented

**Missing Components**:

1. **Stake Refund Logic**

   - No automatic stake refund on completion
   - No no-show detection
   - No stake forfeiture logic

2. **Completion Tracking**

   - No event completion endpoint integration
   - No attendance marking
   - No completion status updates

3. **Host Payout**
   - No automatic payout on completion
   - No payout calculation
   - No payout processing

---

## Issues & Gaps

### 🔴 Critical Issues

1. **No Real Payment Processing**

   - **Impact**: Cannot accept real payments
   - **Risk**: Cannot monetize platform
   - **Priority**: HIGH

2. **No Payment Records**

   - **Impact**: Cannot track payments
   - **Risk**: No audit trail, no reconciliation
   - **Priority**: HIGH

3. **No Link Between Booking and Payment**
   - **Impact**: Cannot query booking payment status
   - **Risk**: Data inconsistency
   - **Priority**: HIGH

### 🟡 Important Gaps

1. **No Commission System**

   - **Impact**: Cannot calculate platform revenue
   - **Risk**: No business model implementation
   - **Priority**: MEDIUM

2. **No Refund System**

   - **Impact**: Cannot handle cancellations properly
   - **Risk**: User dissatisfaction, legal issues
   - **Priority**: MEDIUM

3. **No Payout System**
   - **Impact**: Cannot pay hosts
   - **Risk**: Host dissatisfaction, legal issues
   - **Priority**: MEDIUM

### 🟢 Minor Gaps

1. **No Booking Modifications**

   - **Impact**: Users cannot change bookings
   - **Risk**: User inconvenience
   - **Priority**: LOW

2. **No Waitlist**
   - **Impact**: Cannot handle sold-out events efficiently
   - **Risk**: Lost bookings
   - **Priority**: LOW

---

## Recommended Next Steps

### Phase 1: Payment Integration (HIGH Priority)

**Goal**: Replace dummy payment with real Razorpay integration

**Tasks**:

1. **Set up Razorpay**

   - Create Razorpay account
   - Get API keys (test and production)
   - Configure webhook endpoints

2. **Implement Payment Endpoints**

   - `POST /payments/create-order` - Create Razorpay order
   - `POST /payments/verify` - Verify payment signature
   - `GET /payments/{id}/status` - Check payment status
   - `POST /payments/webhook` - Handle Razorpay webhooks

3. **Update Payment Service**

   - Replace dummy implementation with Razorpay SDK
   - Implement order creation
   - Implement payment verification
   - Handle webhook events

4. **Create Payment Records**

   - Save payment records to `payments` table
   - Link payments to bookings
   - Track payment status changes

5. **Update Booking Flow**
   - Integrate Razorpay checkout
   - Handle payment success/failure
   - Update booking status based on payment

**Estimated Time**: 1 week

**Dependencies**: Razorpay account, API keys

---

### Phase 2: Payment-Booking Integration (HIGH Priority)

**Goal**: Properly link payments and bookings

**Tasks**:

1. **Update Booking Service**

   - Create payment record when booking created
   - Link payment_id to booking
   - Update booking based on payment status

2. **Create Payment-Booking Views**

   - Create database view for joined data
   - Query booking with payment status
   - Track payment lifecycle

3. **Update API Responses**
   - Include payment status in booking responses
   - Include payment details in booking details
   - Show payment history

**Estimated Time**: 2-3 days

**Dependencies**: Phase 1 completion

---

### Phase 3: Commission & Payout System (MEDIUM Priority)

**Goal**: Implement 30/70 split and host payouts

**Tasks**:

1. **Commission Calculation**

   - Calculate 30% platform commission
   - Calculate 70% host payout
   - Track commission per booking

2. **Payout System**

   - Calculate monthly payouts
   - Track payout status
   - Generate payout reports
   - Process payouts (manual or automated)

3. **Revenue Tracking**
   - Track platform revenue
   - Track host earnings
   - Generate financial reports

**Estimated Time**: 1 week

**Dependencies**: Payment integration complete

---

### Phase 4: Refund & Cancellation (MEDIUM Priority)

**Goal**: Handle cancellations and refunds

**Tasks**:

1. **Cancellation Flow**

   - Create cancellation endpoint
   - Implement cancellation policy
   - Calculate cancellation fees
   - Update booking status

2. **Refund Processing**

   - Integrate Razorpay refund API
   - Process full refunds
   - Process partial refunds
   - Update payment status

3. **Refund Policy**
   - Define refund rules
   - Implement time-based refunds
   - Handle edge cases

**Estimated Time**: 1 week

**Dependencies**: Payment integration complete

---

### Phase 5: Event Completion & Stake (MEDIUM Priority)

**Goal**: Complete event lifecycle with stake refunds

**Tasks**:

1. **Event Completion**

   - Mark event as completed
   - Mark attendance
   - Update booking statuses

2. **Stake Refund Logic**

   - Refund stake for attended bookings
   - Forfeit stake for no-shows
   - Process stake refunds via Razorpay

3. **Host Payout**
   - Calculate final payout
   - Include stake refunds
   - Process host payment

**Estimated Time**: 1 week

**Dependencies**: Payment integration, refund system

---

## Technical Details

### Booking Service Flow

**Location**: `backend/app/services/booking_service.py`

**Process**:

1. Validate event run exists
2. Check event run availability (status: scheduled/low_seats)
3. Check seat availability
4. Calculate pricing (special pricing or base price)
5. Calculate costs (price + 20% stake)
6. Process payment (dummy)
7. Create booking record
8. Update event run status if needed
9. Return booking confirmation

**Key Methods**:

- `create_booking()` - Create new booking
- `get_booking_by_id()` - Get booking details
- `get_user_bookings()` - Get user's bookings

### Payment Service Flow

**Location**: `backend/app/services/payment_service.py`

**Current Implementation**:

- Dummy payment processor
- Simulates 0.5s delay
- Returns fake payment details
- Always succeeds

**Future Implementation** (Razorpay):

- Create Razorpay order
- Verify payment signature
- Handle webhook events
- Process refunds

### Frontend Booking Flow

**Location**: `frontend/src/components/BookEventButton.tsx`

**Process**:

1. User clicks "Book Event"
2. Modal opens with seat selection
3. Fetch cost calculation
4. Display cost breakdown
5. User confirms booking
6. Create booking via API
7. Show success/error message

**API Calls**:

- `BookingsAPI.calculateCost()` - Calculate booking cost
- `BookingsAPI.createBooking()` - Create booking

### Database Queries

**Booking Creation**:

```sql
INSERT INTO event_run_bookings (
  event_run_id,
  traveler_id,
  traveler_count,
  total_experience_cost_inr,
  booking_status,
  booking_type,
  booking_created_at
) VALUES (...);
```

**Seat Availability**:

```sql
SELECT
  max_capacity - COUNT(*) as available_spots
FROM event_run_bookings
WHERE event_run_id = ?
  AND booking_status IN ('confirmed', 'experience_completed');
```

**Payment-Booking Join** (Future):

```sql
SELECT
  b.id as booking_id,
  b.booking_status,
  p.status as payment_status,
  p.amount_inr
FROM event_run_bookings b
LEFT JOIN payments p ON b.id = p.booking_id
WHERE b.id = ?;
```

---

## Related Documentation

- `docs/booking-payment-separation.md` - Architecture details
- `docs/WEB3_REPLACEMENT_GUIDE.md` - Web3 removal details
- `docs/project-roadmap.md` - Overall project roadmap
- `docs/TEST_MODE_SETUP.md` - Testing without authentication

---

## Summary

### Current State

- ✅ Booking flow works end-to-end
- ✅ Cost calculation implemented
- ✅ Seat availability checking works
- ⚠️ Payment is dummy (not real)
- ❌ No payment records saved
- ❌ No commission/payout system
- ❌ No refund/cancellation flow

### Critical Path

1. **Razorpay Integration** (Week 1)
2. **Payment-Booking Link** (Week 1-2)
3. **Commission System** (Week 2-3)
4. **Refund System** (Week 3-4)
5. **Event Completion** (Week 4-5)

### Estimated Total Time

**4-5 weeks** to complete full payment and booking system

---

**Next Action**: Begin Phase 1 - Razorpay Integration





