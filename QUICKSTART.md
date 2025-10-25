# ⚡ Quick Start - Mayhouse ETH

Get up and running in 5 minutes!

## 🚀 Super Fast Setup

### 1️⃣ Backend (2 minutes)

```bash
# Navigate to backend
cd mayhouse-eth/backend

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env and add your Supabase credentials

# Start server
python main.py
```

✅ Backend running at: http://localhost:8000

### 2️⃣ Frontend (2 minutes)

```bash
# Navigate to frontend (in new terminal)
cd mayhouse-eth/frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local and add your WalletConnect Project ID

# Start server
npm run dev
```

✅ Frontend running at: http://localhost:3000

### 3️⃣ Database (1 minute)

Go to your Supabase SQL Editor and run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
```

## 🎯 Test It Out

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Sign the message
4. You're in! 🎉

## 📝 What You Need

- **Supabase Account**: Get credentials from [supabase.com](https://supabase.com)
- **WalletConnect ID**: Get from [cloud.walletconnect.com](https://cloud.walletconnect.com)
- **MetaMask**: Install from [metamask.io](https://metamask.io)

## 🆘 Issues?

See [SETUP.md](./SETUP.md) for detailed troubleshooting.

---

That's it! You're ready to build Web3 experiences! 🚀

