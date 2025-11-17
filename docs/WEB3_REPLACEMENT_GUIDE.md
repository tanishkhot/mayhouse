# Web3 Logic Replacement Guide

This document shows what Web3/blockchain logic has been commented out and how each piece should be replaced for regular payment flow.

## Summary

All Web3/blockchain logic has been **commented out** (not removed) so it can be easily restored if needed. The booking flow now uses regular API-based payments with dummy payment processing (ready for Razorpay integration).

---

## Backend Changes

### 1. Blockchain API (`backend/app/api/blockchain.py`)

#### ✅ **KEPT (Still Active):**
- `POST /blockchain/calculate-booking-cost` - Calculates booking cost in INR only (no Wei)
- `POST /blockchain/complete-event` - Completes event (database-only, no blockchain calls)

#### ❌ **COMMENTED OUT:**
- `GET /blockchain/status/{event_run_id}` - Blockchain sync status checking
- `GET /blockchain/conversion/inr-to-wei` - INR to Wei conversion
- `GET /blockchain/conversion/wei-to-inr` - Wei to INR conversion  
- `GET /blockchain/eth-price` - ETH price fetching from CoinGecko

**Location:** Lines 287-436 in `blockchain.py`

**To Restore:** Uncomment the endpoints and restore blockchain_service calls.

---

### 2. Event Run Service (`backend/app/services/event_run_service.py`)

#### ❌ **COMMENTED OUT:**
- `wallet_address` field in host queries (Line 192)
- `host_wallet_address` in response objects (Lines 236, 885)

**Replacement:**
- Set `host_wallet_address=None` in responses
- Removed `wallet_address` from database selects

**To Restore:** Uncomment wallet_address in selects and use `host.get("wallet_address")` in responses.

---

### 3. Configuration (`backend/app/core/config.py`)

#### ❌ **COMMENTED OUT:**
- `blockchain_rpc_url` - RPC endpoint for blockchain
- `contract_address` - Smart contract address
- `platform_private_key` - Platform wallet private key
- `eth_price_inr` - ETH price in INR

**Current State:**
- Placeholder empty strings to prevent errors
- Original values preserved in comments

**To Restore:** Uncomment the original settings and remove placeholder values.

---

## Frontend Changes

### 4. Blockchain API Client (`frontend/src/lib/blockchain-api.ts`)

#### ✅ **KEPT (Still Active):**
- `calculateBookingCost()` - Gets booking cost in INR
- `formatINR()` - Formats INR amounts

#### ❌ **COMMENTED OUT:**
- `getBlockchainStatus()` - Blockchain sync status
- `convertINRtoWei()` - INR to Wei conversion
- `convertWeiToINR()` - Wei to INR conversion
- `getETHPrice()` - ETH price fetching
- `formatETH()` - ETH formatting
- `weiToETH()` - Wei to ETH conversion
- `ethToWei()` - ETH to Wei conversion
- `getETHPriceInINR()` - ETH price helper
- `convertINRtoETH()` - INR to ETH conversion
- `convertETHtoINR()` - ETH to INR conversion

**Location:** Lines 61-161 in `blockchain-api.ts`

**To Restore:** Uncomment the functions.

---

### 5. Contract Files (Deprecated but kept)

#### `frontend/src/lib/contract.ts`
- **Status:** DEPRECATED - Not used in booking flow
- **Still used by:** HostDashboard, UserBookings, CreateEventForm, AllEventsListing
- **Action:** Keep for now, can be removed later when those components are updated

#### `frontend/src/lib/booking-contract.ts`
- **Status:** DEPRECATED - Not used in booking flow
- **Action:** Keep for reference, not imported anywhere

#### `frontend/src/lib/contract-abi.ts`
- **Status:** DEPRECATED - Not used in booking flow
- **Still used by:** Some components
- **Action:** Keep for now

---

## Database Schema

### ✅ **NO CHANGES NEEDED:**
- `users.wallet_address` - Keep column (optional field)
- `event_runs.blockchain_*` columns - Keep columns (leave NULL)
- `event_run_bookings.blockchain_*` columns - Keep columns (leave NULL)

**Reason:** These columns don't interfere with regular payments. They can remain NULL.

---

## What Still Works

### ✅ **Active Features:**
1. **Booking Cost Calculation** - `/blockchain/calculate-booking-cost` (INR only)
2. **Booking Creation** - `/bookings` (API-based, dummy payment)
3. **Event Completion** - `/blockchain/complete-event` (database-only)
4. **OAuth Authentication** - Full support
5. **Regular Payments** - Dummy payment processor (ready for Razorpay)

### ❌ **Disabled Features:**
1. Blockchain sync status checking
2. INR/Wei currency conversion
3. ETH price fetching
4. Wallet address in event run responses
5. Smart contract interactions for bookings

---

## Replacement Strategy

### For Each Commented Section:

1. **Blockchain Endpoints:**
   - **Current:** Commented out with `# NOTE: Commented out - Not needed for regular payment flow`
   - **To Restore:** Uncomment the endpoint decorator and function body
   - **Dependencies:** Requires `blockchain_service` to be active

2. **Wallet Address Fields:**
   - **Current:** Set to `None` with comment `# Commented out - not needed for regular payments`
   - **To Restore:** Uncomment the original line, restore `wallet_address` in selects

3. **Config Settings:**
   - **Current:** Placeholder empty strings with original values in comments
   - **To Restore:** Uncomment original settings, remove placeholders

4. **Frontend API Functions:**
   - **Current:** Commented out with `// NOTE: Commented out - Not needed for regular payment flow`
   - **To Restore:** Uncomment the function definitions

---

## Files Modified

### Backend:
- ✅ `backend/app/api/blockchain.py` - Commented out 4 endpoints
- ✅ `backend/app/services/event_run_service.py` - Commented out wallet_address references
- ✅ `backend/app/core/config.py` - Commented out blockchain settings

### Frontend:
- ✅ `frontend/src/lib/blockchain-api.ts` - Commented out Web3 utility functions
- ✅ `frontend/src/lib/contract.ts` - Added deprecation notice
- ✅ `frontend/src/lib/booking-contract.ts` - Added deprecation notice
- ✅ `frontend/src/lib/contract-abi.ts` - Added deprecation notice

---

## Testing Checklist

After commenting out Web3 logic:

- [x] Booking cost calculation works (INR only)
- [x] Booking creation works (API-based)
- [x] Event completion works (database-only)
- [x] No errors from missing wallet_address
- [x] No errors from missing blockchain config
- [x] Frontend booking flow works without wallet

---

## Notes

- All Web3 code is preserved in comments
- Easy to restore by uncommenting
- Database schema unchanged (columns remain, just unused)
- Contract files kept for reference
- Wallet auth endpoints still available (optional feature)

