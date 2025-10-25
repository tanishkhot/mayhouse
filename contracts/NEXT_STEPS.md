# ✅ .env File Created! Next Steps:

## 🎯 **What You Need to Add:**

### **1. Your Private Key** (Required)
```
Open MetaMask → Click 3 dots (⋮) → Account Details → Show Private Key
→ Copy it (starts with 0x...)
```

### **2. Your Alchemy RPC URL** (Required)
```
You said you have the API key already!
Format: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### **3. Etherscan API Key** (Optional but recommended)
```
Go to: https://etherscan.io/register
Create account → Go to: https://etherscan.io/myapikey
This lets you verify your contract on Etherscan
```

---

## 📝 **How to Edit .env File:**

### **Option 1: Using nano (terminal)**
```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/contracts
nano .env
```
- Edit the values
- Press `Ctrl+X`, then `Y`, then `Enter` to save

### **Option 2: Using VS Code**
```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/contracts
code .env
```
- Edit the values
- Save with `Cmd+S`

### **Option 3: Using any text editor**
- Open: `/Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/contracts/.env`
- Replace the placeholder values
- Save the file

---

## ⚡ **After You Add Your Keys:**

### **Step 1: Install Dependencies**
```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/contracts
npm install
```

### **Step 2: Compile Contract**
```bash
npm run compile
```
Expected output:
```
Compiled 1 Solidity file successfully
```

### **Step 3: Run Tests** (Optional but recommended)
```bash
npm run test
```
Should see all tests passing!

### **Step 4: Deploy to Sepolia!** 🚀
```bash
npm run deploy:sepolia
```

You'll see:
```
🚀 Deploying MayhouseExperience contract...
Network: sepolia
Deploying with account: 0x...
Account balance: 0.5 ETH
✅ MayhouseExperience deployed to: 0x123456789ABCDEF...

📝 Save this address to your frontend .env:
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x123456789ABCDEF...
```

### **Step 5: Save Contract Address**
Copy the contract address and add it to your frontend:
```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/frontend
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS" >> .env.local
```

### **Step 6: Verify on Etherscan** (If you added Etherscan API key)
```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/contracts
npx hardhat verify --network sepolia 0xYOUR_CONTRACT_ADDRESS
```

---

## 🔒 **Security Checklist:**

- ✅ `.env` file created
- ✅ `.gitignore` includes `.env` (so it won't be committed)
- ⚠️ **NEVER share your private key**
- ⚠️ **NEVER commit .env to git**
- ✅ This is testnet only (no real money)

---

## 📦 **What's Ready:**

✅ Smart contract written (`MayhouseExperience.sol`)
✅ Tests written (`test/MayhouseExperience.test.js`)
✅ Deployment script (`scripts/deploy.js`)
✅ Configuration (`hardhat.config.js`)
✅ Environment template (`.env`) ← **You're here!**
✅ Git protection (`.gitignore`)

---

## 🆘 **Common Issues:**

### "Error: Insufficient funds"
→ You need testnet ETH!
→ Go to: https://www.alchemy.com/faucets/ethereum-sepolia

### "Error: Invalid private key"
→ Make sure it starts with `0x`
→ No spaces or quotes
→ Copy directly from MetaMask

### "Error: Cannot find module"
→ Run `npm install` first

### "Error: Network not configured"
→ Check your Alchemy RPC URL is correct
→ Format: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

---

## 🎯 **Quick Command Summary:**

```bash
# 1. Edit .env file
nano .env

# 2. Install
npm install

# 3. Compile
npm run compile

# 4. Test (optional)
npm run test

# 5. Deploy
npm run deploy:sepolia

# 6. Verify (optional)
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

---

## ✅ **After Deployment:**

You'll have:
1. ✅ Contract deployed on Sepolia testnet
2. ✅ Contract address (save this!)
3. ✅ Viewable on Etherscan
4. ✅ Ready to integrate with frontend
5. ✅ Ready to test staking mechanism

---

## 🚀 **Next Phase: Frontend Integration**

Once deployed, I can help you:
1. Create contract interaction functions
2. Add "Create Event" button for hosts
3. Add "Book Event" flow for users
4. Display stakes and payments
5. Test the full staking flow

---

**📍 You are here:** Ready to add your API keys to `.env` and deploy!

Just edit the `.env` file and run `npm run deploy:sepolia`! 🎉

