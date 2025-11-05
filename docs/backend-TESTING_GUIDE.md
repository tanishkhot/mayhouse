# 🧪 Backend Blockchain Integration - Testing Guide

## ✅ Integration Complete!

All blockchain integration code is now in place and ready to test!

## 🎯 What's Been Integrated

### 1. Event Run Service (`app/services/event_run_service.py`)
- ✅ Modified `create_event_run()` to call blockchain after DB creation
- ✅ Stores `blockchain_event_run_id` and `tx_hash` in database
- ✅ Handles errors gracefully (marks as 'failed' if blockchain fails)
- ✅ Works with or without host wallet address

### 2. Blockchain API (`app/api/blockchain.py`)
New endpoints:
- ✅ `POST /blockchain/calculate-booking-cost` - Get cost including stake
- ✅ `POST /blockchain/complete-event` - Complete event and distribute funds
- ✅ `GET /blockchain/status/{event_run_id}` - Check blockchain sync status
- ✅ `GET /blockchain/conversion/inr-to-wei` - Currency converter
- ✅ `GET /blockchain/conversion/wei-to-inr` - Currency converter

### 3. Main Application (`main.py`)
- ✅ Registered blockchain router
- ✅ Added to root endpoint documentation

## 🚀 Setup Before Testing

### Step 1: Configure Environment (5 mins)

1. **Get Alchemy API Key**:
   ```bash
   # Visit https://dashboard.alchemy.com/
   # Create app → Ethereum → Sepolia
   # Copy API key
   ```

2. **Generate Platform Wallet**:
   ```bash
   cd backend
   python3 << EOF
   from eth_account import Account
   acc = Account.create()
   print(f"Address: {acc.address}")
   print(f"Private Key: {acc.key.hex()}")
   EOF
   ```

3. **Fund Platform Wallet**:
   - Visit https://sepoliafaucet.com/
   - Enter your platform address
   - Request 0.5 Sepolia ETH

4. **Update `.env`**:
   ```bash
   nano .env
   ```
   
   Add these lines:
   ```env
   BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY_HERE
   CONTRACT_ADDRESS=0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
   PLATFORM_PRIVATE_KEY=0x...your_private_key...
   ETH_PRICE_INR=200000
   ```

### Step 2: Run Database Migration (2 mins)

Via Supabase Dashboard:
1. Open SQL Editor
2. Copy contents of `database/migrations/002_add_blockchain_integration.sql`
3. Click "Run"

OR via CLI:
```bash
psql -h your-supabase-host -U postgres -d postgres \
  -f database/migrations/002_add_blockchain_integration.sql
```

### Step 3: Start Backend Server

```bash
cd backend

# Activate venv if using one
source venv/bin/activate

# Start server
python main.py
```

Server should start on http://localhost:8000

## 🧪 Testing Procedures

### Test 1: Check Backend is Running

```bash
curl http://localhost:8000/
```

Expected response:
```json
{
  "message": "Welcome to Mayhouse ETH Backend",
  "version": "1.0.0",
  "blockchain": "/blockchain"
}
```

### Test 2: Check Blockchain Connection

```bash
curl http://localhost:8000/health/
```

### Test 3: Currency Conversion

```bash
# INR to Wei
curl "http://localhost:8000/blockchain/conversion/inr-to-wei?amount_inr=2500"

# Expected response:
{
  "amount_inr": 2500.0,
  "amount_wei": 12500000000000000,
  "amount_eth": 0.0125,
  "eth_price_inr": 200000
}
```

### Test 4: Create Event Run (WITH Blockchain)

**Prerequisites**:
- Host must have `wallet_address` in users table
- Experience must exist and be approved

```bash
curl -X POST http://localhost:8000/hosts/event-runs \
  -H "Content-Type: application/json" \
  -d '{
    "event_run_data": {
      "experience_id": "your_experience_id_here",
      "start_datetime": "2025-11-01T10:00:00Z",
      "end_datetime": "2025-11-01T13:00:00Z",
      "max_capacity": 4,
      "special_pricing_inr": 2500.00,
      "group_pairing_enabled": true
    },
    "host_id": "your_host_user_id_here"
  }'
```

**What happens**:
1. Event created in database
2. Backend calls smart contract
3. Platform pays host's stake (20% of total value)
4. Returns response with `blockchain_event_run_id`

**Expected response** (partial):
```json
{
  "id": "db_event_run_id",
  "blockchain_event_run_id": 1,
  "blockchain_tx_hash": "0x...",
  "blockchain_status": "confirmed",
  "experience_id": "...",
  ...
}
```

**Check on Etherscan**:
```
https://sepolia.etherscan.io/tx/TRANSACTION_HASH
```

### Test 5: Check Blockchain Status

```bash
curl http://localhost:8000/blockchain/status/EVENT_RUN_ID
```

Expected response:
```json
{
  "event_run_id": "...",
  "blockchain_event_run_id": 1,
  "blockchain_tx_hash": "0x...",
  "blockchain_status": "confirmed",
  "on_chain_data": {
    "eventRunId": 1,
    "host": "0x...",
    "pricePerSeat": 12500000000000000,
    "pricePerSeatINR": 2500.0,
    "maxSeats": 4,
    "seatsBooked": 0,
    "status": 1
  }
}
```

### Test 6: Calculate Booking Cost

```bash
curl -X POST http://localhost:8000/blockchain/calculate-booking-cost \
  -H "Content-Type: application/json" \
  -d '{
    "event_run_id": "your_event_run_id",
    "seat_count": 2
  }'
```

Expected response:
```json
{
  "event_run_id": "...",
  "blockchain_event_run_id": 1,
  "seat_count": 2,
  "price_per_seat_inr": 2500.0,
  "total_price_inr": 5000.0,
  "stake_inr": 1000.0,
  "total_cost_inr": 6000.0,
  "price_per_seat_wei": 12500000000000000,
  "stake_wei": 2500000000000000,
  "total_cost_wei": 27500000000000000
}
```

### Test 7: Complete Event

**Prerequisites**:
- Event must exist on blockchain
- Event timestamp must have passed
- You need booking IDs

```bash
curl -X POST http://localhost:8000/blockchain/complete-event \
  -H "Content-Type: application/json" \
  -d '{
    "event_run_id": "your_event_run_id",
    "attended_booking_ids": ["booking_id_1", "booking_id_2"]
  }'
```

**What happens**:
1. Fetches all bookings
2. Maps DB IDs → Blockchain IDs
3. Calls smart contract
4. Attendees get stakes back
5. No-shows forfeit stakes
6. Host gets payment + stake
7. Updates all booking statuses

Expected response:
```json
{
  "event_run_id": "...",
  "blockchain_event_run_id": 1,
  "transaction_hash": "0x...",
  "attended_count": 2,
  "no_show_count": 1,
  "message": "Event completed successfully. 2 attended, 1 no-shows."
}
```

## 🔍 Debugging

### Check Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Or check console output where server is running
```

### Common Issues

#### 1. "Failed to connect to blockchain"
```bash
# Test RPC connection
curl https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1"}'
```

**Fix**: Check `BLOCKCHAIN_RPC_URL` in `.env`

#### 2. "Insufficient funds for gas"
```bash
# Check platform wallet balance
python3 << EOF
from web3 import Web3
from app.core.config import get_settings
settings = get_settings()
w3 = Web3(Web3.HTTPProvider(settings.blockchain_rpc_url))
balance = w3.eth.get_balance(settings.platform_account_address)
print(f"Balance: {w3.from_wei(balance, 'ether')} ETH")
EOF
```

**Fix**: Add more Sepolia ETH from faucet

#### 3. "Host wallet address not found"
```sql
-- Check if host has wallet address
SELECT id, wallet_address FROM users WHERE id = 'host_id';
```

**Fix**: Add wallet address to user:
```sql
UPDATE users SET wallet_address = '0x...' WHERE id = 'host_id';
```

#### 4. "Event not yet synced to blockchain"
```sql
-- Check blockchain sync status
SELECT id, blockchain_event_run_id, blockchain_status 
FROM event_runs WHERE id = 'event_run_id';
```

**Fix**: 
- If `blockchain_status` = 'pending': Wait or retry
- If `blockchain_status` = 'failed': Check logs and retry manually

### Manual Blockchain Interaction

```python
# Test blockchain service directly
python3 << EOF
import asyncio
from app.services.blockchain_service import blockchain_service
from decimal import Decimal
from datetime import datetime, timedelta

async def test():
    # Check connection
    print(f"Connected: {blockchain_service.w3.is_connected()}")
    
    # Get current block
    block = blockchain_service.w3.eth.block_number
    print(f"Current block: {block}")
    
    # Test currency conversion
    inr = Decimal("2500")
    wei = blockchain_service.convert_inr_to_wei(inr)
    print(f"₹{inr} = {wei} Wei")
    
    # Read event from chain (if exists)
    try:
        event_data = await blockchain_service.get_event_run_from_chain(1)
        print(f"Event 1: {event_data}")
    except:
        print("Event 1 not found")

asyncio.run(test())
EOF
```

## 📊 Monitoring

### Database Queries

```sql
-- Events by blockchain status
SELECT blockchain_status, COUNT(*) 
FROM event_runs 
GROUP BY blockchain_status;

-- Failed blockchain syncs
SELECT id, experience_id, blockchain_tx_hash, created_at
FROM event_runs
WHERE blockchain_status = 'failed';

-- Events pending blockchain sync
SELECT id, experience_id, created_at
FROM event_runs
WHERE blockchain_status = 'pending';
```

### Etherscan Monitoring

Check all platform transactions:
```
https://sepolia.etherscan.io/address/YOUR_PLATFORM_ADDRESS
```

Check specific transaction:
```
https://sepolia.etherscan.io/tx/TRANSACTION_HASH
```

## ✅ Success Criteria

Event creation is successful when:
- ✅ Event created in database
- ✅ `blockchain_event_run_id` is set
- ✅ `blockchain_status` = 'confirmed'
- ✅ Transaction visible on Etherscan
- ✅ Event readable from smart contract
- ✅ Cost calculation returns correct amounts

## 🎯 Full Integration Test

### Complete Flow Test:

1. **Setup** ✅
   - Environment configured
   - Migration applied
   - Server running

2. **Create Event** ✅
   - POST to `/hosts/event-runs`
   - Verify blockchain_event_run_id returned
   - Check transaction on Etherscan

3. **Check Status** ✅
   - GET `/blockchain/status/{id}`
   - Verify 'confirmed' status
   - Verify on-chain data matches

4. **Calculate Cost** ✅
   - POST to `/blockchain/calculate-booking-cost`
   - Verify 20% stake calculated
   - Verify Wei amounts match INR

5. **Complete Event** (when ready) ✅
   - POST to `/blockchain/complete-event`
   - Verify transaction succeeds
   - Check balances on Etherscan

## 📝 Test Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Platform wallet funded
- [ ] Backend server starts without errors
- [ ] Health check passes
- [ ] Currency conversion works
- [ ] Event creation succeeds
- [ ] Blockchain sync confirmed
- [ ] Cost calculation accurate
- [ ] Complete event succeeds
- [ ] Etherscan shows transactions

## 🆘 Need Help?

- **Check Logs**: Backend console output
- **Check Database**: Supabase dashboard
- **Check Blockchain**: Sepolia Etherscan
- **Test Connection**: `curl` health endpoint
- **Manual Test**: Python blockchain_service

---

**Ready to test! 🚀**

Start with Step 1 (Setup) and work through each test sequentially.

