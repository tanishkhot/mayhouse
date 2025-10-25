# 🚀 Deploy Your Contract RIGHT NOW!

## ⚡ Quick 5-Minute Deployment

Follow these exact steps:

---

## **Step 1: Get Free Testnet ETH** (2 minutes)

1. **Open your MetaMask wallet**
2. **Switch to Sepolia network:**
   - Click network dropdown (top left)
   - Select "Sepolia test network"
   - If you don't see it, go to Settings → Advanced → "Show test networks"
3. **Copy your wallet address** (click on your account name)
4. **Get free testnet ETH:**
   - Go to: https://www.alchemy.com/faucets/ethereum-sepolia
   - Paste your wallet address
   - Click "Send Me ETH"
   - Wait 1-2 minutes
   - Check MetaMask - you should have ~0.5 ETH

---

## **Step 2: Get Your Private Key** (1 minute)

⚠️ **IMPORTANT: This is ONLY for testnet!**

1. Open MetaMask
2. Click the 3 dots (⋮) menu
3. Click "Account details"
4. Click "Show private key"
5. Enter your MetaMask password
6. **Copy the private key** (starts with 0x...)

**Keep this safe! We'll use it in Step 4.**

---

## **Step 3: Get Alchemy API Key** (1 minute)

1. Go to: https://dashboard.alchemy.com
2. Sign up / Sign in (free)
3. Click "Create new app"
4. Fill in:
   - App name: "Mayhouse"
   - Chain: "Ethereum"
   - Network: "Sepolia"
5. Click "Create app"
6. Click "API Key" button
7. **Copy the HTTPS URL** (looks like: https://eth-sepolia.g.alchemy.com/v2/ABC123...)

---

## **Step 4: Install & Configure** (1 minute)

Open your terminal and run:

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/contracts

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
PRIVATE_KEY=PASTE_YOUR_PRIVATE_KEY_HERE
SEPOLIA_RPC_URL=PASTE_YOUR_ALCHEMY_URL_HERE
EOF

# Edit the .env file
nano .env
```

**In the editor:**
1. Replace `PASTE_YOUR_PRIVATE_KEY_HERE` with your private key from Step 2
2. Replace `PASTE_YOUR_ALCHEMY_URL_HERE` with your Alchemy URL from Step 3
3. Press `Ctrl+X`, then `Y`, then `Enter` to save

---

## **Step 5: Deploy!** (30 seconds)

```bash
# Compile the contract
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

**You should see:**
```
🚀 Deploying MayhouseExperience contract...
✅ MayhouseExperience deployed to: 0x123456789...
```

**🎉 DEPLOYED! Copy that contract address!**

---

## **Step 6: Save Contract Address**

```bash
# Go to frontend directory
cd ../frontend

# Add contract address to .env.local
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE" >> .env.local
```

Replace `0xYOUR_CONTRACT_ADDRESS_HERE` with the address from Step 5.

---

## **Step 7: Verify on Etherscan** (optional)

```bash
cd ../contracts

# Get Etherscan API key (free)
# 1. Go to: https://etherscan.io/register
# 2. Create account
# 3. Go to: https://etherscan.io/myapikey
# 4. Create API key
# 5. Add to .env:
#    ETHERSCAN_API_KEY=your_key_here

# Verify contract
npx hardhat verify --network sepolia 0xYOUR_CONTRACT_ADDRESS_HERE
```

---

## ✅ **You're Done!**

Your contract is now live on Sepolia testnet!

### **View it on Etherscan:**
https://sepolia.etherscan.io/address/0xYOUR_CONTRACT_ADDRESS

### **Test it:**
1. Go to Etherscan link above
2. Click "Contract" tab → "Write Contract"
3. Click "Connect to Web3"
4. Try the functions!

---

## 🆘 **Quick Troubleshooting**

### "Insufficient funds for gas"
→ Get more testnet ETH from the faucet (Step 1)

### "Invalid private key"
→ Make sure it starts with `0x` and has no spaces

### "Failed to fetch"
→ Check your Alchemy RPC URL is correct

### "Module not found"
→ Run `npm install` again

---

## 🎯 **What to Do Next**

1. **Test the contract** on Etherscan
2. **Integrate with frontend** (I can help!)
3. **Create event from your app**
4. **Book an event**
5. **Test the full staking flow**

---

**Need help? Just ask! I'll guide you through each step.** 🚀

