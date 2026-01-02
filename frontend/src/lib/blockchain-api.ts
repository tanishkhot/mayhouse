import { api } from './api';

// Blockchain API Types
export interface BookingCostRequest {
  event_run_id: string;
  seat_count: number;
}

export interface BookingCostResponse {
  event_run_id: string;
  seat_count: number;
  price_per_seat_inr: number;
  total_price_inr: number;
  stake_inr: number; // 20% refundable deposit
  total_cost_inr: number;
}

export interface ConversionResponse {
  amount_inr: number;
  amount_wei: number;
  amount_eth: number;
  eth_price_inr: number;
}

export interface ETHPriceResponse {
  eth_price_inr: number;
  currency: string;
  last_updated: string;
  source: string;
}

export interface BlockchainStatusResponse {
  event_run_id: string;
  blockchain_event_run_id: number | null;
  blockchain_tx_hash: string | null;
  blockchain_status: string;
  on_chain_data: {
    eventRunId: number;
    host: string;
    experienceId: string;
    pricePerSeat: number;
    pricePerSeatINR: number;
    maxSeats: number;
    seatsBooked: number;
    hostStake: number;
    eventTimestamp: number;
    status: number;
    hostStakeWithdrawn: boolean;
    createdAt: number;
  } | null;
}

// Blockchain API Methods
export const BlockchainAPI = {
  /**
   * Calculate booking cost including stake
   */
  calculateBookingCost: (request: BookingCostRequest) =>
    api.post<BookingCostResponse>('/blockchain/calculate-booking-cost', request).then((r) => r.data),

  /**
   * Get current ETH price in INR
   */
  getETHPrice: () =>
    api.get<ETHPriceResponse>('/blockchain/eth-price').then((r) => r.data),

  // NOTE: Other web3 endpoints can be re-enabled if full Web3 integration is restored

  // /**
  //  * Get blockchain sync status for an event run
  //  */
  // getBlockchainStatus: (eventRunId: string) =>
  //   api.get<BlockchainStatusResponse>(`/blockchain/status/${eventRunId}`).then((r) => r.data),

  // /**
  //  * Convert INR to Wei/ETH
  //  */
  // convertINRtoWei: (amountINR: number) =>
  //   api.get<ConversionResponse>(`/blockchain/conversion/inr-to-wei?amount_inr=${amountINR}`).then((r) => r.data),

  // /**
  //  * Convert Wei to INR/ETH
  //  */
  // convertWeiToINR: (amountWei: number) =>
  //   api.get<ConversionResponse>(`/blockchain/conversion/wei-to-inr?amount_wei=${amountWei}`).then((r) => r.data),

};

// Utility functions for price formatting
// Note: used by UI components (e.g. PriceDisplay) even if full Web3 flow is disabled.
export const formatETH = (weiAmount: number | string): string => {
  // Convert to BigInt safely - handle both string and number inputs
  let wei: bigint;
  if (typeof weiAmount === 'string') {
    wei = BigInt(weiAmount);
  } else {
    // If it's a number, convert to integer first
    wei = BigInt(Math.floor(weiAmount));
  }

  const eth = Number(wei) / 1e18;

  // Format with appropriate precision
  if (eth >= 1) {
    return eth.toFixed(4) + ' ETH';
  }
  if (eth >= 0.0001) {
    return eth.toFixed(6) + ' ETH';
  }
  return eth.toExponential(2) + ' ETH';
};

export const formatINR = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// export const weiToETH = (wei: number | string): number => {
//   let weiAmount: bigint;
//   if (typeof wei === 'string') {
//     weiAmount = BigInt(wei);
//   } else {
//     weiAmount = BigInt(Math.floor(wei));
//   }
//   return Number(weiAmount) / 1e18;
// };

// export const ethToWei = (eth: number): bigint => {
//   return BigInt(Math.floor(eth * 1e18));
// };

// /**
//  * Get live ETH price in INR from the backend API
//  */
// export const getETHPriceInINR = async (): Promise<number> => {
//   try {
//     const response = await BlockchainAPI.getETHPrice();
//     return response.eth_price_inr;
//   } catch (error) {
//     console.error('Failed to fetch ETH price, using fallback:', error);
//     // Fallback to hardcoded value if API fails
//     return 200000; // 1 ETH = 200,000 INR
//   }
// };

// /**
//  * Convert INR to ETH using live price
//  */
// export const convertINRtoETH = async (amountINR: number): Promise<number> => {
//   const ethPrice = await getETHPriceInINR();
//   return amountINR / ethPrice;
// };

// /**
//  * Convert ETH to INR using live price
//  */
// export const convertETHtoINR = async (amountETH: number): Promise<number> => {
//   const ethPrice = await getETHPriceInINR();
//   return amountETH * ethPrice;
// };

