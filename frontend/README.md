# Mayhouse ETH Frontend

[Next.js](https://nextjs.org) + [React 19](https://react.dev) + [Tailwind CSS](https://tailwindcss.com) frontend for the Mayhouse experience booking platform with Web3 integration.

## ✨ Features

- **Web3 Integration**: Ethereum wallet authentication and payments via [Wagmi](https://wagmi.sh) + [RainbowKit](https://rainbowkit.com)
- **Smart Contract**: Deployed on Sepolia at `0x09aB660CEac220678b42E0e23DebCb1475e1eAD5`
- **Modern Stack**: Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS 4
- **State Management**: React Query + Zustand
- **Booking System**: Blockchain-based booking with staking mechanism
- **Responsive Design**: Mobile-first, fully accessible

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- MetaMask or compatible wallet
- Sepolia test ETH (for contract interactions)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys and contract addresses

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📚 Documentation

### Core Documentation
- **[AIRBNB_ANSPIRATION_SUMMARY.md](./AIRBNB_INSPIRATION_SUMMARY.md)** - Executive summary and quick start guide
- **[AIRBNB_ANALYSIS_RECOMMENDATIONS.md](./AIRBNB_ANALYSIS_RECOMMENDATIONS.md)** - Deep dive technical recommendations
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Step-by-step development roadmap
- **[ASSET_REQUIREMENTS.md](./ASSET_REQUIREMENTS.md)** - Design assets and resources needed

### Project Documentation
- **[CONTRACT_INTEGRATION.md](./CONTRACT_INTEGRATION.md)** - Smart contract integration guide
- **[screens.md](./screens.md)** - Page layout and routing structure
- **[FIXES_COMPLETED.md](./FIXES_COMPLETED.md)** - Recent bug fixes and improvements
- **[CONTRAST_AUDIT_REPORT.md](./CONTRAST_AUDIT_REPORT.md)** - Accessibility audit results

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx        # Homepage (Explore)
│   │   ├── login/          # Wallet authentication
│   │   ├── host-dashboard/ # Host management
│   │   └── experiences/    # Event detail pages
│   ├── components/         # React components
│   ├── lib/                # Utilities & APIs
│   └── hooks/              # Custom React hooks
├── public/                 # Static assets
└── docs/                   # Additional documentation
```

## 🎯 Quick Start Guide

**New to the project?** Start here:

1. **Read** [AIRBNB_INSPIRATION_SUMMARY.md](./AIRBNB_INSPIRATION_SUMMARY.md) (5 min)
2. **Review** [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) (10 min)
3. **Setup** Storybook (see checklist)
4. **Build** your first UI component

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi 2.18 + Viem 2.38 + RainbowKit 2.2
- **State**: React Query 5 + Zustand 5
- **Forms**: React Hook Form
- **Icons**: Lucide React

## 🎨 Design System

### Colors
- **Primary**: Purple/Pink (#db2777)
- **Secondary**: Blue (#2563eb)
- **Accent**: Orange (#f59e0b)
- **Typography**: Geist Sans

### Components
Build UI components following Airbnb-inspired patterns. See [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) for details.

## 📦 Scripts

```bash
npm run dev      # Development server with Turbopack
npm run build    # Production build
npm run start    # Production server
npm run lint     # Lint code
```

## 🔗 Smart Contract

**Network**: Sepolia Testnet  
**Address**: `0x09aB660CEac220678b42E0e23DebCb1475e1eAD5`  
**ABI**: See [src/lib/contract-abi.ts](./src/lib/contract-abi.ts)

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test smart contract
npm run test:contract
```

## 📊 Performance

Target metrics:
- Lighthouse Performance: > 90
- First Contentful Paint: < 1.5s
- Bundle size: < 200KB (gzipped)

## 🤝 Contributing

1. Read [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)
2. Pick a task from the checklist
3. Create a feature branch
4. Write tests
5. Submit a pull request

## 📝 License

MIT

## 🆘 Support

- Documentation: See `/docs` folder
- Issues: Create GitHub issue
- Questions: Check existing documentation

---

**Built with ❤️ for ETHOnline Hackathon 2025**
