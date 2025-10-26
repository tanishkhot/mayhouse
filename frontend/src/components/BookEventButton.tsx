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
  
  const { createBooking, hash, isPending, isConfirming, isSuccess, error } = useCreateBooking();
  
  // Track if transaction failed after submission
  const [transactionFailed, setTransactionFailed] = useState(false);
  
  // Reset transaction failed state when modal opens
  useEffect(() => {
    if (showModal) {
      setTransactionFailed(false);
    }
  }, [showModal]);

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
      console.log('[BOOKING] Starting booking process:', {
        eventRunId,
        hostWalletAddress,
        seatCount,
        costData,
        eventTimestamp
      });
      
      // Calculate ticket price in Wei (excluding stake)
      const ticketPriceWei = BigInt(costData.total_cost_wei - costData.stake_wei);
      
      // Convert event timestamp to Unix timestamp
      const eventUnixTimestamp = eventTimestamp 
        ? Math.floor(new Date(eventTimestamp).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 86400; // Default to 24h from now
      
      console.log('[BOOKING] Contract call parameters:', {
        hostWalletAddress,
        eventRunId,
        ticketPriceWei: ticketPriceWei.toString(),
        seatCount,
        eventUnixTimestamp,
        totalValue: costData.total_cost_wei
      });
      
      // Call the smart contract to create booking
      const hash = await createBooking(
        hostWalletAddress,
        eventRunId, // Use UUID as reference
        ticketPriceWei,
        seatCount,
        eventUnixTimestamp
      );
      
      console.log('[BOOKING] Success! Transaction hash:', hash);
      
      // TODO: Record blockchain booking ID in backend
      // await api.post('/bookings/record-blockchain', {
      //   event_run_id: eventRunId,
      //   transaction_hash: hash,
      //   user_address: address
      // });
      
      setBookingError(null);
      setTransactionFailed(false);
    } catch (err: any) {
      console.error('[BOOKING] Error details:', {
        error: err,
        message: err.message,
        code: err.code,
        reason: err.reason,
        stack: err.stack
      });
      
      setTransactionFailed(true);
      
      // Parse the error to show user-friendly message
      let errorMessage = 'Failed to book event';
      
      if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds. Please add more Sepolia ETH to your wallet.';
      } else if (err.message?.includes('Invalid host')) {
        errorMessage = 'Invalid host wallet address. Please contact support.';
      } else if (err.message?.includes('undefined') || err.message?.includes('contract')) {
        errorMessage = 'Booking contract not deployed. Please contact support.';
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setBookingError(errorMessage);
    }
  };

  // Success modal with transaction details
  if (isSuccess && hash) {
    const explorerUrl = `https://sepolia.etherscan.io/tx/${hash}`;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
          {/* Success Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600">Your transaction has been successfully submitted to the blockchain</p>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Transaction Hash</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-gray-200 flex-1 overflow-x-auto">
                  {hash}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(hash)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Copy transaction hash"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Confirmed
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Network</p>
                <p className="text-sm font-medium text-gray-900">Sepolia Testnet</p>
              </div>
            </div>

            {costData && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Booking Details</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seats Booked:</span>
                    <span className="font-medium text-gray-900">{seatCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket Price:</span>
                    <span className="font-medium text-gray-900">₹{costData.total_price_inr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refundable Stake:</span>
                    <span className="font-medium text-purple-600">₹{costData.stake_inr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total Paid:</span>
                    <span className="font-bold text-gray-900">₹{costData.total_cost_inr.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              View on Etherscan
            </a>
            <button
              onClick={() => {
                setShowModal(false);
                window.location.reload(); // Refresh to show updated bookings
              }}
              className="block w-full text-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900 font-medium"
            >
              Close
            </button>
          </div>

          {/* Info Message */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Important:</span> Your ₹{costData?.stake_inr.toLocaleString('en-IN') || '200'} stake will be refunded after you attend the event. Don&apos;t forget to check in!
            </p>
          </div>
        </div>
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
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
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
                disabled={(isPending || (isConfirming && !transactionFailed)) || !isConnected || (chain && chain.id !== sepolia.id)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                {isPending && !transactionFailed && 'Waiting...'}
                {isConfirming && !transactionFailed && 'Confirming...'}
                {transactionFailed && 'Try Again'}
                {!isPending && !isConfirming && !transactionFailed && (chain && chain.id !== sepolia.id ? 'Wrong Network' : 'Confirm & Pay')}
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

