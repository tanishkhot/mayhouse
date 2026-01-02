'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  EventRunAPI, 
  EventRunSummary, 
  EventRunStatus, 
  HostEventRunBooking,
  formatDate, 
  formatTime, 
  getStatusColor,
  canEditEventRun,
  canCancelEventRun 
} from '@/lib/event-run-api';

interface EventRunsListProps {
  onEditEventRun?: (eventRunId: string, experienceId: string) => void;
  onScheduleNew?: () => void;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

const EventRunsList: React.FC<EventRunsListProps> = ({
  onEditEventRun, 
  onScheduleNew,
  refreshTrigger = 0 
}) => {
  const [eventRuns, setEventRuns] = useState<EventRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventRunStatus | 'all'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<EventRunSummary | null>(null);
  const [bookings, setBookings] = useState<HostEventRunBooking[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string>('');

  const fetchEventRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = statusFilter !== 'all' 
        ? { status_filter: statusFilter as EventRunStatus, limit: 50 } 
        : { limit: 50 };
      
      const runs = await EventRunAPI.listHostEventRuns(params);
      setEventRuns(runs);
    } catch (err: unknown) {
      console.error('Error fetching event runs:', err);
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to fetch event runs');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchEventRuns();
  }, [fetchEventRuns, refreshTrigger]);

  const handleCancelEventRun = async (eventRunId: string) => {
    if (!confirm('Are you sure you want to cancel this event run? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingId(eventRunId);
      await EventRunAPI.updateEventRun(eventRunId, { 
        status: EventRunStatus.CANCELLED 
      });
      
      // Refresh the list
      await fetchEventRuns();
    } catch (err: unknown) {
      console.error('Error cancelling event run:', err);
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to cancel event run');
    } finally {
      setCancellingId(null);
    }
  };

  const closeBookings = () => {
    setIsBookingsOpen(false);
    setSelectedRun(null);
    setBookings(null);
    setBookingsError('');
    setBookingsLoading(false);
  };

  const openBookings = async (run: EventRunSummary) => {
    setSelectedRun(run);
    setIsBookingsOpen(true);
    setBookings(null);
    setBookingsError('');
    setBookingsLoading(true);

    try {
      const data = await EventRunAPI.getHostEventRunBookings(run.id);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Error fetching event run bookings:', err);
      const detail =
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
        (err as { message?: string }).message ||
        'Failed to fetch bookings';
      setBookingsError(detail);
    } finally {
      setBookingsLoading(false);
    }
  };

  if (loading && eventRuns.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <p className="ml-4 text-black">Loading event runs...</p>
      </div>
    );
  }

  const activeRuns = eventRuns.filter(run => 
    [EventRunStatus.SCHEDULED, EventRunStatus.LOW_SEATS, EventRunStatus.SOLD_OUT].includes(run.status)
  );

  return (
    <div className="space-y-6">
      {/* Header with filter and schedule new button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-black">
            Your Event Runs ({activeRuns.length}/2 active)
          </h2>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EventRunStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Status</option>
            <option value={EventRunStatus.SCHEDULED}>Scheduled</option>
            <option value={EventRunStatus.LOW_SEATS}>Low Seats</option>
            <option value={EventRunStatus.SOLD_OUT}>Sold Out</option>
            <option value={EventRunStatus.COMPLETED}>Completed</option>
            <option value={EventRunStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>

        <button
          onClick={onScheduleNew}
          disabled={activeRuns.length >= 2}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeRuns.length >= 2
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
          title={activeRuns.length >= 2 ? 'Maximum 2 active event runs allowed' : 'Schedule a new event run'}
        >
          + Schedule Event Run
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Event Runs List */}
      {eventRuns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-black mb-2">No event runs scheduled</h3>
          <p className="text-black mb-4">
            Schedule event runs for your approved experiences to start accepting bookings.
          </p>
          <button
            onClick={onScheduleNew}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Schedule Your First Event Run
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {eventRuns.map((eventRun) => (
            <div key={eventRun.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                {/* Left side - Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-black break-words">
                      {eventRun.experience_title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(eventRun.status)}`}>
                      {eventRun.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-black">
                    <div>
                      <span className="font-medium">Date:</span><br />
                      {formatDate(eventRun.start_datetime)}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span><br />
                      {formatTime(eventRun.start_datetime)}
                    </div>
                    <div>
                      <span className="font-medium">Capacity:</span><br />
                      {eventRun.available_spots}/{eventRun.max_capacity} available
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-4 text-sm text-black">
                    <span>
                      <span className="font-medium">Domain:</span> {eventRun.experience_domain}
                    </span>
                    {eventRun.neighborhood && (
                      <span>
                        <span className="font-medium">Location:</span> {eventRun.neighborhood}
                      </span>
                    )}
                    <span>
                      <span className="font-medium">Price:</span> ₹{eventRun.price_inr}/person
                    </span>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {canEditEventRun(eventRun) && (
                    <button
                      onClick={() => onEditEventRun?.(eventRun.id, eventRun.experience_id)}
                      className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  
                  {canCancelEventRun(eventRun) && (
                    <button
                      onClick={() => handleCancelEventRun(eventRun.id)}
                      disabled={cancellingId === eventRun.id}
                      className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {cancellingId === eventRun.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}

                  <button
                    onClick={() => openBookings(eventRun)}
                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Progress bar for capacity */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-black mb-1">
                  <span>Bookings</span>
                  <span>{eventRun.max_capacity - eventRun.available_spots}/{eventRun.max_capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((eventRun.max_capacity - eventRun.available_spots) / eventRun.max_capacity) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box about limits */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-500 text-xl">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Event Run Limits</p>
            <p>
              You can have a maximum of 2 active event runs at any time. Complete or cancel existing runs to schedule new ones.
              Active runs include: Scheduled, Low Seats, and Sold Out statuses.
            </p>
          </div>
        </div>
      </div>

      {/* Bookings Modal */}
      {isBookingsOpen && selectedRun && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeBookings}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-lg shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-black break-words">
                  {selectedRun.experience_title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(selectedRun.start_datetime)} at {formatTime(selectedRun.start_datetime)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Capacity: {selectedRun.max_capacity - selectedRun.available_spots}/{selectedRun.max_capacity} booked
                </p>
              </div>
              <button
                type="button"
                onClick={closeBookings}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="px-6 py-4">
              {bookingsLoading ? (
                <div className="py-10 text-center text-gray-700">Loading bookings...</div>
              ) : bookingsError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {bookingsError}
                </div>
              ) : bookings && bookings.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-black font-medium">No bookings yet</p>
                  <p className="text-sm text-gray-600 mt-1">Share your event run link to drive bookings.</p>
                </div>
              ) : bookings ? (
                <div className="space-y-3">
                  {bookings.map((b) => {
                    const bookedAt = b.booked_at ? new Date(b.booked_at) : null;
                    return (
                      <div
                        key={b.id}
                        className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-black break-words">
                              {b.traveler_name || 'N/A'}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {b.booking_status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            Seats: {b.traveler_count}
                          </p>
                          {b.special_requests ? (
                            <p className="text-sm text-gray-700 mt-1 break-words">
                              Special requests: {b.special_requests}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">
                            {bookedAt ? bookedAt.toLocaleString('en-IN') : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            {b.id.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventRunsList;