# 🎉 Smart Contract Integration Complete!

## ✅ What's Been Done

### 1. Smart Contract Deployed ✅
- **Contract Address**: `0x09aB660CEac220678b42E0e23DebCb1475e1eAD5`
- **Network**: Sepolia Testnet (Chain ID: 11155111)
- **View on Etherscan**: https://sepolia.etherscan.io/address/0x09aB660CEac220678b42E0e23DebCb1475e1eAD5

### 2. Frontend Integration Complete ✅

#### Created Files:
```
frontend/
├── src/
│   ├── lib/
│   │   ├── contract-abi.ts       ✅ Contract ABI & config
│   │   └── contract.ts           ✅ React hooks for all functions
│   ├── components/
│   │   ├── CreateEventForm.tsx   ✅ Host creates events
│   │   ├── BookEventButton.tsx   ✅ Users book events
│   │   ├── HostDashboard.tsx     ✅ Host manages events
│   │   └── UserBookings.tsx      ✅ Users view bookings
│   └── app/
│       └── test-contract/
│           └── page.tsx          ✅ Full testing page
├── .env.local                    ✅ Contract address configured
└── CONTRACT_INTEGRATION.md       ✅ Complete documentation
```

### 3. Environment Configured ✅
Your `.env.local` has:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
NEXT_PUBLIC_CHAIN_ID=11155111
```

## 🚀 How to Test

### Step 1: Get Test ETH
Visit: https://sepoliafaucet.com/
- Connect your wallet
- Request Sepolia ETH (free)
- Wait ~30 seconds

### Step 2: Start Frontend
```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/frontend
npm run dev
```

### Step 3: Test the Integration
Visit: http://localhost:3000/test-contract

This page has 4 tabs:
1. **Create Event** - Host stakes 20% and creates event
2. **Book Event** - User pays + stakes 20%
3. **Host Dashboard** - Manage and complete events
4. **My Bookings** - View booking status

### Step 4: Full Workflow Test

1. **Connect Wallet**
   - Click "Connect Wallet" in navbar
   - Select MetaMask
   - Make sure you're on Sepolia network

2. **Create Event (as Host)**
   - Go to "Create Event" tab
   - Set price: 0.01 ETH (cheap for testing)
   - Set seats: 4
   - Choose a future date
   - Click "Create Event"
   - Approve transaction (will stake 0.008 ETH = 20% of 0.04 ETH total)
   - Wait for confirmation

3. **Book Event (as User)**
   - Switch to a different wallet address OR use same wallet
   - Go to "Book Event" tab
   - Select number of seats
   - Review cost breakdown
   - Click "Confirm & Pay"
   - Approve transaction (pays ticket + 20% stake)
   - Wait for confirmation

4. **Complete Event (as Host)**
   - Switch back to host wallet
   - Go to "Host Dashboard" tab
   - Find your event
   - Click "Complete Event"
   - Select which bookings attended
   - Confirm transaction
   - Attendees get stakes back, host gets paid!

## 📖 Using in Your App

### Example: In Event Details Page
```tsx
// src/app/experiences/[id]/runs/[runId]/page.tsx
import BookEventButton from '@/components/BookEventButton';

export default function EventRunPage({ params }) {
  // Fetch event data from your backend
  const eventRun = await fetchEventRun(params.runId);
  
  return (
    <div>
      <h1>{eventRun.title}</h1>
      {/* Your existing UI */}
      
      <BookEventButton 
        eventRunId={eventRun.id} 
        availableSeats={eventRun.maxSeats - eventRun.seatsBooked} 
      />
    </div>
  );
}
```

### Example: In Host Dashboard
```tsx
// src/app/host-dashboard/page.tsx
import CreateEventForm from '@/components/CreateEventForm';
import HostDashboard from '@/components/HostDashboard';

export default function HostDashboardPage() {
  return (
    <div className="space-y-8">
      <CreateEventForm experienceId="exp-123" />
      <HostDashboard />
    </div>
  );
}
```

## 🔑 Key Contract Functions

### Host Functions
- **createEventRun()** - Create event with 20% stake
- **completeEvent()** - Mark event complete, distribute funds
- **cancelEvent()** - Cancel and refund everyone

### User Functions
- **bookEvent()** - Book seats with payment + stake
- **getUserBookings()** - View all your bookings

### Read Functions
- **getEventRun()** - Get event details
- **getBooking()** - Get booking details
- **calculateBookingCost()** - Preview total cost

## 💡 Staking Logic Recap

### Host Creates Event
- Event: 0.1 ETH/seat × 10 seats = 1 ETH total
- **Host stakes: 0.2 ETH (20%)**
- Locked until event completes

### User Books Event
- 2 seats × 0.1 ETH = 0.2 ETH (ticket price)
- **User stakes: 0.04 ETH (20% of ticket)**
- **Total payment: 0.24 ETH**
- Stake returned if user attends

### Event Completes
- Host gets: 0.2 ETH (payment) + 0.2 ETH (stake back) = **0.4 ETH**
- User gets: 0.04 ETH (stake back)
- Platform keeps: Small fee (5%)

### No-Show
- User doesn't attend
- User forfeits: 0.04 ETH stake
- Goes to platform/host

## 🎨 Customization

All components use Tailwind CSS and are fully customizable:
- Change colors in `className` props
- Add your own validation
- Integrate with your backend API
- Add loading animations
- Customize error messages

## 📊 Contract Events

The contract emits events for real-time updates:
- `EventRunCreated` - New event created
- `BookingCreated` - New booking made
- `EventCompleted` - Event finished
- `BookingCompleted` - User stake returned
- `BookingNoShow` - User stake forfeited
- `EventCancelled` - Event cancelled

You can listen to these in your frontend for live updates!

## 🔐 Security Notes

- Contract is **immutable** once deployed
- All funds are held in the contract
- Only host can complete their events
- Only host can cancel their events
- Automatic refunds on cancellation
- No admin backdoors

## 📝 Next Steps

1. ✅ Test all functions on `/test-contract` page
2. ✅ Integrate components into your existing pages
3. ✅ Sync event data with your backend
4. ✅ Add email notifications for events
5. ✅ Deploy to mainnet when ready

## 🆘 Troubleshooting

### "Insufficient funds"
- Get more test ETH from faucet
- Use smaller amounts (0.01 ETH instead of 0.1 ETH)

### "Wrong network"
- Switch to Sepolia in MetaMask
- Network should show "Sepolia test network"

### "Transaction failed"
- Check you have enough ETH for gas
- Verify contract address in `.env.local`
- Check event hasn't already completed

### Components not showing data
- Make sure wallet is connected
- Verify you're on Sepolia network
- Check browser console for errors

## 🎯 Production Deployment

When ready for mainnet:

1. Update `hardhat.config.js` to use mainnet
2. Deploy to mainnet: `npx hardhat run scripts/deploy.js --network mainnet`
3. Update `.env.local` with new contract address
4. Change `NEXT_PUBLIC_CHAIN_ID` to `1` (mainnet)
5. **Get contract audited** (very important for mainnet!)

## 📚 Additional Resources

- **Wagmi Docs**: https://wagmi.sh/react/getting-started
- **Viem Docs**: https://viem.sh/
- **Hardhat Docs**: https://hardhat.org/getting-started/
- **Solidity Docs**: https://docs.soliditylang.org/
- **Contract Integration Guide**: `CONTRACT_INTEGRATION.md`

---

**Contract deployed and integrated! 🚀**
Ready to test at: http://localhost:3000/test-contract

Need help? Check `CONTRACT_INTEGRATION.md` for detailed docs!

