'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useCreateBooking, formatEthValue } from '@/lib/booking-contract';
import { BlockchainAPI } from '@/lib/blockchain-api';

interface BookEventButtonProps {
  eventRunId: string;  // Database ID (UUID)
  availableSeats: number;
  hostWalletAddress?: string; // Host's wallet address (from database)
  eventTimestamp?: string; // Event start time
  priceINR?: number; // Price in INR (optional for legacy components)
}

export default function BookEventButton({ 
  eventRunId, 
  availableSeats, 
  hostWalletAddress,
  eventTimestamp,
  priceINR = 0 // Default to 0 for legacy components
}: BookEventButtonProps) {
  const { isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [seatCount, setSeatCount] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [costData, setCostData] = useState<any>(null);
  const [loadingCost, setLoadingCost] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  const { createBooking, isPending, isConfirming, isSuccess, error } = useCreateBooking();

  // Fetch cost from backend API
  useEffect(() => {
    if (!showModal) return;
    
    const fetchCost = async () => {
      setLoadingCost(true);
      try {
        const response = await BlockchainAPI.calculateBookingCost({
          event_run_id: eventRunId,
          seat_count: seatCount
        });
        setCostData(response);
      } catch (err) {
        console.error('Failed to fetch booking cost:', err);
        setCostData(null);
      } finally {
        setLoadingCost(false);
      }
    };

    fetchCost();
  }, [eventRunId, seatCount, showModal]);

  const handleBook = async () => {
    setBookingError(null);

    if (!isConnected) {
      setBookingError('Please connect your wallet first');
      return;
    }

    // Check if on correct network
    if (chain?.id !== sepolia.id) {
      setBookingError(`Please switch to Sepolia Testnet. You're currently on ${chain?.name || 'Unknown Network'}`);
      try {
        await switchChain?.({ chainId: sepolia.id });
      } catch (err) {
        console.error('Failed to switch network:', err);
      }
      return;
    }

    if (!costData) {
      setBookingError('Could not calculate booking cost');
      return;
    }

    if (!hostWalletAddress) {
      setBookingError('Host wallet address not found. Please contact support.');
      return;
    }

    try {
      console.log('Creating booking:', {
        eventRunId,
        hostWalletAddress,
        seatCount,
        priceWei: costData.total_cost_wei - costData.stake_wei,
        totalCost: costData.total_cost_wei
      });
      
      // Calculate ticket price in Wei (excluding stake)
      const ticketPriceWei = BigInt(costData.total_cost_wei - costData.stake_wei);
      
      // Convert event timestamp to Unix timestamp
      const eventUnixTimestamp = eventTimestamp 
        ? Math.floor(new Date(eventTimestamp).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 86400; // Default to 24h from now
      
      // Call the smart contract to create booking
      const hash = await createBooking(
        hostWalletAddress,
        eventRunId, // Use UUID as reference
        ticketPriceWei,
        seatCount,
        eventUnixTimestamp
      );
      
      console.log('Booking transaction hash:', hash);
      
      // TODO: Record blockchain booking ID in backend
      // await api.post('/bookings/record-blockchain', {
      //   event_run_id: eventRunId,
      //   transaction_hash: hash,
      //   user_address: address
      // });
      
      setBookingError(null);
    } catch (err: any) {
      console.error('Error booking event:', err);
      
      // Parse the error to show user-friendly message
      let errorMessage = 'Failed to book event';
      
      if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds. Please add more Sepolia ETH to your wallet.';
      } else if (err.message?.includes('Invalid host')) {
        errorMessage = 'Invalid host wallet address. Please contact support.';
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setBookingError(errorMessage);
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

  const handleOpenModal = () => {
    setShowModal(true);
    setBookingError(null); // Clear any previous errors
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={availableSeats === 0}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {availableSeats === 0 ? 'Sold Out' : 'Book Now'}
      </button>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Book Event</h2>

            {/* Seat Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Seats
              </label>
              <select
                value={seatCount}
                onChange={(e) => setSeatCount(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
              >
                {Array.from({ length: Math.min(availableSeats, 4) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} seat{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cost Breakdown */}
            {loadingCost ? (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                <p className="text-gray-600">Calculating cost...</p>
              </div>
            ) : costData ? (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ticket Price:</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ₹{costData.total_price_inr.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatEthValue(BigInt(costData.total_cost_wei - costData.stake_wei))} ETH
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Refundable Stake (20%):</span>
                  <div className="text-right">
                    <div className="font-semibold text-purple-600">
                      ₹{costData.stake_inr.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatEthValue(BigInt(costData.stake_wei))} ETH
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total to Pay:</span>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">
                      ₹{costData.total_cost_inr.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-purple-600 font-semibold">
                      {formatEthValue(BigInt(costData.total_cost_wei))} ETH
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * You&apos;ll get your ₹{costData.stake_inr.toLocaleString('en-IN')} stake back after attending the event
                </p>
              </div>
            ) : null}

            {/* Error Display */}
            {(bookingError || error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-red-500 text-xl">⚠️</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1">Booking Error</h4>
                    <p className="text-sm text-red-800 leading-relaxed">
                      {bookingError || error?.message}
                    </p>
                    {chain && chain.id !== sepolia.id && (
                      <button
                        onClick={() => switchChain?.({ chainId: sepolia.id })}
                        className="mt-3 text-sm font-medium text-red-700 hover:text-red-900 underline"
                      >
                        Switch to Sepolia Testnet
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900 font-medium"
                disabled={isPending || isConfirming}
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={isPending || isConfirming || !isConnected || (chain && chain.id !== sepolia.id)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                {isPending && 'Waiting...'}
                {isConfirming && 'Confirming...'}
                {!isPending && !isConfirming && (chain && chain.id !== sepolia.id ? 'Wrong Network' : 'Confirm & Pay')}
              </button>
            </div>

            {/* Wallet Status */}
            {!isConnected ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 text-center">
                <p className="text-sm text-yellow-800">
                  Please connect your wallet to book
                </p>
              </div>
            ) : chain && chain.id !== sepolia.id ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 text-center">
                <p className="text-sm text-yellow-800 mb-2">
                  Wrong network: Connected to {chain.name}
                </p>
                <button
                  onClick={() => switchChain?.({ chainId: sepolia.id })}
                  className="text-sm font-medium text-yellow-900 underline hover:text-yellow-700"
                >
                  Switch to Sepolia Testnet
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

