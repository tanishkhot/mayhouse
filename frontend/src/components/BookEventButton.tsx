'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useBookEvent, useCalculateBookingCost, formatEthValue } from '@/lib/contract';

interface BookEventButtonProps {
  eventRunId: number;
  availableSeats: number;
}

export default function BookEventButton({ eventRunId, availableSeats }: BookEventButtonProps) {
  const { address, isConnected } = useAccount();
  const [seatCount, setSeatCount] = useState(1);
  const [showModal, setShowModal] = useState(false);
  
  const { bookEvent, isPending, isConfirming, isSuccess, error } = useBookEvent();
  const { data: costData } = useCalculateBookingCost(eventRunId, seatCount);

  const handleBook = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!costData) {
      alert('Could not calculate booking cost');
      return;
    }

    try {
      const [payment, stake, total] = costData;
      const totalEth = formatEthValue(total);
      
      const hash = await bookEvent(eventRunId, seatCount, totalEth);
      console.log('Booking transaction hash:', hash);
    } catch (err: any) {
      console.error('Error booking event:', err);
      alert(err.message || 'Failed to book event');
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <h3 className="text-lg font-semibold text-green-900">✅ Booking Confirmed!</h3>
        <p className="text-sm text-green-700 mt-1">Your seats are reserved. See you at the event!</p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={availableSeats === 0}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {availableSeats === 0 ? 'Sold Out' : 'Book Now'}
      </button>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Book Event</h2>

            {/* Seat Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Seats
              </label>
              <select
                value={seatCount}
                onChange={(e) => setSeatCount(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {Array.from({ length: Math.min(availableSeats, 4) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} seat{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cost Breakdown */}
            {costData && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ticket Price:</span>
                  <span className="font-semibold">{formatEthValue(costData[0])} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stake (20%):</span>
                  <span className="font-semibold text-purple-600">{formatEthValue(costData[1])} ETH</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total to Pay:</span>
                  <span className="font-bold text-lg">{formatEthValue(costData[2])} ETH</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * You'll get your {formatEthValue(costData[1])} ETH stake back after attending the event
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm">
                <strong>Error:</strong> {error.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isPending || isConfirming}
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={isPending || isConfirming || !isConnected}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                {isPending && 'Waiting...'}
                {isConfirming && 'Confirming...'}
                {!isPending && !isConfirming && 'Confirm & Pay'}
              </button>
            </div>

            {!isConnected && (
              <p className="text-center text-sm text-red-600 mt-3">
                Please connect your wallet to book
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

