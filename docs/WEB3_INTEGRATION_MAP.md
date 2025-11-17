# Web3 Integration Map - Quick Reference

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  - Wallet Connection (MetaMask/WalletConnect)                   │
│  - Signature Generation                                         │
│  - Transaction Signing                                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                      BACKEND API                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /auth/wallet/*          - Wallet Authentication         │   │
│  │  /blockchain/*            - Blockchain Operations         │   │
│  │  /hosts/event-runs/*     - Event Run Management          │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐  ┌───▼──────┐  ┌───▼──────────┐
│   Database   │  │ Blockchain│  │  Wallet      │
│  (Supabase)  │  │  Service   │  │  Service     │
└──────────────┘  └───────────┘  └──────────────┘
        │              │              │
        │              │              │
┌───────▼──────────────▼──────────────▼──────────┐
│              SMART CONTRACTS                    │
│  - MayhouseExperience.sol                       │
│  - MayhouseBooking.sol                          │
└─────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Wallet Authentication Flow

```
User → Connect Wallet → Get Address
  │
  ├─→ POST /auth/wallet/nonce
  │     └─→ Backend generates nonce
  │         └─→ Returns: {nonce, message}
  │
  ├─→ User signs message with wallet
  │
  └─→ POST /auth/wallet/verify
        └─→ Backend verifies signature
            ├─→ Valid: Create/Get user → Return JWT token
            └─→ Invalid: Return error
```

### 2. Event Run Creation Flow

```
Host → Create Event Run (Database)
  │
  ├─→ INSERT into event_runs table
  │     └─→ blockchain_status = 'pending'
  │
  └─→ [Optional] Sync to Blockchain
        ├─→ BlockchainService.create_event_run_onchain()
        │     ├─→ Convert INR → Wei
        │     ├─→ Calculate host stake (20%)
        │     ├─→ Build transaction
        │     ├─→ Sign with platform key
        │     └─→ Send to blockchain
        │
        └─→ UPDATE event_runs
              ├─→ blockchain_event_run_id = <on-chain-id>
              ├─→ blockchain_tx_hash = <tx-hash>
              └─→ blockchain_status = 'confirmed'
```

### 3. Booking Flow

```
User → Book Event Run
  │
  ├─→ POST /blockchain/calculate-booking-cost
  │     └─→ Returns: {price, stake, total} in INR & Wei
  │
  ├─→ User approves transaction in wallet
  │     └─→ Frontend calls smart contract directly
  │         └─→ bookEvent(eventRunId, seatCount)
  │             └─→ Sends: payment + stake (20%)
  │
  └─→ Backend receives booking confirmation
        ├─→ INSERT into event_run_bookings
        │     ├─→ blockchain_booking_id = <on-chain-id>
        │     ├─→ blockchain_tx_hash = <tx-hash>
        │     └─→ blockchain_stake_amount_wei = <stake>
        │
        └─→ UPDATE event_runs
              └─→ seats_booked += seat_count
```

### 4. Event Completion Flow

```
Host → Mark Event Complete
  │
  ├─→ POST /blockchain/complete-event
  │     └─→ {event_run_id, attended_booking_ids: [...]}
  │
  ├─→ Backend maps database IDs → blockchain IDs
  │
  ├─→ BlockchainService.complete_event_onchain()
  │     └─→ Smart contract: completeEvent()
  │         ├─→ Attended users: Return stake
  │         ├─→ No-show users: Forfeit stake
  │         │     └─→ 95% to host, 5% to platform
  │         └─→ Host: Receive payment + stake
  │
  └─→ UPDATE database
        ├─→ event_runs.status = 'completed'
        ├─→ attended bookings.status = 'experience_completed'
        └─→ no-show bookings.status = 'no_show'
```

## Database Schema - Blockchain Fields

### event_runs
```sql
blockchain_event_run_id  INTEGER  -- ID on smart contract
blockchain_tx_hash        TEXT     -- Transaction hash
blockchain_status         ENUM     -- pending/confirmed/failed
```

### event_run_bookings
```sql
blockchain_booking_id     INTEGER  -- ID on smart contract
blockchain_tx_hash        TEXT     -- Transaction hash
blockchain_stake_amount_wei BIGINT -- Stake in Wei
```

### users
```sql
wallet_address            TEXT     -- Ethereum wallet address
```

## Smart Contract State

### MayhouseExperience Contract

**Event Run State:**
- `eventRunId` - Unique ID
- `host` - Host wallet address
- `experienceId` - Off-chain reference
- `pricePerSeat` - Price in Wei
- `maxSeats` - Maximum capacity
- `seatsBooked` - Current bookings
- `hostStake` - Host's stake amount
- `eventTimestamp` - Event time
- `status` - Created/Active/Full/Completed/Cancelled

**Booking State:**
- `bookingId` - Unique ID
- `eventRunId` - Parent event
- `user` - User wallet address
- `seatCount` - Number of seats
- `totalPayment` - Ticket price in Wei
- `userStake` - Stake amount in Wei
- `status` - Active/Completed/NoShow/Cancelled

## Key Integration Points

### 1. Authentication
- **Wallet Address** → User Account
- **Signature** → JWT Token
- **Nonce** → Prevents replay attacks

### 2. Event Management
- **Database Event Run** ↔ **Blockchain Event Run**
- **Sync Status** tracked in database
- **Transaction Hash** stored for verification

### 3. Booking System
- **Database Booking** ↔ **Blockchain Booking**
- **Stake Amount** tracked in Wei
- **Status** synchronized

### 4. Payment Processing
- **INR Prices** → **Wei Conversion**
- **ETH Price** from CoinGecko API
- **Stake Calculation** (20% of booking cost)

### 5. Fund Distribution
- **Attended** → Stake returned
- **No-Show** → Stake forfeited (95% host, 5% platform)
- **Host** → Payment + stake returned

## API Endpoint Summary

### Authentication
- `POST /auth/wallet/nonce` - Get nonce for signing
- `POST /auth/wallet/verify` - Verify signature & authenticate
- `GET /auth/me` - Get current user

### Blockchain Operations
- `POST /blockchain/calculate-booking-cost` - Calculate cost + stake
- `POST /blockchain/complete-event` - Complete event & distribute funds
- `GET /blockchain/status/{event_run_id}` - Check sync status
- `GET /blockchain/conversion/inr-to-wei` - Currency conversion
- `GET /blockchain/conversion/wei-to-inr` - Currency conversion
- `GET /blockchain/eth-price` - Get current ETH price

### Event Runs
- `POST /hosts/event-runs` - Create event run
- `GET /hosts/event-runs` - List host's event runs
- `GET /event-runs/{id}` - Get event run details

## Configuration Dependencies

```
Environment Variables:
├─ BLOCKCHAIN_RPC_URL      → Web3 connection
├─ CONTRACT_ADDRESS        → Smart contract location
├─ PLATFORM_PRIVATE_KEY   → Gas payment account
├─ ETH_PRICE_INR          → Currency conversion
├─ JWT_SECRET_KEY         → Token signing
└─ SUPABASE_*             → Database connection
```

## Security Layers

1. **Signature Verification**
   - Nonce-based authentication
   - Message signing prevents replay attacks
   - Address recovery from signature

2. **Transaction Validation**
   - All transactions validated before execution
   - Receipt verification for success
   - Error handling for failures

3. **Access Control**
   - JWT tokens for API authentication
   - Host-only functions in contracts
   - Admin-only functions protected

4. **Private Key Security**
   - Environment variable storage
   - Never committed to git
   - Secure key management needed

## Current State

✅ **Implemented:**
- Wallet authentication
- Event run creation (database)
- Booking cost calculation
- Currency conversion (INR ↔ Wei)
- Event completion flow
- Database blockchain fields

⚠️ **Partial Implementation:**
- Event run blockchain sync (needs event log parsing)
- Booking blockchain sync (frontend calls contract directly)
- Gas payment (platform pays, should be user/host)

❌ **Not Yet Implemented:**
- Automatic blockchain sync on event creation
- Real-time status updates
- Multi-chain support
- Stablecoin payments

