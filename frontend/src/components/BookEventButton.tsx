'use client';

import { useState, useEffect } from 'react';
import { BookingsAPI, BookingCostResponse, BookingResponse } from '@/lib/bookings-api';

// Mock mode toggle - set to true to use mock booking functions for testing
const USE_MOCK_BOOKING = true; // Change to false to use real API

interface BookEventButtonProps {
  eventRunId: string;  // Database ID (UUID)
  availableSeats: number;
  hostWalletAddress?: string; // Host's wallet address (deprecated, kept for compatibility)
  eventTimestamp?: string; // Event start time
  priceINR?: number; // Price in INR (optional for legacy components)
}

// Mock functions for testing
const mockCalculateCost = async (eventRunId: string, seatCount: number, pricePerSeat: number): Promise<BookingCostResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate costs
  const totalPrice = pricePerSeat * seatCount;
  const stake = Math.round(totalPrice * 0.2); // 20% refundable deposit
  const totalCost = totalPrice + stake;
  
  return {
    event_run_id: eventRunId,
    seat_count: seatCount,
    price_per_seat_inr: pricePerSeat,
    total_price_inr: totalPrice,
    stake_inr: stake,
    total_cost_inr: totalCost,
  };
};

const mockCreateBooking = async (eventRunId: string, seatCount: number, costData: BookingCostResponse): Promise<BookingResponse> => {
  // Simulate API delay (2 seconds to simulate processing)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock booking ID
  const mockBookingId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const mockPaymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const mockTransactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: mockBookingId,
    event_run_id: eventRunId,
    user_id: 'mock-user-id',
    seat_count: seatCount,
    total_amount_inr: costData.total_cost_inr,
    booking_status: 'confirmed',
    payment: {
      payment_id: mockPaymentId,
      status: 'completed',
      amount_inr: costData.total_cost_inr,
      transaction_id: mockTransactionId,
      timestamp: new Date().toISOString(),
      payment_method: 'mock_payment',
    },
    created_at: new Date().toISOString(),
  };
};

export default function BookEventButton({ 
  eventRunId, 
  availableSeats, 
  hostWalletAddress,
  eventTimestamp,
  priceINR = 0 // Default to 0 for legacy components
}: BookEventButtonProps) {
  const [seatCount, setSeatCount] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [costData, setCostData] = useState<BookingCostResponse | null>(null);
  const [loadingCost, setLoadingCost] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState<BookingResponse | null>(null);
  
  // Log mock mode status on mount
  useEffect(() => {
    if (USE_MOCK_BOOKING) {
      console.log('[BOOKING] MOCK MODE ENABLED - Using mock booking functions for testing');
    }
  }, []);

  // Reset booking state when modal opens
  useEffect(() => {
    if (showModal) {
      setBookingError(null);
      setBookingSuccess(false);
      setBookingData(null);
    }
  }, [showModal]);

  // Fetch cost from backend API or mock
  useEffect(() => {
    if (!showModal) return;
    
    const fetchCost = async () => {
      setLoadingCost(true);
      try {
        let response: BookingCostResponse;
        
        if (USE_MOCK_BOOKING) {
          console.log('[BOOKING] Using mock calculateCost');
          const pricePerSeat = priceINR > 0 ? priceINR : 500; // Use priceINR prop or default to 500
          response = await mockCalculateCost(eventRunId, seatCount, pricePerSeat);
        } else {
          response = await BookingsAPI.calculateCost({
            event_run_id: eventRunId,
            seat_count: seatCount
          });
        }
        
        setCostData(response);
      } catch (err) {
        console.error('Failed to fetch booking cost:', err);
        setCostData(null);
      } finally {
        setLoadingCost(false);
      }
    };

    fetchCost();
  }, [eventRunId, seatCount, showModal, priceINR]);

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
        mockMode: USE_MOCK_BOOKING,
      });
      
      let booking: BookingResponse;
      
      if (USE_MOCK_BOOKING) {
        console.log('[BOOKING] Using mock createBooking');
        booking = await mockCreateBooking(eventRunId, seatCount, costData);
        console.log('[BOOKING] Mock booking created:', booking);
      } else {
        booking = await BookingsAPI.createBooking({
          event_run_id: eventRunId,
          seat_count: seatCount,
        });
      }
      
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
      <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card text-card-foreground rounded-xl shadow-2xl max-w-lg w-full p-6 border border-border">
          {/* Mock Mode Indicator */}
          {USE_MOCK_BOOKING && (
            <div className="mb-4 p-2 bg-accent border border-terracotta-600 rounded-lg">
              <p className="text-xs font-semibold text-terracotta-600 text-center">
                MOCK MODE: This is a test booking
              </p>
            </div>
          )}
          
          {/* Success Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4 border border-border">
              <svg className="w-8 h-8 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h3>
            <p className="text-muted-foreground">Your booking has been successfully created</p>
          </div>

          {/* Booking Details */}
          <div className="bg-muted rounded-lg p-4 mb-6 space-y-3 border border-border">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Booking ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-foreground font-mono bg-background px-3 py-2 rounded border border-border flex-1 overflow-x-auto">
                  {bookingData.id}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(bookingData.id)}
                  className="p-2 hover:bg-accent rounded transition-all duration-300 active:scale-95 active:duration-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  title="Copy booking ID"
                >
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Status</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent text-terracotta-600 text-sm font-medium rounded-full border border-border">
                  <span className="w-2 h-2 bg-terracotta-600 rounded-full"></span>
                  Confirmed
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Payment</p>
                <p className="text-sm font-medium text-foreground">{bookingData.payment?.status || 'Completed'}</p>
              </div>
            </div>

            {costData && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Booking Details</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seats Booked:</span>
                    <span className="font-medium text-foreground">{seatCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Price:</span>
                    <span className="font-medium text-foreground">₹{costData.total_price_inr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refundable Deposit:</span>
                    <span className="font-medium text-primary">₹{costData.stake_inr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-border">
                    <span className="font-semibold text-foreground">Total Paid:</span>
                    <span className="font-bold text-foreground">₹{costData.total_cost_inr.toLocaleString('en-IN')}</span>
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
                setBookingData(null);
                // Don't reload in mock mode - just reset state
                if (!USE_MOCK_BOOKING) {
                  window.location.reload(); // Refresh to show updated bookings
                }
              }}
              className="block w-full text-center bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 active:scale-95 active:duration-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 disabled:pointer-events-none"
            >
              Close
            </button>
          </div>

          {/* Info Message */}
          <div className="mt-4 bg-accent border border-border rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Important:</span> Your ₹{costData?.stake_inr.toLocaleString('en-IN') || '200'} refundable deposit will be returned after you attend the event. Don&apos;t forget to check in!
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
      {/* Mock Mode Indicator on Button */}
      {USE_MOCK_BOOKING && (
        <div className="mb-2 p-1.5 bg-accent border border-terracotta-600 rounded text-center">
          <p className="text-xs font-semibold text-terracotta-600">
            MOCK MODE: Test booking enabled
          </p>
        </div>
      )}
      
      <button
        onClick={handleOpenModal}
        disabled={availableSeats === 0}
        className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 active:scale-95 active:duration-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 disabled:pointer-events-none"
      >
        {availableSeats === 0 ? 'Sold Out' : 'Book Now'}
      </button>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-xl shadow-2xl max-w-md w-full p-6 border border-border">
            {/* Mock Mode Indicator in Modal */}
            {USE_MOCK_BOOKING && (
              <div className="mb-4 p-2 bg-accent border border-terracotta-600 rounded-lg">
                <p className="text-xs font-semibold text-terracotta-600 text-center">
                  MOCK MODE: Using test booking functions
                </p>
              </div>
            )}
            
            <h2 className="text-2xl font-bold mb-4 text-foreground">Book Event</h2>

            {/* Seat Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Number of Seats
              </label>
              <select
                value={seatCount}
                onChange={(e) => setSeatCount(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground transition-all duration-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
              <div className="bg-muted rounded-lg p-4 mb-4 text-center border border-border">
                <p className="text-muted-foreground">Calculating cost...</p>
              </div>
            ) : costData ? (
              <div className="bg-muted rounded-lg p-4 mb-4 space-y-2 text-sm border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Price:</span>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">
                      ₹{costData.total_price_inr.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refundable Deposit (20%):</span>
                  <div className="text-right">
                    <div className="font-semibold text-primary">
                      ₹{costData.stake_inr.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">Total to Pay:</span>
                  <div className="text-right">
                    <div className="font-bold text-lg text-foreground">
                      ₹{costData.total_cost_inr.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * You&apos;ll get your ₹{costData.stake_inr.toLocaleString('en-IN')} refundable deposit back after attending the event
                </p>
              </div>
            ) : null}

            {/* Error Display */}
            {bookingError && (
              <div className="bg-muted border border-destructive/30 rounded-lg p-4 mb-4 text-destructive">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-destructive flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Booking Error</h4>
                    <p className="text-sm text-destructive leading-relaxed">
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
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-card text-foreground font-medium hover:bg-accent transition-all duration-300 active:scale-95 active:duration-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 disabled:pointer-events-none"
                disabled={isBooking}
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={isBooking || !costData}
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 active:scale-95 active:duration-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 disabled:pointer-events-none"
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

