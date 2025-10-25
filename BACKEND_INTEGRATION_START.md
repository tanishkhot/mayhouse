# 🎯 Backend Blockchain Integration - Started!

## What's Been Done ✅

### 1. Blockchain Service Layer Created
**File**: `backend/app/services/blockchain_service.py`

A complete service that handles:
- ✅ Web3 connection to Sepolia testnet
- ✅ Creating event runs on-chain with host stake
- ✅ Calculating booking costs (payment + 20% stake)
- ✅ Completing events (distribute funds)
- ✅ Cancelling events (refund everyone)
- ✅ Currency conversion (INR ↔ Wei)
- ✅ Reading blockchain state

### 2. Configuration Updated
**File**: `backend/app/core/config.py`

Added blockchain settings:
```python
blockchain_rpc_url: str  # Alchemy Sepolia RPC
contract_address: str    # 0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
platform_private_key: str  # For paying gas fees
eth_price_inr: str       # For INR/ETH conversion
```

### 3. Database Migration Created
**File**: `backend/database/migrations/002_add_blockchain_integration.sql`

Adds columns to link database records with blockchain:
- `blockchain_event_run_id` - Smart contract event ID
- `blockchain_tx_hash` - Transaction hash
- `blockchain_status` - Sync status (pending/confirmed/failed)
- `blockchain_booking_id` - Smart contract booking ID
- `blockchain_stake_amount_wei` - User's stake amount

### 4. Documentation
**File**: `backend/BLOCKCHAIN_INTEGRATION.md`

Complete guide covering:
- Architecture overview
- Setup instructions
- How each flow works
- API changes
- Testing procedures
- Troubleshooting

## Architecture

```
┌──────────┐         ┌─────────────┐         ┌──────────────────┐
│ Frontend │────────▶│   Backend   │────────▶│ Smart Contract   │
│          │         │             │         │   (Sepolia)      │
└──────────┘         └─────────────┘         └──────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Database   │
                     │  (Supabase) │
                     └─────────────┘
```

### Data Flow

1. **Create Event**: Database → Blockchain → Update Database
2. **Book Event**: Calculate Cost from Blockchain → User Pays → Record in DB
3. **Complete Event**: Fetch Bookings → Call Blockchain → Update DB

## Next Steps 🚀

### Step 1: Setup Environment (5 mins)

1. **Get Alchemy API Key**:
   - Go to https://www.alchemy.com/
   - Create account → New App → Ethereum Sepolia
   - Copy API key

2. **Generate Platform Wallet**:
   ```bash
   python3 -c "from eth_account import Account; acc = Account.create(); print(f'Address: {acc.address}\\nPrivate Key: {acc.key.hex()}')"
   ```

3. **Fund Platform Wallet**:
   - Visit https://sepoliafaucet.com/
   - Enter your platform address
   - Get free test ETH

4. **Update `.env`**:
   ```bash
   cd backend
   nano .env
   ```
   
   Add:
   ```
   BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   CONTRACT_ADDRESS=0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
   PLATFORM_PRIVATE_KEY=your_private_key_here
   ETH_PRICE_INR=200000
   ```

### Step 2: Run Database Migration (2 mins)

Option A - Via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `database/migrations/002_add_blockchain_integration.sql`
3. Click "Run"

Option B - Via CLI:
```bash
psql -h your-supabase-host -U postgres -d postgres -f database/migrations/002_add_blockchain_integration.sql
```

### Step 3: Modify Event Run Service (Next Task)

File: `backend/app/services/event_run_service.py`

Add blockchain integration to these methods:
- `create_event_run()` - Call blockchain after DB create
- `update_event_run_status()` - Sync with blockchain
- `delete_event_run()` - Cancel on blockchain if exists

I'll help you with this next!

### Step 4: Add Booking Endpoints (After Step 3)

New endpoints needed:
- `POST /bookings/calculate-cost` - Get cost including stake
- `POST /bookings/create` - Create booking on blockchain
- `POST /bookings/confirm-attendance` - Mark users as attended

### Step 5: Test Complete Flow (Final)

Test sequence:
1. Create event → Check blockchain
2. Calculate booking cost
3. Book event → Check stake
4. Complete event → Verify payouts
5. Check balances on Etherscan

## File Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── event_runs.py          (to be modified)
│   │   └── bookings.py            (to be created)
│   ├── services/
│   │   ├── blockchain_service.py  ✅ NEW
│   │   └── event_run_service.py   (to be modified)
│   └── core/
│       └── config.py               ✅ UPDATED
├── database/
│   └── migrations/
│       └── 002_add_blockchain_integration.sql  ✅ NEW
├── .env                            (needs blockchain config)
└── BLOCKCHAIN_INTEGRATION.md       ✅ NEW
```

## Key Features Implemented

### 1. Automatic Currency Conversion
```python
# Backend handles conversion automatically
price_inr = Decimal("2500")  # ₹2500
price_wei = blockchain_service.convert_inr_to_wei(price_inr)
# → ~12500000000000000 Wei (0.0125 ETH)
```

### 2. Host Stake Management
```python
# When creating event, platform pays host's stake
# (20% of total event value)
total_value = price_per_seat * max_seats
host_stake = total_value * 0.20
# Returned to host after event completion
```

### 3. User Stake Tracking
```python
# When booking, user pays:
# - Ticket price (goes to host)
# - 20% stake (returned if attended)
booking_cost = price + (price * 0.20)
```

### 4. Smart Payout Distribution
```python
# On event completion:
# - Attendees: Get stake back
# - No-shows: Forfeit stake
# - Host: Gets payment + stake back
# - Platform: Gets 5% platform fee
```

## Benefits of Backend Integration

### ✅ Pros
1. **Frontend Simplicity** - No Web3 complexity in frontend
2. **Better UX** - Users don't manage gas fees
3. **Consistent API** - Same endpoints, blockchain is transparent
4. **Error Handling** - Centralized transaction management
5. **Security** - Private keys managed server-side
6. **Analytics** - Track all blockchain activity

### ⚠️ Considerations
1. **Gas Costs** - Platform pays gas (needs monitoring)
2. **Transaction Speed** - 12-second block time on Sepolia
3. **Failure Handling** - Need retry logic for failed txs
4. **Key Management** - Platform private key security critical

## Testing Checklist

Before deploying:
- [ ] Platform wallet has test ETH
- [ ] RPC connection works
- [ ] Database migration applied
- [ ] Environment variables set
- [ ] Create event works
- [ ] Booking calculation works
- [ ] Event completion works
- [ ] Cancellation works
- [ ] Error handling tested
- [ ] Gas usage monitored

## Support & Resources

- **Contract**: https://sepolia.etherscan.io/address/0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
- **Faucet**: https://sepoliafaucet.com/
- **Alchemy**: https://dashboard.alchemy.com/
- **Web3.py**: https://web3py.readthedocs.io/

---

## Ready for Step 1: Environment Setup! 🎬

Let me know when you've:
1. Got your Alchemy API key
2. Generated platform wallet
3. Funded it with test ETH
4. Updated `.env`

Then we'll run the migration and modify the event service!

