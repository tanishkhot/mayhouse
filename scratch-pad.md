# Booking Button & Cost Logic Migration Plan

**Goal**: Integrate `BookEventButton` into the Web2-first booking flow and move cost calculation logic from the legacy "Blockchain" API to the standard `Bookings` API.

## Phase 1: Backend Refactor

- [x] **Update Schemas**:
  - Edit `backend/app/schemas/booking.py`: Add `BookingCostRequest` and `BookingCostResponse`.
- [x] **Migrate Logic**:
  - Edit `backend/app/api/bookings.py`: Add `/calculate-cost` endpoint using logic from `backend/app/api/blockchain.py`.
- [x] **Verify**:
  - Ensure new endpoint returns correct INR values (price, stake, total).

## Phase 2: Frontend API Update

- [x] **Update Client**:
  - Edit `frontend/src/lib/bookings-api.ts`:
    - Add `calculateCost` method calling `/bookings/calculate-cost`.
    - Add/Export `BookingCostResponse` interface.

## Phase 3: Frontend Component Refactor

- [x] **Refactor Button**:
  - Edit `frontend/src/components/BookEventButton.tsx`:
    - Remove `BlockchainAPI` import.
    - Import `BookingsAPI`.
    - Replace `BlockchainAPI.calculateBookingCost` with `BookingsAPI.calculateCost`.
    - Clean up any unused props/state related to blockchain (if any).

## Phase 4: Verification

- [x] **Unit Test**: Update `backend/tests/test_booking_flow.py` to test the new cost calculation endpoint.
- [x] **Manual Check**: Verify `BookEventButton` functionality in `AllEventsListing` (via code review/logic check).
