'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  useGetHostEvents, 
  useGetEventRun, 
  useGetEventBookings,
  useGetBooking,
  useCompleteEvent, 
  useCancelEvent,
  formatEthValue,
  EventStatus 
} from '@/lib/contract';

export default function HostDashboard() {
  const { address, isConnected } = useAccount();
  const { data: hostEventIds, isLoading, error } = useGetHostEvents(address);
  
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to view your events</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 font-semibold mb-2">Error loading events</p>
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!hostEventIds || hostEventIds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-gray-800 font-semibold mb-2">No events found</p>
          <p className="text-sm text-gray-600 mb-4">You haven&apos;t created any events yet</p>
          <div className="text-left text-xs text-gray-500 bg-white p-3 rounded border border-gray-200">
            <p className="font-mono mb-1">Connected: {address?.substring(0, 10)}...{address?.substring(38)}</p>
            <p className="font-mono">Contract: 0x09aB6...1eAD5</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Your Events</h2>
      {(hostEventIds as readonly bigint[]).map((eventId) => (
        <EventCard key={eventId.toString()} eventRunId={Number(eventId)} />
      ))}
    </div>
  );
}

function EventCard({ eventRunId }: { eventRunId: number }) {
  // Get current time once using lazy initialization (avoids calling Date.now during render)
  const [currentTime] = React.useState(() => Date.now());
  
  const { data: eventData, isLoading, refetch: refetchEvent } = useGetEventRun(eventRunId);
  const { data: bookingIds, refetch: refetchBookings } = useGetEventBookings(eventRunId);
  const { completeEvent, isPending: isCompleting } = useCompleteEvent();
  const { cancelEvent, isPending: isCancelling } = useCancelEvent();
  
  const [showCompleteModal, setShowCompleteModal] = React.useState(false);
  const [attendedBookings, setAttendedBookings] = React.useState<number[]>([]);

  if (isLoading || !eventData) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const event = eventData as any;
  const statusLabels = ['Created', 'Active', 'Full', 'Completed', 'Cancelled'];
  const statusColors = ['gray', 'blue', 'yellow', 'green', 'red'];
  const statusColor = statusColors[event.status] || 'gray';

  // Check if event is in the future (using time captured at component initialization)
  const isEventInFuture = Number(event.eventTimestamp) * 1000 > currentTime;

  const handleComplete = async () => {
    if (!bookingIds || bookingIds.length === 0) {
      alert('No bookings to complete. Cancel the event instead.');
      return;
    }

    try {
      console.log('Completing event with booking IDs:', attendedBookings);
      await completeEvent(eventRunId, attendedBookings);
      setShowCompleteModal(false);
      setAttendedBookings([]);
      // Refresh data
      setTimeout(() => {
        refetchEvent();
        refetchBookings();
      }, 2000);
      alert('Event completed successfully! Attendees will get their stakes back.');
    } catch (err: any) {
      console.error('Complete event error:', err);
      alert(err.shortMessage || err.message || 'Failed to complete event');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this event? All users will be refunded.')) {
      return;
    }
    try {
      await cancelEvent(eventRunId);
      setTimeout(() => refetchEvent(), 2000);
      alert('Event cancelled successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel event');
    }
  };

  const toggleBookingAttendance = (bookingId: number) => {
    setAttendedBookings(prev => 
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">Event #{eventRunId}</h3>
            <p className="text-gray-600 text-sm">Experience: {event.experienceId}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${statusColor}-100 text-${statusColor}-800`}>
            {statusLabels[event.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Price per Seat</p>
            <p className="font-semibold">{formatEthValue(event.pricePerSeat)} ETH</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Seats</p>
            <p className="font-semibold">{event.seatsBooked.toString()}/{event.maxSeats.toString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Your Stake</p>
            <p className="font-semibold text-purple-600">{formatEthValue(event.hostStake)} ETH</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Event Date</p>
            <p className="font-semibold">
              {new Date(Number(event.eventTimestamp) * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>💰 Expected Payout:</strong> {formatEthValue(BigInt(event.pricePerSeat) * BigInt(event.seatsBooked))} ETH
          </p>
          <p className="text-xs text-blue-600 mt-1">
            (Plus your {formatEthValue(event.hostStake)} ETH stake back)
          </p>
        </div>

        {/* Show bookings if any */}
        {bookingIds && bookingIds.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">📋 Bookings ({bookingIds.length})</h4>
            <div className="space-y-1 text-sm text-gray-700">
              {(bookingIds as readonly bigint[]).map((bookingId) => (
                <BookingPreview key={bookingId.toString()} bookingId={Number(bookingId)} />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(event.status === EventStatus.Active || event.status === EventStatus.Full) && (
          <>
            {/* Check if event time has passed */}
            {isEventInFuture && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                <p className="font-semibold">⏰ Event hasn&apos;t occurred yet</p>
                <p className="text-xs mt-1">
                  You can complete the event after {new Date(Number(event.eventTimestamp) * 1000).toLocaleString()}
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(true)}
                disabled={
                  isCompleting || 
                  !bookingIds || 
                  bookingIds.length === 0 || 
                  isEventInFuture
                }
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={
                  isEventInFuture
                    ? 'Event has not occurred yet'
                    : 'Complete event'
                }
              >
                {isCompleting ? 'Completing...' : 'Complete Event'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Event'}
              </button>
            </div>
          </>
        )}

        {event.status === EventStatus.Completed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold">✅ Event Completed</p>
            <p className="text-sm text-green-600">Your payout and stake have been transferred</p>
          </div>
        )}

        {event.status === EventStatus.Cancelled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 font-semibold">❌ Event Cancelled</p>
            <p className="text-sm text-red-600">All refunds have been processed</p>
          </div>
        )}
      </div>

      {/* Complete Event Modal */}
      {showCompleteModal && bookingIds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Complete Event</h2>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-gray-700">
                  Select which users attended the event.
                </p>
                <button
                  onClick={() => {
                    const allIds = (bookingIds as readonly bigint[]).map(id => Number(id));
                    setAttendedBookings(attendedBookings.length === allIds.length ? [] : allIds);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {attendedBookings.length === bookingIds.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(bookingIds as readonly bigint[]).map((bookingId) => (
                  <BookingCheckbox
                    key={bookingId.toString()}
                    bookingId={Number(bookingId)}
                    isChecked={attendedBookings.includes(Number(bookingId))}
                    onToggle={() => toggleBookingAttendance(Number(bookingId))}
                  />
                ))}
              </div>

              {bookingIds.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <p>⚠️ No bookings for this event yet.</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <p className="text-gray-700">
                <strong>Selected:</strong> {attendedBookings.length} / {bookingIds.length} attendees
              </p>
              <p className="text-xs text-gray-600 mt-1">
                No-shows: {bookingIds.length - attendedBookings.length}
              </p>
              {attendedBookings.length === 0 && bookingIds.length > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ All users will be marked as no-shows and forfeit their stakes
                </p>
              )}
              {attendedBookings.length === bookingIds.length && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ All users will get their stakes back
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setAttendedBookings([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isCompleting}
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={isCompleting || bookingIds.length === 0}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                title={bookingIds.length === 0 ? 'No bookings to complete' : 'Complete event and distribute stakes'}
              >
                {isCompleting ? 'Processing...' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Component to show booking preview
function BookingPreview({ bookingId }: { bookingId: number }) {
  const { data: booking } = useGetBooking(bookingId);
  
  if (!booking) return <div className="text-gray-400">Loading booking #{bookingId}...</div>;
  
  const bookingData = booking as any;
  return (
    <div className="flex justify-between items-center py-1">
      <span>Booking #{bookingId}</span>
      <span className="text-gray-600">{bookingData.seatCount.toString()} seat(s)</span>
    </div>
  );
}

// Checkbox component for attendance selection
function BookingCheckbox({ 
  bookingId, 
  isChecked, 
  onToggle 
}: { 
  bookingId: number; 
  isChecked: boolean; 
  onToggle: () => void;
}) {
  const { data: booking } = useGetBooking(bookingId);
  
  if (!booking) {
    return (
      <div className="flex items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const bookingData = booking as any;
  
  return (
    <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
      />
      <div className="flex-1">
        <div className="font-medium text-gray-900">Booking #{bookingId}</div>
        <div className="text-sm text-gray-600">
          User: {bookingData.user.substring(0, 6)}...{bookingData.user.substring(38)}
        </div>
        <div className="text-sm text-gray-600">
          {bookingData.seatCount.toString()} seat(s) • Stake: {formatEthValue(bookingData.userStake)} ETH
        </div>
      </div>
      <div className="ml-2">
        {isChecked ? (
          <span className="text-green-600 font-semibold text-sm">✓ Attended</span>
        ) : (
          <span className="text-red-600 font-semibold text-sm">✗ No-show</span>
        )}
      </div>
    </label>
  );
}
