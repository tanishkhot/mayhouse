# 🚀 Beginner's Guide to Deploy Your Smart Contract

## 📋 **What We'll Do:**

1. ✅ Set up a wallet (MetaMask)
2. ✅ Get free testnet ETH
3. ✅ Configure the project
4. ✅ Deploy the contract to Sepolia testnet
5. ✅ Verify on Etherscan
6. ✅ Test it from your frontend

---

## 🎯 **Step-by-Step Guide**

### **Step 1: Make Sure You Have MetaMask**

You should already have MetaMask installed (from earlier wallet auth setup).

1. Open MetaMask
2. Click your profile icon (top right)
3. Go to "Settings" → "Advanced"
4. Enable "Show test networks"
5. Switch network to "Sepolia test network" (top left dropdown)

---

### **Step 2: Get Your Private Key** ⚠️

**IMPORTANT: This is ONLY for testnet! Never share your mainnet private key!**

1. Open MetaMask
2. Click the 3 dots (⋮) next to your account
3. Click "Account details"
4. Click "Show private key"
5. Enter your password
6. Copy the private key (it starts with 0x...)

**Keep this safe! Don't share it!**

---

### **Step 3: Get Free Testnet ETH** 💰

You need testnet ETH to deploy. It's completely free!

**Option 1: Alchemy Faucet** (Recommended)
1. Go to: https://www.alchemy.com/faucets/ethereum-sepolia
2. Sign in with your wallet
3. Enter your wallet address
4. Click "Send Me ETH"
5. Wait 1-2 minutes

**Option 2: Infura Faucet**
1. Go to: https://www.infura.io/faucet/sepolia
2. Enter your wallet address
3. Complete CAPTCHA
4. Receive testnet ETH

**Check your balance:**
- Open MetaMask
- Make sure you're on Sepolia network
- You should see ~0.5 ETH (testnet)

---

### **Step 4: Get Alchemy API Key** 🔑

We need an RPC URL to connect to the blockchain.

1. Go to: https://www.alchemy.com
2. Sign up for free account
3. Click "Create new app"
4. Fill in:
   - Name: "Mayhouse ETH"
   - Chain: "Ethereum"
   - Network: "Sepolia"
5. Click "Create app"
6. Click "API key" button
7. Copy the "HTTPS" URL (looks like: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY)

---

### **Step 5: Configure the Project** ⚙️

Now let's set up the configuration files.

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/contracts

# Create .env file
touch .env
```

Open `.env` in your editor and add:

```env
# Your wallet private key (starts with 0x)
PRIVATE_KEY=your_private_key_here

# Your Alchemy Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Optional: Get from etherscan.io
ETHERSCAN_API_KEY=your_etherscan_api_key_optional
```

**Replace:**
- `your_private_key_here` → Your MetaMask private key from Step 2
- `YOUR_KEY` → Your Alchemy API key from Step 4

---

### **Step 6: Install Dependencies** 📦

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/contracts
npm install
```

This will install:
- Hardhat (development environment)
- Ethers.js (blockchain library)
- Testing tools
- Other dependencies

---

### **Step 7: Compile the Contract** 🔨

```bash
npm run compile
```

You should see:
```
Compiled 1 Solidity file successfully
```

---

### **Step 8: Run Tests** 🧪

Make sure everything works:

```bash
npm run test
```

You should see all tests passing:
```
✓ Should allow host to create event with correct stake
✓ Should allow user to book with payment + stake
✓ Should complete event and return stakes to attendees
✓ Should forfeit stake for no-shows
✓ Should refund all bookings when event is cancelled

5 passing
```

---

### **Step 9: Deploy to Sepolia!** 🚀

This is it! Deploy your contract:

```bash
npm run deploy:sepolia
```

You should see:
```
🚀 Deploying MayhouseExperience contract...
Network: sepolia
Deploying with account: 0x...
Account balance: 0.5 ETH
✅ MayhouseExperience deployed to: 0xABCDEF123456...

📋 Contract Details:
   - Platform Fee: 5 %
   - Stake Percentage: 20 %
   - Owner: 0x...

📝 Save this address to your frontend .env:
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xABCDEF123456...
```

**🎉 YOUR CONTRACT IS DEPLOYED!**

---

### **Step 10: Save the Contract Address** 📝

Copy the contract address (0xABCDEF123456...) and add it to your frontend:

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/frontend

# Add to .env.local
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS" >> .env.local
```

---

### **Step 11: Verify on Etherscan** 🔍

Make your contract readable on Etherscan:

```bash
npx hardhat verify --network sepolia 0xYOUR_CONTRACT_ADDRESS
```

Now anyone can view your contract at:
`https://sepolia.etherscan.io/address/0xYOUR_CONTRACT_ADDRESS`

---

### **Step 12: View Your Contract on Etherscan** 👀

1. Go to: https://sepolia.etherscan.io
2. Paste your contract address in search
3. Click "Contract" tab
4. You'll see:
   - Contract code
   - Read functions (view data)
   - Write functions (interact)
   - Transactions
   - Events

---

## 🧪 **Test Your Contract**

### **Option 1: Test from Etherscan**

1. Go to your contract on Etherscan
2. Click "Contract" → "Write Contract"
3. Click "Connect to Web3" (connects MetaMask)
4. Try creating an event:
   - Function: `createEventRun`
   - experienceId: "test_exp_1"
   - pricePerSeat: 100000000000000000 (0.1 ETH in wei)
   - maxSeats: 4
   - eventTimestamp: 1735689600 (future timestamp)
   - Value: 80000000000000000 (0.08 ETH - 20% stake)
5. Click "Write" and confirm in MetaMask

### **Option 2: Test from Your Frontend**

Your frontend is already set up with:
- ✅ Wallet connection (RainbowKit)
- ✅ Web3 providers (Wagmi)
- ✅ Network switching

Just add the contract interaction code!

---

## 🎯 **Common Issues & Solutions**

### **Issue: "Insufficient funds"**
**Solution:** Get more testnet ETH from the faucet (Step 3)

### **Issue: "Invalid private key"**
**Solution:** 
- Make sure it starts with `0x`
- Check there are no extra spaces
- Use the private key from MetaMask, not the seed phrase

### **Issue: "Network not configured"**
**Solution:** Check your `.env` file has the correct Sepolia RPC URL

### **Issue: "Contract already verified"**
**Solution:** That's fine! It means verification succeeded earlier

### **Issue: "Nonce too high"**
**Solution:** Reset MetaMask: Settings → Advanced → Clear activity tab data

---

## 📊 **Understanding Gas Costs**

When you deploy, you'll see gas costs. Example:
- **Deploy contract:** ~0.01-0.02 ETH
- **Create event:** ~0.001-0.003 ETH
- **Book event:** ~0.001-0.002 ETH
- **Complete event:** ~0.002-0.004 ETH

On Sepolia testnet, this is FREE (testnet ETH has no value)!

---

## 🎓 **Blockchain Basics You Just Learned**

✅ **Wallet** - Your account (MetaMask)
✅ **Private Key** - Proves you own the wallet
✅ **Testnet** - Free practice blockchain (Sepolia)
✅ **Gas** - Fee to run transactions
✅ **Smart Contract** - Code on the blockchain
✅ **Deploy** - Publishing your contract
✅ **Verify** - Making contract readable on Etherscan
✅ **RPC** - Connection to blockchain (Alchemy)

---

## 🎉 **What You've Accomplished**

1. ✅ Set up blockchain development environment
2. ✅ Got testnet cryptocurrency
3. ✅ Compiled Solidity smart contract
4. ✅ Ran automated tests
5. ✅ Deployed to Ethereum testnet
6. ✅ Verified on block explorer
7. ✅ Ready to integrate with frontend

---

## 🚀 **Next Steps**

### **1. Create Frontend Integration**
Add contract interaction functions:
- `createEvent()` from host dashboard
- `bookEvent()` from user booking page
- `completeEvent()` from host after event

### **2. Test Full Flow**
1. Connect wallet on frontend
2. Create an event (as host)
3. Book the event (as user)
4. Complete the event (as host)
5. Verify stakes returned correctly

### **3. Deploy to Mainnet** (LATER!)
Once everything works perfectly:
- Get real ETH
- Deploy to Ethereum mainnet
- Real money transactions!

---

## 📞 **Need Help?**

If you get stuck:
1. Check the error message carefully
2. Review this guide
3. Check contract on Etherscan
4. Verify your .env file is correct
5. Make sure you have testnet ETH

---

## 💡 **Pro Tips**

1. **Keep track of gas:** Watch how much each operation costs
2. **Test everything:** Use testnet extensively before mainnet
3. **Save contract address:** You'll need it often
4. **Document transactions:** Keep notes of what you test
5. **Learn gradually:** Blockchain has a learning curve, that's normal!

---

**🎊 You're now a blockchain developer! Welcome to Web3!** 🚀

*Last Updated: October 25, 2025*

