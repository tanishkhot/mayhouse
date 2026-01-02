// ETH pricing hooks are intentionally disabled for the INR-only flow.
// The original implementation is preserved below (commented out) so it can be restored if Web3 is re-enabled.
//
// import { useQuery } from '@tanstack/react-query';
// import { BlockchainAPI } from '@/lib/blockchain-api';

/**
 * Global hook for ETH price with caching
 * Fetches once and caches for 5 minutes
 */
export function useETHPrice() {
  throw new Error('useETHPrice is disabled: INR-only pricing is enabled and eth-price endpoint is not used.');
}

/**
 * Hook to convert INR to ETH using cached price
 */
export function useINRtoETH(amountINR: number) {
  void amountINR;
  throw new Error('useINRtoETH is disabled: INR-only pricing is enabled.');
}

/**
 * Hook to convert ETH to INR using cached price
 */
export function useETHtoINR(amountETH: number) {
  void amountETH;
  throw new Error('useETHtoINR is disabled: INR-only pricing is enabled.');
}

/*
Original implementation (preserved):

import { useQuery } from '@tanstack/react-query';
import { BlockchainAPI } from '@/lib/blockchain-api';

export function useETHPrice() {
  return useQuery({
    queryKey: ['ethPrice'],
    queryFn: async () => {
      const response = await BlockchainAPI.getETHPrice();
      return response.eth_price_inr;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: 200000,
  });
}

export function useINRtoETH(amountINR: number) {
  const { data: ethPrice = 200000 } = useETHPrice();
  return amountINR / ethPrice;
}

export function useETHtoINR(amountETH: number) {
  const { data: ethPrice = 200000 } = useETHPrice();
  return amountETH * ethPrice;
}
*/
