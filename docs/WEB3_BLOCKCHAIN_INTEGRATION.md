# Web3/Blockchain Integration Overview

This document provides a comprehensive overview of how Web3 and blockchain functionality is integrated throughout the Mayhouse platform.

## Table of Contents
1. [Smart Contracts](#smart-contracts)
2. [Database Integration](#database-integration)
3. [Backend Services](#backend-services)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Wallet Integration](#authentication--wallet-integration)
6. [Payment & Staking Mechanism](#payment--staking-mechanism)
7. [Configuration](#configuration)

---

## Smart Contracts

### 1. MayhouseExperience Contract
**Location:** `contracts/contracts/MayhouseExperience.sol`

**Purpose:** Main smart contract for managing event runs and bookings on-chain.

**Key Features:**
- **Event Run Management:**
  - Hosts create event runs with staking requirement (20% of total event value)
  - Stores event details: experience ID, price per seat, max seats, timestamp
  - Tracks event status: Created, Active, Full, Completed, Cancelled

- **Booking System:**
  - Users book seats with payment + 20% refundable stake
  - Booking status: Active, Completed, NoShow, Cancelled
  - Automatic stake distribution on event completion

- **Staking Mechanism:**
  - Host stake: 20% of total event value (held until event completion)
  - User stake: 20% of booking cost (refundable if attended, forfeited if no-show)
  - Platform fee: 5% on forfeited stakes

- **Fund Distribution:**
  - On completion: Attendees get stakes back, no-shows forfeit stakes
  - Host receives payment + stake back
  - Platform collects fees from forfeited stakes

**Key Functions:**
- `createEventRun()` - Host creates event with stake
- `bookEvent()` - User books with payment + stake
- `completeEvent()` - Mark attendees and distribute funds
- `cancelEvent()` - Cancel event and refund all bookings

### 2. MayhouseBooking Contract
**Location:** `contracts/contracts/MayhouseBooking.sol`

**Purpose:** Simplified booking contract using off-chain event run references.

**Key Features:**
- Uses UUID references to off-chain event runs (no on-chain event state)
- Handles payment + 20% refundable stake
- Host can mark attended/no-show after event
- Immediate payment to host, stake held in contract

**Key Functions:**
- `createBooking()` - Create booking with payment + stake
- `completeBooking()` - Mark as attended, return stake
- `markNoShow()` - Forfeit stake (95% to host, 5% to platform)
- `cancelBooking()` - Cancel before event, refund stake

---

## Database Integration

### Migration: `002_add_blockchain_integration.sql`

**Event Runs Table (`event_runs`):**
- `blockchain_event_run_id` (INTEGER) - ID on smart contract
- `blockchain_tx_hash` (TEXT) - Transaction hash of event creation
- `blockchain_status` (ENUM) - Sync status: pending, confirmed, failed

**Bookings Table (`event_run_bookings`):**
- `blockchain_booking_id` (INTEGER) - ID on smart contract
- `blockchain_tx_hash` (TEXT) - Transaction hash of booking
- `blockchain_stake_amount_wei` (BIGINT) - Stake amount in Wei

**Indexes:**
- `idx_event_runs_blockchain_id` - Fast lookup by blockchain ID
- `idx_bookings_blockchain_id` - Fast lookup by blockchain booking ID

---

## Backend Services

### 1. BlockchainService
**Location:** `backend/app/services/blockchain_service.py`

**Purpose:** Service layer for all blockchain interactions.

**Key Methods:**

#### Connection Management
- `_connect()` - Establishes Web3 connection to RPC endpoint
- `_ensure_connected()` - Validates connection, raises error if unavailable

#### Currency Conversion
- `convert_inr_to_wei(price_inr, eth_price_inr)` - Convert INR to Wei
- `convert_wei_to_inr(wei_amount, eth_price_inr)` - Convert Wei to INR
- Uses live ETH price from CoinGecko API (cached for 60 seconds)

#### Event Run Operations
- `create_event_run_onchain()` - Create event run on blockchain
  - Converts INR price to Wei
  - Calculates required host stake (20% of total value)
  - Builds and sends transaction
  - Returns (blockchain_event_run_id, tx_hash)
  
- `get_event_run_from_chain()` - Read event run data from blockchain
- `complete_event_onchain()` - Complete event and distribute stakes
- `cancel_event_onchain()` - Cancel event and issue refunds

#### Booking Operations
- `calculate_booking_cost()` - Calculate payment + stake in Wei
- `get_user_bookings()` - Get all booking IDs for a user
- `get_host_events()` - Get all event run IDs for a host

**Configuration:**
- RPC URL: `blockchain_rpc_url` (from env)
- Contract Address: `contract_address` (from env)
- Platform Private Key: `platform_private_key` (for gas payments)

### 2. WalletService
**Location:** `backend/app/services/wallet_service.py`

**Purpose:** Wallet-based authentication using signature verification.

**Key Functions:**
- `generate_nonce(wallet_address)` - Generate nonce for signing
  - Creates random nonce, stores with expiry (5 minutes)
  - Returns (nonce, message_to_sign)
  
- `verify_signature(wallet_address, signature)` - Verify signed message
  - Reconstructs message from stored nonce
  - Recovers address from signature
  - Validates address matches
  
- `get_or_create_user(wallet_address)` - Get or create user account
  - Creates user if doesn't exist
  - Generates elegant username
  - Links wallet_address to user account

- `create_auth_token(user)` - Generate JWT token for authenticated user

**Storage:**
- In-memory nonce store (use Redis in production)
- Nonce expiry: 300 seconds (5 minutes)

---

## API Endpoints

### Wallet Authentication
**Base Path:** `/auth/wallet`

#### `POST /auth/wallet/nonce`
- Request: `{ "wallet_address": "0x..." }`
- Response: `{ "nonce": "...", "message": "Sign this message..." }`
- Purpose: Get nonce for wallet signature

#### `POST /auth/wallet/verify`
- Request: `{ "wallet_address": "0x...", "signature": "0x..." }`
- Response: `{ "access_token": "...", "user": {...} }`
- Purpose: Verify signature and authenticate user

#### `GET /auth/me`
- Purpose: Get current authenticated user (supports both OAuth and wallet auth)

### Blockchain Operations
**Base Path:** `/blockchain`

#### `POST /blockchain/calculate-booking-cost`
- Request: `{ "event_run_id": "...", "seat_count": 2 }`
- Response: Booking cost breakdown in both INR and Wei
- Purpose: Calculate total cost including 20% stake

#### `POST /blockchain/complete-event`
- Request: `{ "event_run_id": "...", "attended_booking_ids": [...] }`
- Response: Transaction hash and completion details
- Purpose: Complete event on blockchain and distribute stakes

#### `GET /blockchain/status/{event_run_id}`
- Response: Blockchain sync status and on-chain data
- Purpose: Check if event is synced to blockchain

#### `GET /blockchain/conversion/inr-to-wei`
- Query: `amount_inr=1000`
- Response: Converted amount in Wei and ETH

#### `GET /blockchain/conversion/wei-to-inr`
- Query: `amount_wei=1000000000000000`
- Response: Converted amount in INR

#### `GET /blockchain/eth-price`
- Response: Current ETH price in INR from CoinGecko
- Features: Caching (60 seconds), fallback to hardcoded value

---

## Authentication & Wallet Integration

### User Authentication Flow

1. **Wallet Connection:**
   - User connects wallet (MetaMask, WalletConnect, etc.)
   - Frontend gets wallet address

2. **Nonce Request:**
   - Frontend calls `/auth/wallet/nonce` with wallet address
   - Backend generates nonce and message to sign
   - Nonce stored with 5-minute expiry

3. **Signature:**
   - User signs message with wallet
   - Frontend gets signature

4. **Verification:**
   - Frontend calls `/auth/wallet/verify` with address + signature
   - Backend verifies signature using Web3
   - If valid: creates/gets user account, returns JWT token

5. **Authenticated Requests:**
   - Frontend includes JWT token in `Authorization: Bearer <token>` header
   - Backend validates token and extracts user ID

### User Account Creation
- New users are automatically created on first wallet authentication
- Username generated automatically (elegant format)
- Wallet address stored in `users.wallet_address` column
- Default role: "user"

---

## Payment & Staking Mechanism

### Booking Cost Structure

For a booking with:
- Price per seat: ₹1,000 INR
- Seat count: 2

**Calculation:**
1. **Ticket Price:** ₹1,000 × 2 = ₹2,000 INR
2. **Stake (20%):** ₹2,000 × 0.20 = ₹400 INR
3. **Total Cost:** ₹2,400 INR

**In Wei (assuming ETH = ₹200,000):**
- Ticket Price: ~0.01 ETH = 10,000,000,000,000,000 Wei
- Stake: ~0.002 ETH = 2,000,000,000,000,000 Wei
- Total: ~0.012 ETH = 12,000,000,000,000,000 Wei

### Event Completion Flow

1. **Host marks event complete:**
   - Calls `/blockchain/complete-event` with attended booking IDs
   - Backend maps database booking IDs to blockchain booking IDs

2. **Smart contract execution:**
   - `completeEvent()` called on blockchain
   - Attended users: Stake returned
   - No-show users: Stake forfeited (95% to host, 5% to platform)
   - Host: Receives payment + stake back

3. **Database updates:**
   - Event run status → "completed"
   - Attended bookings → "experience_completed"
   - No-show bookings → "no_show"

### Host Staking

When host creates event run:
- **Required Stake:** 20% of total event value
  - Example: ₹1,000/seat × 4 seats = ₹4,000 total
  - Host stake: ₹800 INR
- **Stake held until:** Event completion or cancellation
- **Returned:** On event completion or cancellation

---

## Configuration

### Environment Variables

**Blockchain Settings:**
```bash
# RPC URL for blockchain connection
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Smart contract address (Sepolia Testnet)
CONTRACT_ADDRESS=0x09aB660CEac220678b42E0e23DebCb1475e1eAD5

# Platform wallet private key (for gas payments)
PLATFORM_PRIVATE_KEY=0x...your_private_key_here...

# ETH price in INR (for currency conversion)
ETH_PRICE_INR=200000
```

**JWT Settings:**
```bash
# Secret key for JWT tokens (wallet auth)
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080  # 7 days
```

### Contract Deployment

**MayhouseExperience:**
```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

**MayhouseBooking:**
```bash
cd contracts
npx hardhat run scripts/deploy-booking.js --network sepolia
```

---

## Integration Points Summary

### 1. **User Registration & Authentication**
- ✅ Wallet address stored in `users.wallet_address`
- ✅ JWT tokens for wallet-authenticated users
- ✅ Signature verification using Web3

### 2. **Event Run Creation**
- ✅ Database record created first
- ✅ Optional blockchain sync (can be async)
- ✅ Blockchain fields: `blockchain_event_run_id`, `blockchain_tx_hash`, `blockchain_status`

### 3. **Booking Creation**
- ✅ Database booking created
- ✅ Blockchain booking ID stored
- ✅ Stake amount tracked in Wei

### 4. **Event Completion**
- ✅ Host marks attendees
- ✅ Blockchain transaction for fund distribution
- ✅ Database status updates

### 5. **Currency Conversion**
- ✅ INR ↔ Wei conversion using live ETH price
- ✅ CoinGecko API integration (cached)
- ✅ Fallback to hardcoded price

### 6. **Status Tracking**
- ✅ Blockchain sync status per event run
- ✅ Transaction hash storage
- ✅ On-chain data retrieval

---

## Current Limitations & TODOs

1. **Event Run ID Parsing:**
   - `_parse_event_run_id_from_receipt()` needs proper event log parsing
   - Currently returns placeholder value

2. **Gas Payment:**
   - Currently platform pays for all gas
   - Should allow host/user to pay their own gas

3. **Nonce Storage:**
   - In-memory storage (not production-ready)
   - Should use Redis for distributed systems

4. **Error Handling:**
   - Better error messages for blockchain failures
   - Retry logic for failed transactions

5. **Contract ABI:**
   - Partial ABI in code
   - Should load full ABI from contract artifacts

---

## Security Considerations

1. **Private Key Management:**
   - Platform private key stored in environment variables
   - Never commit to git
   - Use secure key management in production

2. **Signature Verification:**
   - Nonce expiry prevents replay attacks
   - Message format prevents signature reuse

3. **Transaction Validation:**
   - All blockchain transactions validated before execution
   - Transaction receipts checked for success

4. **Access Control:**
   - Host-only functions protected by modifiers
   - Admin functions restricted to owner

---

## Testing

**Test Files:**
- `backend/tests/test_auth_integration.py` - Wallet auth flow
- `backend/test_auth_implementation.py` - Endpoint testing
- `contracts/test/MayhouseExperience.test.js` - Contract tests

**Test Commands:**
```bash
# Backend tests
cd backend
pytest tests/

# Contract tests
cd contracts
npx hardhat test
```

---

## Future Enhancements

1. **Multi-chain Support:**
   - Support for multiple blockchain networks
   - Network selection in UI

2. **Gas Optimization:**
   - Batch transactions
   - Gas price optimization

3. **Event Monitoring:**
   - WebSocket connection for real-time updates
   - Event log monitoring

4. **Payment Methods:**
   - Support for stablecoins (USDC, DAI)
   - Fiat on-ramp integration

5. **Dispute Resolution:**
   - On-chain dispute mechanism
   - Arbitration system

