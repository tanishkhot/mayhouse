import { api } from './api';

// Event Run Types based on backend schemas
export enum EventRunStatus {
  SCHEDULED = 'scheduled',
  LOW_SEATS = 'low_seats',
  SOLD_OUT = 'sold_out',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export type EventRunCreate = {
  experience_id: string;
  start_datetime: string; // ISO string
  end_datetime: string; // ISO string
  max_capacity: number; // 1-4
  special_pricing_inr?: number | null;
  host_meeting_instructions?: string | null;
  group_pairing_enabled: boolean;
};

export type EventRunUpdate = {
  start_datetime?: string | null;
  end_datetime?: string | null;
  max_capacity?: number | null;
  special_pricing_inr?: number | null;
  status?: EventRunStatus | null;
  host_meeting_instructions?: string | null;
  group_pairing_enabled?: boolean | null;
};

export type EventRunBookingSummary = {
  total_bookings: number;
  confirmed_bookings: number;
  total_travelers: number;
  available_spots: number;
};

export type HostEventRunBooking = {
  id: string;
  traveler_name: string;
  traveler_count: number;
  booking_status: string;
  booked_at: string;
  special_requests?: string | null;
};

export type EventRunResponse = {
  id: string;
  experience_id: string;
  start_datetime: string;
  end_datetime: string;
  max_capacity: number;
  special_pricing_inr?: number | null;
  status: EventRunStatus;
  host_meeting_instructions?: string | null;
  group_pairing_enabled: boolean;
  created_at: string;
  updated_at: string;
  booking_summary?: EventRunBookingSummary | null;
  experience_title?: string | null;
  experience_domain?: string | null;
  host_id?: string | null;
  host_name?: string | null;
  host_wallet_address?: string | null;
  price_inr?: number | null;
  duration_minutes?: number | null;
  neighborhood?: string | null;
};

export type EventRunSummary = {
  id: string;
  experience_id: string;
  start_datetime: string;
  max_capacity: number;
  status: EventRunStatus;
  available_spots: number;
  price_inr: number;
  experience_title: string;
  experience_domain: string;
  neighborhood?: string | null;
};

// API Methods
export const EventRunAPI = {
  // Host endpoints
  createEventRun: (payload: EventRunCreate) =>
    api.post<EventRunResponse>('/hosts/event-runs', payload).then((r) => r.data),

  listHostEventRuns: (params?: { 
    status_filter?: EventRunStatus; 
    limit?: number; 
    offset?: number; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/hosts/event-runs?${queryString}` : '/hosts/event-runs';
    return api.get<EventRunSummary[]>(url).then((r) => r.data);
  },

  getEventRunDetails: (eventRunId: string) =>
    api.get<EventRunResponse>(`/hosts/event-runs/${eventRunId}`).then((r) => r.data),

  getHostEventRunBookings: (eventRunId: string) =>
    api
      .get<HostEventRunBooking[]>(`/hosts/event-runs/${eventRunId}/bookings`)
      .then((r) => r.data),

  updateEventRun: async (eventRunId: string, payload: EventRunUpdate) => {
    // Get current user to extract host_id
    const userResponse = await api.get('/auth/me');
    const userData = userResponse.data;
    
    // Wrap payload in the format backend expects
    const wrappedPayload = {
      host_id: userData.id,
      update_data: payload
    };
    
    return api.put<EventRunResponse>(`/hosts/event-runs/${eventRunId}`, wrappedPayload).then((r) => r.data);
  },

  deleteEventRun: (eventRunId: string) =>
    api.delete<Record<string, string>>(`/hosts/event-runs/${eventRunId}`).then((r) => r.data),

  getHostEventRunsSummary: () =>
    api.get<{
      host_id: string;
      host_name: string;
      total_event_runs: number;
      status_counts: Record<string, number>;
      upcoming_runs_7_days: number;
      total_capacity_offered: number;
      recent_runs: EventRunSummary[];
    }>('/hosts/event-runs/dashboard/summary').then((r) => r.data),

  // Public endpoints (for discovery)
  discoverEventRuns: (params?: {
    experience_id?: string;
    start_date?: string;
    end_date?: string;
    domain?: string;
    neighborhood?: string;
    status?: EventRunStatus;
    min_price?: number;
    max_price?: number;
    available_only?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/event-runs?${queryString}` : '/event-runs';
    return api.get<EventRunSummary[]>(url).then((r) => r.data);
  },

  getFeaturedEventRuns: (limit: number = 20) =>
    api.get<EventRunSummary[]>(`/event-runs/featured?limit=${limit}`).then((r) => r.data),

  getPublicEventRunDetails: (eventRunId: string) =>
    api.get<EventRunResponse>(`/event-runs/${eventRunId}`).then((r) => r.data),
};

// Helper functions
export const formatDateTime = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateTimeString;
  }
};

export const formatDate = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateTimeString;
  }
};

export const formatTime = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return dateTimeString;
  }
};

export const getStatusColor = (status: EventRunStatus): string => {
  switch (status) {
    case EventRunStatus.SCHEDULED:
      return 'bg-blue-100 text-blue-800';
    case EventRunStatus.LOW_SEATS:
      return 'bg-yellow-100 text-yellow-800';
    case EventRunStatus.SOLD_OUT:
      return 'bg-green-100 text-green-800';
    case EventRunStatus.COMPLETED:
      return 'bg-gray-100 text-gray-800';
    case EventRunStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const canEditEventRun = (eventRun: EventRunResponse | EventRunSummary): boolean => {
  // Can only edit scheduled events that haven't started yet
  const now = new Date();
  const startTime = new Date(eventRun.start_datetime);
  
  return eventRun.status === EventRunStatus.SCHEDULED && startTime > now;
};

export const canCancelEventRun = (eventRun: EventRunResponse | EventRunSummary): boolean => {
  // Can cancel scheduled or low_seats events
  return [EventRunStatus.SCHEDULED, EventRunStatus.LOW_SEATS].includes(eventRun.status);
};