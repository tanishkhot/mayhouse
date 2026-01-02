/**
 * NOTE: This file is DEPRECATED - Not used for regular payment flow
 * 
 * This file contains Web3 smart contract interaction logic.
 * Currently commented out/not used as we're using regular API-based bookings.
 * 
 * Can be re-enabled if Web3 integration is restored.
 * 
 * Last used: Before migration to API-based booking system
 */

import { parseEther, formatEther } from 'viem';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { MAYHOUSE_CONTRACT_ABI, CONTRACT_ADDRESS } from './contract-abi';

// Types
export enum EventStatus {
  Created = 0,
  Active = 1,
  Full = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum BookingStatus {
  Active = 0,
  Completed = 1,
  NoShow = 2,
  Cancelled = 3,
}

export interface EventRun {
  eventRunId: bigint;
  host: string;
  experienceId: string;
  pricePerSeat: bigint;
  maxSeats: bigint;
  seatsBooked: bigint;
  hostStake: bigint;
  eventTimestamp: bigint;
  status: EventStatus;
  hostStakeWithdrawn: boolean;
  createdAt: bigint;
}

export interface Booking {
  bookingId: bigint;
  eventRunId: bigint;
  user: string;
  seatCount: bigint;
  totalPayment: bigint;
  userStake: bigint;
  status: BookingStatus;
  bookedAt: bigint;
}

// Utility functions
export function calculateStake(pricePerSeat: number, seats: number, stakePercentage: number = 20): string {
  const total = pricePerSeat * seats;
  const stake = (total * stakePercentage) / 100;
  return stake.toString();
}

export function calculateBookingTotal(pricePerSeat: number, seats: number): {
  payment: string;
  stake: string;
  total: string;
} {
  const payment = pricePerSeat * seats;
  const stake = (payment * 20) / 100; // 20% stake
  const total = payment + stake;
  
  return {
    payment: payment.toString(),
    stake: stake.toString(),
    total: total.toString(),
  };
}

export function formatEthValue(value: bigint): string {
  return formatEther(value);
}

export function parseEthValue(value: string): bigint {
  return parseEther(value);
}

// Contract interaction hooks
export function useCreateEventRun() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createEventRun = async (
    experienceId: string,
    pricePerSeat: string, // in ETH
    maxSeats: number,
    eventTimestamp: number
  ) => {
    const priceInWei = parseEther(pricePerSeat);
    const totalValue = priceInWei * BigInt(maxSeats);
    const requiredStake = (totalValue * BigInt(20)) / BigInt(100); // 20% stake

    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: MAYHOUSE_CONTRACT_ABI,
      functionName: 'createEventRun',
      args: [experienceId, priceInWei, BigInt(maxSeats), BigInt(eventTimestamp)],
      value: requiredStake,
      gas: BigInt(1000000), // Explicitly set gas limit to 1M (well within network cap of ~16.7M)
    });
  };

  return {
    createEventRun,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useBookEvent() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const bookEvent = async (eventRunId: number, seatCount: number, totalCostInEth: string) => {
    const totalCostInWei = parseEther(totalCostInEth);

    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: MAYHOUSE_CONTRACT_ABI,
      functionName: 'bookEvent',
      args: [BigInt(eventRunId), BigInt(seatCount)],
      value: totalCostInWei,
      gas: BigInt(500000), // Explicit gas limit for booking
    });
  };

  return {
    bookEvent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCompleteEvent() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const completeEvent = async (eventRunId: number, attendedBookingIds: number[]) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: MAYHOUSE_CONTRACT_ABI,
      functionName: 'completeEvent',
      args: [BigInt(eventRunId), attendedBookingIds.map(id => BigInt(id))],
      gas: BigInt(1500000), // Higher gas for completing events (processes multiple bookings)
    });
  };

  return {
    completeEvent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCancelEvent() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelEvent = async (eventRunId: number) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: MAYHOUSE_CONTRACT_ABI,
      functionName: 'cancelEvent',
      args: [BigInt(eventRunId)],
      gas: BigInt(800000), // Explicit gas limit for cancellation
    });
  };

  return {
    cancelEvent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Read contract hooks
export function useGetEventRun(eventRunId: number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MAYHOUSE_CONTRACT_ABI,
    functionName: 'getEventRun',
    args: eventRunId !== undefined ? [BigInt(eventRunId)] : undefined,
  });
}

export function useGetBooking(bookingId: number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MAYHOUSE_CONTRACT_ABI,
    functionName: 'getBooking',
    args: bookingId !== undefined ? [BigInt(bookingId)] : undefined,
  });
}

export function useGetUserBookings(userAddress: string | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MAYHOUSE_CONTRACT_ABI,
    functionName: 'getUserBookings',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  });
}

export function useGetHostEvents(hostAddress: string | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MAYHOUSE_CONTRACT_ABI,
    functionName: 'getHostEvents',
    args: hostAddress ? [hostAddress as `0x${string}`] : undefined,
  });
}

export function useCalculateBookingCost(eventRunId: number | undefined, seatCount: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MAYHOUSE_CONTRACT_ABI,
    functionName: 'calculateBookingCost',
    args: eventRunId !== undefined ? [BigInt(eventRunId), BigInt(seatCount)] : undefined,
  });
}

export function useGetStakePercentage() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MAYHOUSE_CONTRACT_ABI,
    functionName: 'stakePercentage',
  });
}

export function useGetPlatformFee() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MAYHOUSE_CONTRACT_ABI,
    functionName: 'platformFeePercentage',
  });
}

export function useGetEventBookings(eventRunId: number | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MAYHOUSE_CONTRACT_ABI,
    functionName: 'getEventBookings',
    args: eventRunId !== undefined ? [BigInt(eventRunId)] : undefined,
  });
}

