import { useQuery } from '@tanstack/react-query';
import { BlockchainAPI } from '@/lib/blockchain-api';

/**
 * Global hook for ETH price with caching
 * Fetches once and caches for 5 minutes
 */
export function useETHPrice() {
  return useQuery({
    queryKey: ['ethPrice'],
    queryFn: async () => {
      const response = await BlockchainAPI.getETHPrice();
      return response.eth_price_inr;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: 200000, // Fallback while loading
  });
}

/**
 * Hook to convert INR to ETH using cached price
 */
export function useINRtoETH(amountINR: number) {
  const { data: ethPrice = 200000 } = useETHPrice();
  return amountINR / ethPrice;
}

/**
 * Hook to convert ETH to INR using cached price
 */
export function useETHtoINR(amountETH: number) {
  const { data: ethPrice = 200000 } = useETHPrice();
  return amountETH * ethPrice;
}

