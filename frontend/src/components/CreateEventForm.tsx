'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useCreateEventRun, calculateStake, formatEthValue } from '@/lib/contract';
import { parseEther } from 'viem';

export default function CreateEventForm({ experienceId }: { experienceId: string }) {
  const { address, isConnected } = useAccount();
  const { createEventRun, isPending, isConfirming, isSuccess, error } = useCreateEventRun();
  
  const [pricePerSeat, setPricePerSeat] = useState('0.1');
  const [maxSeats, setMaxSeats] = useState(4);
  const [eventDate, setEventDate] = useState('');
  
  // Calculate stake: 20% of total event value
  const totalEventValue = parseFloat(pricePerSeat) * maxSeats;
  const requiredStakeEth = (totalEventValue * 0.2).toFixed(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      const eventTimestamp = Math.floor(new Date(eventDate).getTime() / 1000);
      
      const hash = await createEventRun(
        experienceId,
        pricePerSeat,
        maxSeats,
        eventTimestamp
      );
      
      console.log('Transaction hash:', hash);
    } catch (err: any) {
      console.error('Error creating event:', err);
      alert(err.message || 'Failed to create event');
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Event Created Successfully!</h3>
        <p className="text-green-700">Your event has been created on the blockchain.</p>
        <p className="text-sm text-green-600 mt-2">Your stake of {requiredStakeEth} ETH is now locked.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Create Event Run (On-Chain)</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Price Per Seat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Per Seat (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            value={pricePerSeat}
            onChange={(e) => setPricePerSeat(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        {/* Max Seats */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Seats
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={maxSeats}
            onChange={(e) => setMaxSeats(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        {/* Event Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Date & Time
          </label>
          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        {/* Stake Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">💎 Stake Required</h3>
          <div className="space-y-1 text-sm text-purple-700">
            <p>Total Event Value: <strong>{(parseFloat(pricePerSeat) * maxSeats).toFixed(4)} ETH</strong></p>
            <p>Your Stake (20%): <strong>{requiredStakeEth} ETH</strong></p>
            <p className="text-xs mt-2">You&apos;ll get your stake back after the event completes.</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            <strong>Error:</strong> {error.message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || isConfirming || !isConnected}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending && 'Waiting for approval...'}
          {isConfirming && 'Creating event on blockchain...'}
          {!isPending && !isConfirming && 'Create Event (Pay Stake)'}
        </button>

        {!isConnected && (
          <p className="text-center text-sm text-red-600">
            Please connect your wallet to create an event
          </p>
        )}
      </form>
    </div>
  );
}

