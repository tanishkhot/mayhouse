# 🚀 Quick Deployment Setup

## Step 1: Create `.env` File

Create a `.env` file in the `/contracts` directory with:

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
```

## Step 2: Get Your Credentials

### A. Get Alchemy API Key (Free)

1. Go to: https://dashboard.alchemy.com/
2. Sign up / Log in
3. Click "Create new app"
4. Select "Ethereum" → "Sepolia"
5. Copy your API key

### B. Get Your Wallet Private Key

**⚠️ IMPORTANT: Only use a TEST wallet, never your main wallet!**

#### Option 1: Export from MetaMask

1. Open MetaMask
2. Click the 3 dots → Account details
3. Click "Show private key"
4. Enter your password
5. Copy the private key (starts with `0x`)

#### Option 2: Create a New Test Wallet

```bash
# In contracts directory
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

## Step 3: Fund Your Wallet

Get free Sepolia ETH from faucets:

- https://sepoliafaucet.com/
- https://faucets.chain.link/sepolia
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia

**You need at least 0.01 Sepolia ETH** for deployment (~$0 in real value).

## Step 4: Deploy!

```bash
npm run deploy:booking
```

## Step 5: Save Contract Address

Copy the address from the output and add to frontend:

```bash
cd ../frontend
echo "NEXT_PUBLIC_BOOKING_CONTRACT_ADDRESS=0xYOUR_ADDRESS" >> .env.local
```

## Done! 🎉

Your booking contract is now live on Sepolia!

---

## ⚠️ Security Notes

- **NEVER** commit your `.env` file to Git
- **NEVER** use your real wallet private key
- **ALWAYS** use a dedicated test wallet
- `.env` is already in `.gitignore`

---

## 🆘 Troubleshooting

### "Insufficient funds"

→ Get more Sepolia ETH from the faucets above

### "Invalid API key"

→ Double-check your Alchemy API key

### "Invalid private key"

→ Make sure it starts with `0x` and has no spaces

### "Network error"

→ Check your internet connection and Alchemy RPC URL

