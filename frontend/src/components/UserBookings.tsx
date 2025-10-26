'use client';

import { useAccount } from 'wagmi';
import { useGetUserBookings, useGetBooking, formatEthValue, BookingStatus } from '@/lib/contract';

export default function UserBookings() {
  const { address, isConnected } = useAccount();
  const { data: bookingIds, isLoading, error } = useGetUserBookings(address);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to view your bookings</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 font-semibold mb-2">Error loading bookings</p>
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!bookingIds || bookingIds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-gray-800 font-semibold mb-2">No bookings found</p>
          <p className="text-sm text-gray-600 mb-4">You haven&apos;t made any bookings yet</p>
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
      <h2 className="text-2xl font-bold mb-4">Your Bookings</h2>
      {(bookingIds as readonly bigint[]).map((bookingId) => (
        <BookingCard key={bookingId.toString()} bookingId={Number(bookingId)} />
      ))}
    </div>
  );
}

function BookingCard({ bookingId }: { bookingId: number }) {
  const { data: bookingData, isLoading } = useGetBooking(bookingId);

  if (isLoading || !bookingData) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const booking = bookingData as any;
  const statusLabels = ['Active', 'Completed', 'No Show', 'Cancelled'];
  const statusColors = ['blue', 'green', 'red', 'gray'];
  const statusColor = statusColors[booking.status] || 'gray';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Booking #{bookingId}</h3>
          <p className="text-gray-600 text-sm">Event Run #{booking.eventRunId.toString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${statusColor}-100 text-${statusColor}-800`}>
          {statusLabels[booking.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Seats Booked</p>
          <p className="font-semibold">{booking.seatCount.toString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Payment</p>
          <p className="font-semibold">{formatEthValue(booking.totalPayment)} ETH</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Your Stake</p>
          <p className="font-semibold text-purple-600">{formatEthValue(booking.userStake)} ETH</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Booked At</p>
          <p className="font-semibold">
            {new Date(Number(booking.bookedAt) * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {booking.status === BookingStatus.Active && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-semibold">📅 Upcoming Event</p>
          <p className="text-xs mt-1">
            Make sure to attend! You&apos;ll get your {formatEthValue(booking.userStake)} ETH stake back.
          </p>
        </div>
      )}

      {booking.status === BookingStatus.Completed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          <p className="font-semibold">✅ Event Completed</p>
          <p className="text-xs mt-1">
            Your {formatEthValue(booking.userStake)} ETH stake has been returned. Thanks for attending!
          </p>
        </div>
      )}

      {booking.status === BookingStatus.NoShow && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <p className="font-semibold">❌ No Show</p>
          <p className="text-xs mt-1">
            You missed this event. Your {formatEthValue(booking.userStake)} ETH stake was forfeited.
          </p>
        </div>
      )}

      {booking.status === BookingStatus.Cancelled && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800">
          <p className="font-semibold">Event Cancelled</p>
          <p className="text-xs mt-1">
            This event was cancelled. Your payment and stake have been refunded.
          </p>
        </div>
      )}
    </div>
  );
}

