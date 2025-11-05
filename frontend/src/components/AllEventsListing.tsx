'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useGetEventRun, formatEthValue, EventStatus } from '@/lib/contract';
import BookEventButton from './BookEventButton';
import { Skeleton } from '@/components/ui/skeleton';

// Try to load events from 1 to MAX_EVENTS_TO_CHECK
const MAX_EVENTS_TO_CHECK = 100;

export default function AllEventsListing() {
  const { isConnected } = useAccount();
  const [validEventIds, setValidEventIds] = useState<number[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  // Scan for valid events (this is a simple approach for testing)
  // In production, you'd want the contract to emit events or have a getter
  useEffect(() => {
    if (isConnected) {
      // Use startTransition for non-blocking state updates
      React.startTransition(() => {
        // For now, we'll just show events 1-10 and let individual cards handle errors
        // A better approach would be to have the contract emit all event IDs
        setValidEventIds(Array.from({ length: MAX_EVENTS_TO_CHECK }, (_, i) => i + 1));
        setIsScanning(false);
      });
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to view events</p>
      </div>
    );
  }

  if (isScanning) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Available Events</h2>
        <p className="text-sm text-gray-600">Showing recent events</p>
      </div>
      
      <div className="grid gap-4">
        {validEventIds.map((eventId) => (
          <EventListingCard key={eventId} eventRunId={eventId} />
        ))}
      </div>
    </div>
  );
}

function EventListingCard({ eventRunId }: { eventRunId: number }) {
  // Get current time once using lazy initialization (avoids calling Date.now during render)
  const [currentTime] = React.useState(() => Date.now());
  
  const { data: eventData, isLoading, error } = useGetEventRun(eventRunId);
  const { address: userAddress } = useAccount();

  // Hide if event doesn't exist (error means event ID doesn't exist)
  if (error || (!isLoading && !eventData)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!eventData) return null;

  const event = eventData as any;
  const statusLabels = ['Created', 'Active', 'Full', 'Completed', 'Cancelled'];
  const statusColors = ['gray', 'blue', 'yellow', 'green', 'red'];
  const statusColor = statusColors[event.status] || 'gray';
  
  const availableSeats = Number(event.maxSeats) - Number(event.seatsBooked);
  const isHost = userAddress?.toLowerCase() === event.host.toLowerCase();
  
  // Check if event is in the past (using time captured at component initialization)
  const isPast = Number(event.eventTimestamp) * 1000 < currentTime;
  
  const canBook = event.status === EventStatus.Active && !isPast && !isHost && availableSeats > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-100 hover:border-purple-200 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Event #{eventRunId}</h3>
          <p className="text-gray-600 text-sm">Experience: {event.experienceId}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${statusColor}-100 text-${statusColor}-800`}>
          {statusLabels[event.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Price per Seat</p>
          <p className="font-semibold text-lg">{formatEthValue(event.pricePerSeat)} ETH</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Available Seats</p>
          <p className="font-semibold text-lg">
            {availableSeats} / {event.maxSeats.toString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Event Date</p>
          <p className="font-semibold">
            {new Date(Number(event.eventTimestamp) * 1000).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Host</p>
          <p className="font-semibold text-xs font-mono">
            {event.host.substring(0, 6)}...{event.host.substring(38)}
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {isHost && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
          <p className="font-semibold">👨‍💼 You&apos;re the host of this event</p>
          <p className="text-xs mt-1">Go to &quot;Host Dashboard&quot; to manage this event</p>
        </div>
      )}

      {isPast && !isHost && event.status === EventStatus.Active && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm text-gray-700">
          <p>⏰ This event has already occurred</p>
        </div>
      )}

      {event.status === EventStatus.Completed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
          <p>✅ Event completed</p>
        </div>
      )}

      {event.status === EventStatus.Cancelled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
          <p>❌ Event cancelled</p>
        </div>
      )}

      {event.status === EventStatus.Full && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
          <p>🎫 Event is fully booked</p>
        </div>
      )}

      {/* Booking Details */}
      {canBook && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-purple-800 mb-1">
            <strong>Total Cost:</strong> {formatEthValue(event.pricePerSeat)} ETH + 20% stake
          </p>
          <p className="text-xs text-purple-600">
            (Stake returned after attending)
          </p>
        </div>
      )}

      {/* Book Button */}
      {canBook ? (
        <BookEventButton 
          eventRunId={eventRunId.toString()} 
          availableSeats={availableSeats}
        />
      ) : (
        <button
          disabled
          className="w-full bg-gray-300 text-gray-600 py-3 rounded-lg font-semibold cursor-not-allowed"
        >
          {isHost ? "You're the Host" : 
           event.status === EventStatus.Completed ? 'Event Completed' :
           event.status === EventStatus.Cancelled ? 'Event Cancelled' :
           event.status === EventStatus.Full ? 'Fully Booked' :
           isPast ? 'Event Past' : 'Not Available'}
        </button>
      )}
    </div>
  );
}

