'use client';

import { useState, useEffect } from 'react';
import { BlockchainAPI } from '@/lib/blockchain-api';
import { BookingsAPI } from '@/lib/bookings-api';

interface BookEventButtonProps {
  eventRunId: string;  // Database ID (UUID)
  availableSeats: number;
  hostWalletAddress?: string; // Host's wallet address (deprecated, kept for compatibility)
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
  const [seatCount, setSeatCount] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [costData, setCostData] = useState<any>(null);
  const [loadingCost, setLoadingCost] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  
  // Reset booking state when modal opens
  useEffect(() => {
    if (showModal) {
      setBookingError(null);
      setBookingSuccess(false);
      setBookingData(null);
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
    setIsBooking(true);

    if (!costData) {
      setBookingError('Could not calculate booking cost');
      setIsBooking(false);
      return;
    }

    try {
      console.log('[BOOKING] Starting booking process:', {
        eventRunId,
        seatCount,
        costData,
      });
      
      // Call the backend API to create booking
      const booking = await BookingsAPI.createBooking({
        event_run_id: eventRunId,
        seat_count: seatCount,
      });
      
      console.log('[BOOKING] Success! Booking created:', booking);
      
      setBookingData(booking);
      setBookingSuccess(true);
      setBookingError(null);
    } catch (err: any) {
      console.error('[BOOKING] Error details:', {
        error: err,
        message: err.message,
        response: err.response?.data,
      });
      
      // Parse the error to show user-friendly message
      let errorMessage = 'Failed to book event';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setBookingError(errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  // Success modal with booking confirmation
  if (bookingSuccess && bookingData) {
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
            <p className="text-gray-600">Your booking has been successfully created</p>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Booking ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-gray-200 flex-1 overflow-x-auto">
                  {bookingData.id}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(bookingData.id)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Copy booking ID"
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
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  Confirmed
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Payment</p>
                <p className="text-sm font-medium text-gray-900">{bookingData.payment?.status || 'Completed'}</p>
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
                    <span className="text-gray-600">Refundable Deposit:</span>
                    <span className="font-medium text-terracotta-600">₹{costData.stake_inr.toLocaleString('en-IN')}</span>
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
            <button
              onClick={() => {
                setShowModal(false);
                setBookingSuccess(false);
                window.location.reload(); // Refresh to show updated bookings
              }}
              className="block w-full text-center bg-terracotta-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-terracotta-600 transition-all"
            >
              Close
            </button>
          </div>

          {/* Info Message */}
          <div className="mt-4 bg-terracotta-50 border border-terracotta-200 rounded-lg p-3">
            <p className="text-sm text-terracotta-800">
              <span className="font-semibold">Important:</span> Your ₹{costData?.stake_inr.toLocaleString('en-IN') || '200'} refundable deposit will be returned after you attend the event. Don&apos;t forget to check in!
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
        className="w-full bg-terracotta-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 text-gray-900 bg-white"
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
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Refundable Deposit (20%):</span>
                  <div className="text-right">
                    <div className="font-semibold text-terracotta-600">
                      ₹{costData.stake_inr.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total to Pay:</span>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">
                      ₹{costData.total_cost_inr.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * You&apos;ll get your ₹{costData.stake_inr.toLocaleString('en-IN')} refundable deposit back after attending the event
                </p>
              </div>
            ) : null}

            {/* Error Display */}
            {bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1">Booking Error</h4>
                    <p className="text-sm text-red-800 leading-relaxed">
                      {bookingError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900 font-medium"
                disabled={isBooking}
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={isBooking || !costData}
                className="flex-1 bg-terracotta-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-terracotta-600 disabled:opacity-50 transition-all"
              >
                {isBooking ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

