# 🔐 Mayhouse Experience Smart Contract

## Overview

This smart contract implements a **staking-based booking system** for Mayhouse experiences where both hosts and users stake funds to ensure commitment.

---

## 💡 **How It Works**

### **Host Creates Event:**
1. Host creates an event run with price per seat and max seats
2. Host must stake **20% of total event value** upfront
   - Example: ₹1000/seat × 4 seats = ₹4000 total
   - Host stakes: ₹800 (20% of ₹4000)
3. Stake is held in contract until event completion

### **User Books Event:**
1. User pays **ticket price + 20% stake**
   - Example: ₹1000 ticket + ₹200 stake = ₹1200 total
2. Both payment and stake are held in contract

### **Event Completion:**
1. After event, host marks who attended
2. **Attendees:**
   - Get their stake back (₹200)
   - Host keeps payment (₹1000)
3. **No-shows:**
   - Forfeit their stake (₹200)
   - Payment goes to host (₹1000)
4. **Host:**
   - Receives all payments (minus 5% platform fee)
   - Gets their full stake back (₹800)

### **Event Cancellation:**
1. Host can cancel before event
2. All users get full refund (payment + stake)
3. Host gets their stake back

---

## 📊 **Smart Contract Features**

### ✅ **Core Functions**

#### **For Hosts:**
- `createEventRun()` - Create event and stake funds
- `completeEvent()` - Mark attendees after event
- `cancelEvent()` - Cancel and refund everyone

#### **For Users:**
- `bookEvent()` - Book seats (payment + stake)
- View functions to check bookings

#### **For Platform:**
- `updatePlatformFee()` - Adjust platform fee (default 5%)
- `updateStakePercentage()` - Adjust stake requirement (default 20%)
- `withdrawPlatformFees()` - Withdraw collected fees

### 🔒 **Security Features**

- ✅ Reentrancy protection
- ✅ Access control (only host/owner can complete events)
- ✅ Time-based validations
- ✅ Stake calculations verified
- ✅ Emergency withdraw function

### 📈 **Gas Optimizations**

- Uses `uint256` for IDs (cheaper than strings)
- Batch operations where possible
- Efficient mappings for lookups
- Minimal storage variables

---

## 🎯 **Usage Examples**

### **Example 1: Full Flow**

```solidity
// 1. Host creates event
// Price: 0.1 ETH/seat, 4 seats
// Host stakes: 0.08 ETH (20% of 0.4 ETH)
createEventRun("exp_123", 0.1 ether, 4, eventTimestamp) 
  { value: 0.08 ether }

// 2. User A books 2 seats
// Payment: 0.2 ETH, Stake: 0.04 ETH
bookEvent(eventRunId, 2) 
  { value: 0.24 ether }

// 3. User B books 2 seats  
// Payment: 0.2 ETH, Stake: 0.04 ETH
bookEvent(eventRunId, 2) 
  { value: 0.24 ether }

// 4. Event happens
// Both users attend

// 5. Host completes event
completeEvent(eventRunId, [bookingId1, bookingId2])

// Results:
// - User A gets 0.04 ETH stake back ✅
// - User B gets 0.04 ETH stake back ✅
// - Host gets 0.38 ETH (0.4 - 5% fee) ✅
// - Host gets 0.08 ETH stake back ✅
// - Platform gets 0.02 ETH (5% fee) ✅
```

### **Example 2: With No-Show**

```solidity
// Same setup as above, but User B doesn't show up

completeEvent(eventRunId, [bookingId1]) // Only User A attended

// Results:
// - User A gets 0.04 ETH stake back ✅
// - User B forfeits 0.04 ETH stake ❌
// - Host still gets full payment 0.38 ETH ✅
// - Host gets 0.08 ETH stake back ✅
// - Platform keeps forfeited stakes
```

### **Example 3: Event Cancellation**

```solidity
// Host cancels before event
cancelEvent(eventRunId)

// Results:
// - User A gets 0.24 ETH back (full refund) ✅
// - User B gets 0.24 ETH back (full refund) ✅
// - Host gets 0.08 ETH stake back ✅
// - Everyone made whole
```

---

## 💰 **Payment Breakdown**

### **For a ₹1000/seat event with 4 seats:**

| Party | Stake In | If Completed | If Cancelled |
|-------|----------|--------------|--------------|
| **Host** | ₹800 (20%) | Gets ₹3800 + ₹800 back | Gets ₹800 back |
| **User (attended)** | ₹1000 + ₹200 | Gets ₹200 back | Gets ₹1200 back |
| **User (no-show)** | ₹1000 + ₹200 | Forfeits ₹200 | Gets ₹1200 back |
| **Platform** | ₹0 | Gets ₹200 (5%) | Gets ₹0 |

---

## 🔧 **Contract State**

### **Event Run States:**
- `Created` - Host created and staked
- `Active` - Accepting bookings
- `Full` - All seats booked
- `Completed` - Event finished, stakes released
- `Cancelled` - Event cancelled, refunds issued

### **Booking States:**
- `Active` - Booking confirmed
- `Completed` - Attended, stake returned
- `NoShow` - Didn't attend, stake forfeited
- `Cancelled` - Booking cancelled, refunded

---

## 📦 **Data Structures**

### **EventRun:**
```solidity
{
  eventRunId: uint256,
  host: address,
  experienceId: string,
  pricePerSeat: uint256,
  maxSeats: uint256,
  seatsBooked: uint256,
  hostStake: uint256,
  eventTimestamp: uint256,
  status: EventStatus
}
```

### **Booking:**
```solidity
{
  bookingId: uint256,
  eventRunId: uint256,
  user: address,
  seatCount: uint256,
  totalPayment: uint256,
  userStake: uint256,
  status: BookingStatus
}
```

---

## 🚀 **Deployment**

### **Prerequisites:**
- Hardhat or Foundry setup
- Testnet ETH (Sepolia recommended)
- Wallet with private key

### **Deploy Commands:**
```bash
# Using Hardhat
npx hardhat run scripts/deploy.js --network sepolia

# Using Foundry
forge create --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/MayhouseExperience.sol:MayhouseExperience
```

---

## 🧪 **Testing**

### **Test Cases:**
- ✅ Host can create event with proper stake
- ✅ User can book with payment + stake
- ✅ Event completion returns stakes correctly
- ✅ No-show forfeits stake
- ✅ Cancellation refunds everyone
- ✅ Platform fee calculation
- ✅ Access control (only host can cancel)
- ✅ Time validations (event in future)

---

## 🔐 **Security Considerations**

### **Already Implemented:**
- ✅ Reentrancy protection (checks-effects-interactions)
- ✅ Integer overflow protection (Solidity 0.8.x)
- ✅ Access control modifiers
- ✅ Input validation
- ✅ Emergency withdraw

### **Recommended Audits:**
- [ ] Professional security audit
- [ ] Formal verification
- [ ] Testnet deployment first
- [ ] Bug bounty program

---

## 📈 **Future Enhancements**

### **Phase 2 Features:**
- ⬜ Partial refunds (cancel with penalty)
- ⬜ Dynamic stake percentages per event
- ⬜ Reputation system (affects stake amount)
- ⬜ Multi-token support (not just ETH)
- ⬜ Escrow for disputes
- ⬜ DAO governance for parameters

### **Integration Features:**
- ⬜ Oracle for fiat price feeds
- ⬜ NFT tickets (ERC-721)
- ⬜ Loyalty tokens (ERC-20)
- ⬜ IPFS metadata storage

---

## 📞 **Contact & Support**

- **Contract Version:** 1.0.0
- **Solidity Version:** 0.8.20
- **License:** MIT
- **Chain:** Ethereum (+ L2s compatible)

---

## ⚠️ **Important Notes**

1. **Test thoroughly** before mainnet deployment
2. **Use testnet first** (Sepolia, Mumbai)
3. **Audit the contract** before production
4. **Monitor gas costs** - optimize if needed
5. **Have emergency procedures** ready

---

**Built with ❤️ for Mayhouse**

*Enabling trustless, commitment-based experience bookings on Ethereum*

