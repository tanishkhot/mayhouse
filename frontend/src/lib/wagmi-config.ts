import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Mayhouse ETH',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [
    sepolia, // Primary chain - contract deployed here
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true, // Enable server-side rendering support
});

