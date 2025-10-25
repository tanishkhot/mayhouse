# 🚀 Quick Start - Testing Your Smart Contract

## The Issue You're Facing

The "Book Experience" button on `/experiences/[experienceId]/runs/[runId]/page.tsx` is now connected to the smart contract, BUT you need actual event runs created on the blockchain first!

## ✅ Here's How to Test Everything

### Step 1: Get Test ETH (if you haven't already)
Visit: https://sepoliafaucet.com/
- Connect your wallet
- Request Sepolia ETH
- Wait ~30 seconds

### Step 2: Start Your Frontend
```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/frontend
npm run dev
```

### Step 3: Go to the Test Page
Visit: **http://localhost:3000/test-contract**

This page has everything working out of the box!

### Step 4: Create Your First Event Run

1. **Connect your wallet** (click "Connect Wallet" in navbar)
2. Make sure you're on **Sepolia Testnet**
3. Go to the **"Create Event"** tab
4. Fill in the form:
   - Price per seat: `0.01` ETH (cheap for testing!)
   - Max seats: `4`
   - Pick a future date
5. Click **"Create Event"**
6. MetaMask will pop up asking you to approve
7. You'll stake 20% (0.008 ETH for a 0.04 ETH total event)
8. Wait for confirmation ✅

### Step 5: Book the Event You Just Created

1. Go to the **"Book Event"** tab
2. Note: The sample shows `eventRunId={1}` 
3. If this is your first event, it will be ID `1` ✅
4. Click **"Book Now"**
5. Select number of seats
6. Click **"Confirm & Pay"**
7. MetaMask pops up - you pay ticket price + 20% stake
8. Transaction confirms ✅

### Step 6: View Your Bookings

1. Go to **"My Bookings"** tab
2. You'll see your booking with status "Active"
3. Shows how much stake you'll get back

### Step 7: Complete the Event (as Host)

1. Go to **"Host Dashboard"** tab
2. Find your event
3. Click **"Complete Event"**
4. Select which bookings attended
5. Transaction confirms
6. Host gets paid + stake back
7. Users who attended get stakes back ✅

## 🎯 Why Your Experience Page Button Wasn't Working

The button IS working now, but here's the issue:

Your URL structure:
```
/experiences/exp_001/runs/run_123
```

The `runId` is `"run_123"` (a string from your database).

But the smart contract expects:
```
eventRunId = 1, 2, 3, etc (blockchain IDs)
```

### The Solution

You need to:

1. **Create events through the smart contract** (use `/test-contract` page)
2. **Store the blockchain event run ID** in your database alongside `run_123`
3. **Pass that blockchain ID** to the `BookEventButton`

## 🔧 How to Fix Your Experience Page Properly

Update your backend/database to store the blockchain event run ID:

```sql
-- Add column to your event_runs table
ALTER TABLE event_runs 
ADD COLUMN blockchain_event_run_id INTEGER;
```

Then when a host creates an event:
1. They call the smart contract → gets back `eventRunId` (e.g., 42)
2. You store `blockchain_event_run_id: 42` in your database
3. When user visits `/experiences/exp_001/runs/run_123`, you fetch that record
4. Pass `blockchain_event_run_id` to `BookEventButton`

Like this:

```tsx
// In your experience page
const { data: eventRun } = useQuery({
  queryKey: ["eventRun", runId],
  queryFn: () => fetchEventRun(runId), // Fetch from your database
});

<BookEventButton 
  eventRunId={eventRun.blockchain_event_run_id}  // ← Use blockchain ID!
  availableSeats={eventRun.available_spots}
/>
```

## 🎨 Quick Test Right Now

Want to test immediately without setting up the database?

Just visit: **http://localhost:3000/test-contract**

Everything works there! You can:
- ✅ Create events
- ✅ Book events  
- ✅ View bookings
- ✅ Complete events
- ✅ See transactions on Etherscan

## 📊 What Happens When You Click "Book Now"

1. Button checks if wallet is connected
2. Calculates total cost (ticket + 20% stake)
3. Calls smart contract `bookEvent()` function
4. MetaMask pops up showing:
   - Amount to pay
   - Gas fee
   - Total transaction
5. You approve
6. Transaction is sent to Sepolia
7. After ~12 seconds, transaction confirms
8. Your booking is recorded on the blockchain!
9. You'll see "✅ Booking Confirmed!"

## 🔍 Debugging Tips

### "Nothing happens when I click"
- Check browser console (F12) for errors
- Make sure wallet is connected
- Verify you're on Sepolia network

### "Transaction failed"
- Make sure you have enough Sepolia ETH
- Check the event run ID actually exists on blockchain
- Verify you're not trying to book a completed/cancelled event

### "It shows 'Event not found'"
- The `eventRunId` doesn't exist on the blockchain yet
- Create an event first using `/test-contract` page

## 📝 Next Steps

1. Test everything on `/test-contract` ✅
2. Add `blockchain_event_run_id` column to your database
3. Update host flow to create events on blockchain + database
4. Link your existing pages to use blockchain IDs
5. Test the full flow end-to-end

## 🆘 Still Having Issues?

Check these:
- ✅ Wallet connected?
- ✅ On Sepolia testnet?
- ✅ Have test ETH?
- ✅ Contract address in `.env.local`?
- ✅ Event run actually exists on blockchain?

Contract Address: `0x09aB660CEac220678b42E0e23DebCb1475e1eAD5`

View on Etherscan: https://sepolia.etherscan.io/address/0x09aB660CEac220678b42E0e23DebCb1475e1eAD5

---

**TL;DR**: Go to http://localhost:3000/test-contract and everything works! 🚀

