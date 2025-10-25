# 🔗 Blockchain Integration Guide

## Overview

This guide explains how the Mayhouse backend integrates with the MayhouseExperience smart contract deployed on Sepolia testnet.

## Architecture

```
Frontend → Backend API → Blockchain Service → Smart Contract
                ↓
            Database (Supabase)
```

### Key Components

1. **blockchain_service.py** - Handles all Web3 interactions
2. **event_run_service.py** - Modified to create events on-chain
3. **Database** - Stores blockchain IDs and transaction hashes
4. **Smart Contract** - Manages stakes and payments

## Setup

### 1. Install Dependencies

Already installed in `requirements.txt`:
- `web3==7.6.0`
- `eth-account>=0.13.1`
- `hexbytes>=1.2.0`

### 2. Run Database Migration

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/backend

# Apply migration to add blockchain columns
psql -h your-supabase-host -U postgres -d postgres -f database/migrations/002_add_blockchain_integration.sql
```

Or through Supabase dashboard:
1. Go to SQL Editor
2. Paste contents of `002_add_blockchain_integration.sql`
3. Run

### 3. Configure Environment Variables

Update your `.env` file:

```bash
# Blockchain Settings
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
CONTRACT_ADDRESS=0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
PLATFORM_PRIVATE_KEY=your_platform_wallet_private_key_here
ETH_PRICE_INR=200000  # Update periodically for accurate conversions
```

### 4. Get Platform Wallet

The platform needs a wallet to pay gas fees for transactions:

```bash
# Generate a new wallet (or use existing)
python3 -c "from eth_account import Account; acc = Account.create(); print(f'Address: {acc.address}\\nPrivate Key: {acc.key.hex()}')"
```

**Important**: 
- Keep the private key secret
- Add the address to your `.env` as `PLATFORM_PRIVATE_KEY`
- Send some Sepolia ETH to this address for gas fees (https://sepoliafaucet.com/)

## Database Schema Changes

### event_runs table

New columns:
- `blockchain_event_run_id` (INTEGER) - Smart contract event ID
- `blockchain_tx_hash` (TEXT) - Transaction hash
- `blockchain_status` (ENUM) - Sync status: pending, confirmed, failed

### event_run_bookings table

New columns:
- `blockchain_booking_id` (INTEGER) - Smart contract booking ID
- `blockchain_tx_hash` (TEXT) - Transaction hash
- `blockchain_stake_amount_wei` (BIGINT) - User's stake in Wei

## How It Works

### Creating an Event Run

**Flow**:
1. Host calls `POST /hosts/event-runs` with event details
2. Backend creates record in database
3. Backend calls `blockchain_service.create_event_run_onchain()`
4. Smart contract creates event and stakes 20% (paid by platform for now)
5. Backend stores `blockchain_event_run_id` and `tx_hash`
6. Returns response with both database ID and blockchain ID

**Code** (in `event_run_service.py`):
```python
# After creating in database
blockchain_id, tx_hash = await blockchain_service.create_event_run_onchain(
    experience_id=event_run_data.experience_id,
    price_inr=effective_price,
    max_seats=event_run_data.max_capacity,
    event_timestamp=event_run_data.start_datetime,
    host_wallet_address=host_wallet_address
)

# Update database with blockchain info
await self._update_blockchain_info(event_run_id, blockchain_id, tx_hash)
```

### Booking an Event

**Flow**:
1. User calls `POST /bookings` with event_run_id and seat_count
2. Backend calculates cost using `blockchain_service.calculate_booking_cost()`
3. Returns payment details (ticket price + 20% stake)
4. User confirms and signs blockchain transaction from frontend
5. Backend records booking with `blockchain_booking_id`

### Completing an Event

**Flow**:
1. Host calls `POST /hosts/event-runs/{id}/complete` with attendee list
2. Backend fetches all bookings for the event
3. Maps database booking IDs to blockchain booking IDs
4. Calls `blockchain_service.complete_event_onchain()`
5. Smart contract:
   - Returns stakes to attendees
   - Forfeits no-show stakes
   - Pays host + returns host stake
6. Backend updates all booking statuses

### Cancelling an Event

**Flow**:
1. Host calls `DELETE /hosts/event-runs/{id}`
2. Backend calls `blockchain_service.cancel_event_onchain()`
3. Smart contract refunds all users (payment + stake)
4. Host gets stake back
5. Backend marks event as cancelled

## Currency Conversion

### INR ↔ Wei Conversion

The system converts between Indian Rupees (database) and Wei (blockchain):

```python
# INR to Wei
price_inr = Decimal("2500")  # ₹2500
wei_amount = blockchain_service.convert_inr_to_wei(price_inr)
# Result: ~12500000000000000 Wei (0.0125 ETH at ₹200,000/ETH)

# Wei to INR
wei_amount = 12500000000000000
price_inr = blockchain_service.convert_wei_to_inr(wei_amount)
# Result: Decimal("2500")
```

**Current Conversion Rate** (configurable):
- 1 ETH = ₹200,000
- Update `ETH_PRICE_INR` in `.env` as market changes

## Testing

### 1. Test Event Creation

```bash
curl -X POST http://localhost:8000/hosts/event-runs \
  -H "Content-Type: application/json" \
  -d '{
    "event_run_data": {
      "experience_id": "exp_123",
      "start_datetime": "2025-11-01T10:00:00Z",
      "end_datetime": "2025-11-01T13:00:00Z",
      "max_capacity": 4,
      "special_pricing_inr": 2500.00,
      "group_pairing_enabled": true
    },
    "host_id": "host_wallet_address_here"
  }'
```

### 2. Check Blockchain

Visit Sepolia Etherscan:
```
https://sepolia.etherscan.io/address/0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
```

Look for your transaction and verify the event was created.

### 3. Query Event from Chain

```python
from app.services.blockchain_service import blockchain_service

# Get event details from blockchain
event_data = await blockchain_service.get_event_run_from_chain(1)
print(event_data)
```

## API Endpoints

### New/Modified Endpoints

#### Create Event (Modified)
```
POST /hosts/event-runs
```
Now creates event on blockchain and stores blockchain_event_run_id

#### Get Event Details (Enhanced)
```
GET /event-runs/{id}
```
Returns both database and blockchain information

#### Book Event (New)
```
POST /bookings/calculate-cost
```
Calculate booking cost including 20% stake

```
POST /bookings/create
```
Create booking on blockchain

#### Complete Event (Modified)
```
POST /hosts/event-runs/{id}/complete
Body: { "attended_booking_ids": [1, 2, 3] }
```
Completes event on blockchain, distributes funds

## Security Considerations

### Private Key Management

⚠️ **CRITICAL**: Never commit private keys to version control!

- Store `PLATFORM_PRIVATE_KEY` in `.env` (git ignored)
- Use environment variables in production
- Consider using AWS Secrets Manager or similar for production
- Rotate keys regularly

### Gas Management

The platform wallet pays gas fees. Monitor balance:

```python
balance = blockchain_service.w3.eth.get_balance(platform_account.address)
balance_eth = blockchain_service.w3.from_wei(balance, 'ether')
print(f"Platform balance: {balance_eth} ETH")
```

### Transaction Failures

If a blockchain transaction fails:
- Database record is created but `blockchain_status` = 'failed'
- Implement retry logic or manual intervention
- Consider webhook for transaction monitoring

## Monitoring

### Check Sync Status

```sql
-- Events pending blockchain confirmation
SELECT id, experience_id, blockchain_status, blockchain_tx_hash
FROM event_runs
WHERE blockchain_status = 'pending';

-- Failed transactions
SELECT id, experience_id, blockchain_tx_hash
FROM event_runs
WHERE blockchain_status = 'failed';
```

### Track Blockchain Events

Monitor contract events using Web3:

```python
# Listen for EventRunCreated events
event_filter = blockchain_service.contract.events.EventRunCreated.create_filter(fromBlock='latest')
events = event_filter.get_all_entries()
```

## Troubleshooting

### "Failed to connect to blockchain"
- Check `BLOCKCHAIN_RPC_URL` in `.env`
- Verify Alchemy API key is valid
- Test RPC endpoint: `curl https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

### "Insufficient funds for gas"
- Platform wallet needs Sepolia ETH
- Get free testnet ETH: https://sepoliafaucet.com/
- Check balance: `cast balance $PLATFORM_ADDRESS --rpc-url $RPC_URL`

### "Transaction failed"
- Check gas limit (default: 500,000)
- Verify contract is on correct network
- Check event hasn't already been created
- Review transaction on Etherscan for revert reason

### "Event run not found on blockchain"
- Database has record but blockchain doesn't
- Check `blockchain_event_run_id` is not null
- Verify transaction was confirmed
- Check if using correct contract address

## Next Steps

1. ✅ **Run database migration**
2. ✅ **Configure `.env` with blockchain settings**
3. ✅ **Fund platform wallet with test ETH**
4. ⏳ **Modify `event_run_service.py` to integrate blockchain**
5. ⏳ **Add new booking endpoints**
6. ⏳ **Test create → book → complete flow**
7. ⏳ **Add error handling and retries**
8. ⏳ **Implement transaction monitoring**

## Resources

- **Contract on Sepolia**: https://sepolia.etherscan.io/address/0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
- **Web3.py Docs**: https://web3py.readthedocs.io/
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Alchemy Dashboard**: https://dashboard.alchemy.com/

---

**Ready to integrate!** 🚀

Next: Modify `event_run_service.py` to call blockchain on event creation.

