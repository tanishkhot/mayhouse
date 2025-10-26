# Deploy MayhouseBooking Contract

## Quick Deploy Steps

### 1. Make sure you're in the contracts directory

```bash
cd /Users/maverick/ethonline-hackathon/mayhouse/contracts
```

### 2. Deploy the booking contract to Sepolia

```bash
npm run deploy:booking
```

### 3. Copy the contract address from the output

You'll see something like:

```
✅ MayhouseBooking deployed to: 0x1234567890abcdef...
```

### 4. Add the address to frontend .env.local

```bash
cd ../frontend
echo "NEXT_PUBLIC_BOOKING_CONTRACT_ADDRESS=0xYOUR_ADDRESS_HERE" >> .env.local
```

### 5. Restart your frontend dev server

```bash
npm run dev
```

## Done!

Your booking contract is now live and connected to your frontend.
