'use client';

import { useQuery } from '@tanstack/react-query';
import { BookingsAPI } from '@/lib/bookings-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookingCard from '@/components/bookings/BookingCard';

export default function MyBookingsPage() {
  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => BookingsAPI.getMyBookings(),
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">Error loading bookings</p>
            <p className="text-sm text-red-600 mb-4">
              {(error as Error).message || 'Failed to load bookings'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const now = new Date();
  const upcoming = (bookings || []).filter((booking) => {
    const startDate = booking.event_run?.start_datetime 
      ? new Date(booking.event_run.start_datetime)
      : null;
    return startDate && startDate > now && booking.booking_status !== 'cancelled';
  });
  
  const past = (bookings || []).filter((booking) => {
    const startDate = booking.event_run?.start_datetime 
      ? new Date(booking.event_run.start_datetime)
      : null;
    return !startDate || startDate <= now || booking.booking_status === 'cancelled';
  });
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>
        
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({past.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            {upcoming.length === 0 ? (
              <EmptyState message="No upcoming bookings" />
            ) : (
              <div className="space-y-4">
                {upcoming.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            {past.length === 0 ? (
              <EmptyState message="No past bookings" />
            ) : (
              <div className="space-y-4">
                {past.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
      <p className="text-gray-600 mb-4">{message}</p>
      <a 
        href="/explore" 
        className="text-terracotta-600 hover:text-terracotta-700 font-medium"
      >
        Explore Experiences
      </a>
    </div>
  );
}

