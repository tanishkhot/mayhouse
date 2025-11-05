# Smart Contract Integration Guide

## 🎯 Overview

Your MayhouseExperience smart contract is now deployed on **Sepolia Testnet** at:
```
0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
```

This guide will help you integrate the contract into your frontend.

## 📁 Files Created

### Core Integration Files
- **`src/lib/contract-abi.ts`** - Contract ABI and configuration
- **`src/lib/contract.ts`** - React hooks for contract interaction

### Example Components
- **`src/components/CreateEventForm.tsx`** - Host creates events with stake
- **`src/components/BookEventButton.tsx`** - Users book events with payment + stake
- **`src/components/HostDashboard.tsx`** - Host manages their events
- **`src/components/UserBookings.tsx`** - Users view their bookings

## 🚀 Quick Start

### 1. Environment Variables (Already Set)
Your `.env.local` already has:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
NEXT_PUBLIC_CHAIN_ID=11155111  # Sepolia
```

### 2. Get Test ETH
You'll need Sepolia ETH to interact with the contract:
- **Alchemy Faucet**: https://sepoliafaucet.com/
- **Chainlink Faucet**: https://faucets.chain.link/sepolia
- **Google Faucet**: https://cloud.google.com/application/web3/faucet/ethereum/sepolia

### 3. Use the Components

#### Example: Create Event Page
```tsx
// src/app/host-dashboard/page.tsx
import CreateEventForm from '@/components/CreateEventForm';

export default function HostPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CreateEventForm experienceId="experience-123" />
    </div>
  );
}
```

#### Example: Book Event Page
```tsx
// src/app/events/[id]/page.tsx
import BookEventButton from '@/components/BookEventButton';

export default function EventPage({ params }: { params: { id: string } }) {
  const eventRunId = 1; // Get from your database or API
  const availableSeats = 5;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Event Details</h1>
      <BookEventButton 
        eventRunId={eventRunId} 
        availableSeats={availableSeats} 
      />
    </div>
  );
}
```

#### Example: User Bookings Page
```tsx
// src/app/my-bookings/page.tsx
import UserBookings from '@/components/UserBookings';

export default function MyBookingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <UserBookings />
    </div>
  );
}
```

## 🔧 Contract Functions

### For Hosts

#### Create Event Run
```tsx
import { useCreateEventRun } from '@/lib/contract';

const { createEventRun, isPending, isSuccess } = useCreateEventRun();

// Create event with stake
await createEventRun(
  'experience-123',      // experienceId
  '0.1',                 // pricePerSeat in ETH
  10,                    // maxSeats
  1735689600            // eventTimestamp (Unix timestamp)
);
```

#### Complete Event
```tsx
import { useCompleteEvent } from '@/lib/contract';

const { completeEvent } = useCompleteEvent();

// Mark event as complete and return stakes to attendees
await completeEvent(
  1,                    // eventRunId
  [1, 2, 3]            // bookingIds of users who attended
);
```

#### Cancel Event
```tsx
import { useCancelEvent } from '@/lib/contract';

const { cancelEvent } = useCancelEvent();

// Cancel event and refund all users
await cancelEvent(1); // eventRunId
```

### For Users

#### Book Event
```tsx
import { useBookEvent } from '@/lib/contract';

const { bookEvent } = useBookEvent();

// Book event with payment + stake
await bookEvent(
  1,                    // eventRunId
  2,                    // seatCount
  '0.24'               // total cost in ETH (payment + stake)
);
```

### Read Contract Data

#### Get Event Details
```tsx
import { useGetEventRun } from '@/lib/contract';

const { data: eventData } = useGetEventRun(1); // eventRunId

// eventData contains:
// - host, experienceId, pricePerSeat, maxSeats, seatsBooked
// - hostStake, eventTimestamp, status, etc.
```

#### Get User's Bookings
```tsx
import { useGetUserBookings } from '@/lib/contract';
import { useAccount } from 'wagmi';

const { address } = useAccount();
const { data: bookingIds } = useGetUserBookings(address);

// Returns array of booking IDs for this user
```

#### Get Host's Events
```tsx
import { useGetHostEvents } from '@/lib/contract';
import { useAccount } from 'wagmi';

const { address } = useAccount();
const { data: eventIds } = useGetHostEvents(address);

// Returns array of event run IDs created by this host
```

#### Calculate Booking Cost
```tsx
import { useCalculateBookingCost } from '@/lib/contract';

const { data: costData } = useCalculateBookingCost(1, 2); // eventRunId, seatCount

// costData: [payment, stake, total] in wei
```

## 💡 Understanding the Staking System

### Host Stakes
When a host creates an event, they must stake **20% of the total event value**:
- Event: 0.1 ETH per seat × 10 seats = 1 ETH total
- **Host Stake Required: 0.2 ETH (20%)**
- Stake is returned after event completion

### User Stakes
When a user books, they pay **event cost + 20% stake**:
- 2 seats × 0.1 ETH = 0.2 ETH (payment)
- **User Stake: 0.04 ETH (20% of payment)**
- **Total to Pay: 0.24 ETH**
- Stake is returned if user attends

### No-Show Penalty
If a user doesn't attend:
- Their stake (0.04 ETH) is forfeited
- Goes to the platform/host

## 🎨 Styling Notes

The components use Tailwind CSS classes. Make sure your `tailwind.config.ts` includes:

```ts
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-gray-100', 'bg-blue-100', 'bg-yellow-100', 'bg-green-100', 'bg-red-100',
    'text-gray-800', 'text-blue-800', 'text-yellow-800', 'text-green-800', 'text-red-800',
  ],
  // ...
}
```

## 🔍 Viewing Transactions

After each transaction, you can view it on Etherscan:
```
https://sepolia.etherscan.io/address/0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
```

## 📊 Testing Workflow

1. **Get Test ETH** from faucet
2. **Connect Wallet** (MetaMask on Sepolia network)
3. **Create Event** as host (stakes 20%)
4. **Book Event** as user (pays + stakes 20%)
5. **Complete Event** as host (returns stakes, pays host)

## 🚨 Common Issues

### "Insufficient funds" Error
- Get more Sepolia ETH from faucet
- Check you're on Sepolia network (Chain ID: 11155111)

### "User rejected transaction"
- User cancelled in MetaMask
- Normal behavior, just try again

### "Contract not found"
- Verify contract address in `.env.local`
- Ensure you're on Sepolia network

### Wrong Network
Make sure MetaMask is set to **Sepolia Test Network**:
- Network Name: Sepolia
- RPC URL: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
- Chain ID: 11155111
- Currency Symbol: ETH

## 🎯 Next Steps

1. **Test the components** in your pages
2. **Style them** to match your design
3. **Add error handling** and loading states
4. **Sync with your backend** to store event metadata
5. **Add event listeners** for real-time updates

## 📝 Integration Checklist

- [ ] Components imported and tested
- [ ] Wallet connection works
- [ ] Can create events with stake
- [ ] Can book events with payment
- [ ] Can view bookings and events
- [ ] Error states handled
- [ ] Loading states displayed
- [ ] Transactions confirmed on Etherscan
- [ ] UI matches your design system

## 🆘 Need Help?

Check these resources:
- **Wagmi Docs**: https://wagmi.sh
- **Viem Docs**: https://viem.sh
- **Contract on Etherscan**: https://sepolia.etherscan.io/address/0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
- **Sepolia Faucet**: https://sepoliafaucet.com/

Happy coding! 🚀

