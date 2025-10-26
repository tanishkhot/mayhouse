import { parseEther, formatEther } from 'viem';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';

// Simplified ABI for MayhouseBooking contract
export const BOOKING_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_host", "type": "address" },
      { "internalType": "string", "name": "_eventRunRef", "type": "string" },
      { "internalType": "uint256", "name": "_ticketPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "_seatCount", "type": "uint256" },
      { "internalType": "uint256", "name": "_eventTimestamp", "type": "uint256" }
    ],
    "name": "createBooking",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_bookingId", "type": "uint256" }
    ],
    "name": "completeBooking",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_bookingId", "type": "uint256" }
    ],
    "name": "markNoShow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_bookingId", "type": "uint256" }
    ],
    "name": "cancelBooking",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_ticketPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "_seatCount", "type": "uint256" }
    ],
    "name": "calculateBookingCost",
    "outputs": [
      { "internalType": "uint256", "name": "payment", "type": "uint256" },
      { "internalType": "uint256", "name": "stake", "type": "uint256" },
      { "internalType": "uint256", "name": "total", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getUserBookings",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stakePercentage",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Use the new booking contract address (will be set after deployment)
export const BOOKING_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_BOOKING_CONTRACT_ADDRESS || 
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) as `0x${string}`;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111; // Sepolia

// Utility functions
export function formatEthValue(value: bigint): string {
  return formatEther(value);
}

export function parseEthValue(value: string): bigint {
  return parseEther(value);
}

// Hook to create a booking
export function useCreateBooking() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createBooking = async (
    hostAddress: string,
    eventRunRef: string, // UUID from database
    ticketPriceInWei: bigint,
    seatCount: number,
    eventTimestamp: number // Unix timestamp
  ) => {
    // Calculate total cost (ticket price + 20% stake)
    const totalTicketPrice = ticketPriceInWei * BigInt(seatCount);
    const stake = (totalTicketPrice * BigInt(20)) / BigInt(100);
    const totalCost = totalTicketPrice + stake;

    return await writeContractAsync({
      address: BOOKING_CONTRACT_ADDRESS,
      abi: BOOKING_CONTRACT_ABI,
      functionName: 'createBooking',
      args: [
        hostAddress as `0x${string}`,
        eventRunRef,
        ticketPriceInWei,
        BigInt(seatCount),
        BigInt(eventTimestamp)
      ],
      value: totalCost,
      gas: BigInt(500000), // Explicit gas limit (well within network cap of 16.7M)
    });
  };

  return {
    createBooking,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to calculate booking cost from contract
export function useCalculateBookingCost(ticketPriceInWei: bigint | undefined, seatCount: number) {
  return useReadContract({
    address: BOOKING_CONTRACT_ADDRESS,
    abi: BOOKING_CONTRACT_ABI,
    functionName: 'calculateBookingCost',
    args: ticketPriceInWei !== undefined ? [ticketPriceInWei, BigInt(seatCount)] : undefined,
  });
}

// Hook to get user's bookings
export function useGetUserBookings(userAddress: string | undefined) {
  return useReadContract({
    address: BOOKING_CONTRACT_ADDRESS,
    abi: BOOKING_CONTRACT_ABI,
    functionName: 'getUserBookings',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  });
}

// Hook to get stake percentage
export function useGetStakePercentage() {
  return useReadContract({
    address: BOOKING_CONTRACT_ADDRESS,
    abi: BOOKING_CONTRACT_ABI,
    functionName: 'stakePercentage',
  });
}

