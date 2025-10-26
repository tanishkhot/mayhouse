# Hybrid Booking System Implementation (Option C)

## Overview

Implemented a hybrid system where:
- ✅ Event runs stay **OFF-CHAIN** in database (Postgres/Supabase)
- ✅ Bookings create **ON-CHAIN** transactions for payment + stake
- ✅ Smart contract uses event run **UUID references** (not on-chain IDs)
- ✅ Backend maps blockchain booking ID ↔ database event run

## Architecture

### 1. Smart Contract: `MayhouseBooking.sol`

**Location**: `/contracts/contracts/MayhouseBooking.sol`

**Key Features**:
- No need for on-chain event runs
- Uses `string eventRunRef` (UUID from database)
- Handles payment + 20% refundable stake
- Host can mark attended/no-show after event
- Platform fee (5%) and stake management (20%)

**Main Functions**:
```solidity
function createBooking(
    address _host,
    string memory _eventRunRef,  // UUID from database!
    uint256 _ticketPrice,
    uint256 _seatCount,
    uint256 _eventTimestamp
) external payable returns (uint256)

function completeBooking(uint256 _bookingId) // Host marks attended
function markNoShow(uint256 _bookingId)      // Host marks no-show
function cancelBooking(uint256 _bookingId)   // Cancel before event
```

### 2. Frontend Integration

**New File**: `/frontend/src/lib/booking-contract.ts`
- Simplified ABI for MayhouseBooking
- React hooks: `useCreateBooking`, `useCalculateBookingCost`
- No need for event run IDs!

**Updated**: `/frontend/src/components/BookEventButton.tsx`
- Uses `createBooking` instead of `bookEvent`
- Passes event run UUID as reference
- Requires host wallet address from database
- Improved error handling and network checking

### 3. Booking Flow

```
User clicks "Book Now"
  ↓
Frontend fetches cost from backend API (INR → ETH conversion)
  ↓
User confirms → Frontend calls smart contract:
  createBooking(
    hostWalletAddress,     // From database
    eventRunUUID,          // From database
    ticketPriceWei,        // Calculated
    seatCount,             // User selected
    eventTimestamp         // From database
  )
  ↓
Smart contract:
  - Receives payment + 20% stake
  - Creates booking record on-chain
  - Returns blockchain booking ID
  ↓
[TODO] Backend records mapping:
  - event_run_id (UUID) ↔ blockchain_booking_id
  - transaction_hash
  - user_address
```

## Deployment Steps

### 1. Free Up Disk Space (Required!)
```bash
df -h  # Check disk usage
# Clean node_modules, caches, Docker images, etc.
```

### 2. Compile Contract
```bash
cd /Users/maverick/ethonline-hackathon/mayhouse/contracts
npx hardhat compile
```

### 3. Deploy to Sepolia
```bash
npx hardhat run scripts/deploy-booking.js --network sepolia
```

Expected output:
```
✅ MayhouseBooking deployed to: 0x...
   - Platform Fee: 5%
   - Stake Percentage: 20%
   
📝 Save this address to your frontend .env:
   NEXT_PUBLIC_BOOKING_CONTRACT_ADDRESS=0x...
```

### 4. Update Frontend Environment
Add to `/frontend/.env.local`:
```bash
NEXT_PUBLIC_BOOKING_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
```

### 5. Verify on Etherscan (Optional)
```bash
npx hardhat verify --network sepolia 0xYOUR_ADDRESS YOUR_PLATFORM_WALLET
```

## Backend Integration (TODO)

### Required Database Columns

Add to `event_runs` or create `blockchain_bookings` table:
```sql
-- Option A: Add to event_runs
ALTER TABLE event_runs ADD COLUMN blockchain_bookings JSONB;

-- Option B: Create separate table (recommended)
CREATE TABLE blockchain_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_run_id UUID REFERENCES event_runs(id),
  blockchain_booking_id INTEGER NOT NULL,
  transaction_hash TEXT NOT NULL,
  user_address TEXT NOT NULL,
  seat_count INTEGER NOT NULL,
  ticket_price_wei BIGINT NOT NULL,
  stake_wei BIGINT NOT NULL,
  status TEXT NOT NULL,  -- 'active', 'completed', 'no_show', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints Needed

1. **POST `/bookings/record-blockchain`**
   - Records blockchain booking ID after successful transaction
   - Links event run UUID ↔ blockchain booking ID

2. **GET `/bookings/blockchain-status/:eventRunId`**
   - Returns all blockchain bookings for an event run
   - Used by host to mark attendance

3. **POST `/bookings/complete/:blockchainBookingId`**
   - Host marks booking as complete
   - Calls smart contract `completeBooking()`

4. **POST `/bookings/no-show/:blockchainBookingId`**
   - Host marks booking as no-show
   - Calls smart contract `markNoShow()`

## Testing

### Local Testing
1. Navigate to: `http://localhost:3000/test-contract`
2. DO NOT create event runs on blockchain
3. Use the explore page to book real event runs
4. Event runs are in database only!

### What to Test
- ✅ Book an event with Sepolia ETH
- ✅ Check MetaMask shows correct payment + stake
- ✅ Transaction succeeds
- ✅ Booking ID returned
- ✅ [TODO] Backend records the booking

## Key Differences from Old System

| Aspect | Old System | New System (Hybrid) |
|--------|-----------|---------------------|
| Event Runs | On-chain | Off-chain (database) ✅ |
| Bookings | On-chain with event run ID | On-chain with UUID reference ✅ |
| Host Stake | Required when creating event | Not needed (no on-chain events) ✅ |
| Event Run Counter | Smart contract counter | Database auto-increment ✅ |
| Flexibility | Limited (blockchain immutable) | High (database editable) ✅ |

## Benefits

1. **No Host Stake Required**: Hosts don't need to stake when creating events
2. **Flexible Event Management**: Edit/cancel events in database easily
3. **Lower Gas Costs**: Only pay gas for bookings, not event creation
4. **Scalability**: Database can handle millions of events
5. **Better UX**: Instant event creation (no blockchain wait)
6. **Still Trustless**: Payment + stake handled by smart contract

## Next Steps

1. ✅ Smart contract created
2. ✅ Frontend updated
3. ⏳ Deploy contract (waiting for disk space)
4. ⏳ Update `.env.local` with deployed address
5. ⏳ Backend API endpoints for booking tracking
6. ⏳ Host dashboard to mark attendance on-chain

## Files Changed

- ✅ `/contracts/contracts/MayhouseBooking.sol` - New booking contract
- ✅ `/contracts/scripts/deploy-booking.js` - Deployment script
- ✅ `/frontend/src/lib/booking-contract.ts` - Contract hooks
- ✅ `/frontend/src/components/BookEventButton.tsx` - Updated to use new contract
- ✅ `/frontend/src/app/experiences/[experienceId]/runs/[runId]/page.tsx` - Pass required props

## Notes

- Old `MayhouseExperience.sol` contract can be deprecated
- This approach is more gas-efficient and flexible
- Backend integration is straightforward
- No migration needed - fresh start with new contract

