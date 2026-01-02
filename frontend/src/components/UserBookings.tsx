'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileAPI } from '@/lib/api';
import { formatPrice } from '@/lib/experience-preview-normalizer';

// Define types based on backend response
interface Booking {
  id: string;
  event_run_id: string;
  seat_count: number;
  total_amount_inr: number;
  booking_status: string;
  created_at: string;
  event_run?: {
    id: string;
    start_datetime: string;
    end_datetime: string;
    status: string;
    experiences?: {
      id: string;
      title: string;
      experience_domain: string;
    };
  };
}

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        // Fetch bookings from backend (Web2)
        const data = await ProfileAPI.getBookings();
        // Handle case where API returns object or array
        const bookingList = Array.isArray(data) ? data : []; 
        setBookings(bookingList as Booking[]);
      } catch (err: any) {
        console.error('Failed to fetch bookings:', err);
        setError(err.message || 'Failed to load bookings');
        // Don't show toast on initial load to avoid annoyance, just show error UI
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 font-semibold mb-2">Error loading bookings</p>
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-gray-800 font-semibold mb-2">No bookings found</p>
          <p className="text-sm text-gray-600 mb-4">You haven&apos;t made any bookings yet</p>
          <a href="/explore" className="text-terracotta-600 hover:underline">
            Explore Experiences
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Your Bookings</h2>
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    pending: 'Pending',
  };
  
  const getStatusClasses = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const experienceTitle = booking.event_run?.experiences?.title || 'Unknown Experience';
  const eventDate = booking.event_run?.start_datetime 
    ? new Date(booking.event_run.start_datetime).toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })
    : 'Date TBA';
  const eventTime = booking.event_run?.start_datetime
    ? new Date(booking.event_run.start_datetime).toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit'
      })
    : '';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{experienceTitle}</h3>
          <p className="text-gray-600 text-sm mt-1">Booking #{booking.id.substring(0, 8)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusClasses(booking.booking_status)}`}>
          {statusLabels[booking.booking_status] || booking.booking_status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Date & Time</p>
          <p className="font-semibold text-gray-900">
            {eventDate}
            {eventTime && <span className="block text-sm text-gray-600">{eventTime}</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Seats</p>
          <p className="font-semibold text-gray-900">{booking.seat_count} {booking.seat_count === 1 ? 'Person' : 'People'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Paid</p>
          <p className="font-semibold text-gray-900">{formatPrice(booking.total_amount_inr)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
          <p className="font-semibold text-gray-900 capitalize">
            {booking.event_run?.experiences?.experience_domain || 'Mumbai'}
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {booking.booking_status === 'confirmed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-start gap-2">
          <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">Booking Confirmed</p>
            <p className="text-xs mt-1">
              Your spot is secured. Please arrive 10 minutes early at the meeting point.
            </p>
          </div>
        </div>
      )}

      {booking.booking_status === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <p className="font-semibold">Booking Cancelled</p>
          <p className="text-xs mt-1">
            Refund has been processed to your original payment method.
          </p>
        </div>
      )}
    </div>
  );
}
