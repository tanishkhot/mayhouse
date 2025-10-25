# 🏠 Mayhouse ETH - Web3 Enabled Experience Platform

> *Discover authentic Mumbai experiences and book with crypto*

## 🌟 What's New

Mayhouse ETH is the Web3-enabled version of Mayhouse, allowing users to:
- **Connect with Ethereum wallets** (MetaMask, WalletConnect, etc.)
- **Authenticate without passwords** using wallet signatures
- **Book experiences with crypto** (coming soon)
- **NFT tickets** for experiences (coming soon)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- Python 3.11+ (for backend)
- MetaMask or other Web3 wallet
- Supabase account

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Get your WalletConnect Project ID from https://cloud.walletconnect.com
# Add it to .env.local

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:3000

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Configure your Supabase credentials in .env

# Run database migration
psql <your_database_url> -f database/migrations/001_add_wallet_address.sql

# Run development server
python main.py
```

Backend will be available at: http://localhost:8000

## 🔐 Wallet Authentication Flow

1. **User connects wallet** → Frontend displays ConnectButton
2. **Request nonce** → Backend generates unique nonce
3. **Sign message** → User signs message with wallet
4. **Verify signature** → Backend verifies signature
5. **Issue JWT** → User receives access token
6. **Access protected routes** → Token in Authorization header

## 📁 Project Structure

```
mayhouse-eth/
├── frontend/              # Next.js 15 + React 19
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   └── lib/          # API clients & utilities
│   └── package.json
│
└── backend/              # FastAPI + Supabase
    ├── app/
    │   ├── api/          # API endpoints
    │   ├── core/         # Config & utilities
    │   ├── schemas/      # Pydantic models
    │   └── services/     # Business logic
    ├── database/         # Migrations
    └── requirements.txt
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Web3**: Wagmi, Viem, RainbowKit
- **State**: React Query, Zustand
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **Web3**: eth-account, web3.py
- **Auth**: JWT tokens
- **Deployment**: Ready for Docker/Railway/Render

## 🔧 Key Features

### ✅ Implemented
- 🦊 **Wallet Connection** with RainbowKit
- 🔐 **Web3 Authentication** via signature verification
- 👤 **Auto User Creation** for new wallets
- 🎫 **JWT Token System** for session management
- 🌐 **Multi-Chain Support** (Mainnet, Polygon, Optimism, Arbitrum, Base)
- 📱 **Responsive UI** with modern design

### 🚧 Coming Soon
- 💰 Crypto payments for bookings
- 🎟️ NFT experience tickets
- 🏆 On-chain rewards & reputation
- 🔄 Multi-wallet support
- 📊 Host analytics dashboard

## 🌍 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET_KEY=your_secret_key
CORS_ORIGINS=http://localhost:3000
```

## 📊 Database Schema

The `users` table now includes:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE,  -- NEW: Ethereum address
  email TEXT,                   -- Optional for wallet users
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔗 API Endpoints

### Wallet Authentication
- `POST /auth/wallet/nonce` - Request nonce for signing
- `POST /auth/wallet/verify` - Verify signature & authenticate

### Experiences (Coming from original Mayhouse)
- `GET /explore/` - Browse experiences
- `GET /experiences/{id}` - Experience details
- More endpoints to be added...

## 🎨 Design Philosophy

- **Wallet-First**: Seamless Web3 UX
- **No Passwords**: Wallet is your identity
- **Progressive Web3**: Start simple, add crypto features gradually
- **Mobile-Friendly**: Works on mobile wallets

## 🐛 Development Tips

### Running Tests
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
pytest
```

### Common Issues

**"Please configure SUPABASE_URL"**
→ Copy `.env.example` to `.env` and add your credentials

**"Wrong network" in wallet**
→ Switch to a supported network in MetaMask

**"Invalid signature"**
→ Clear nonce cache and try signing again

## 📚 Documentation

- [RainbowKit Docs](https://www.rainbowkit.com/docs/introduction)
- [Wagmi Docs](https://wagmi.sh/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Supabase Docs](https://supabase.com/docs)

## 🤝 Contributing

This is a private project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Private and proprietary.

## 🔗 Links

- **Backend API**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000
- **WalletConnect**: https://cloud.walletconnect.com

---

**Built with ❤️ for the Ethereum community**

Last Updated: October 2025

