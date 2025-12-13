import { api } from './api';

// Bookings API Types
export interface BookingCreateRequest {
  event_run_id: string;
  seat_count: number;
}

export interface PaymentResponse {
  payment_id: string;
  status: string;
  amount_inr: number;
  transaction_id: string;
  timestamp: string;
  payment_method: string;
}

export interface BookingResponse {
  id: string;
  event_run_id: string;
  user_id: string;
  seat_count: number;
  total_amount_inr: number;
  booking_status: string;
  payment: PaymentResponse;
  created_at: string;
}

export interface BookingSummary {
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

export interface BookingCostRequest {
  event_run_id: string;
  seat_count: number;
}

export interface BookingCostResponse {
  event_run_id: string;
  seat_count: number;
  price_per_seat_inr: number;
  total_price_inr: number;
  stake_inr: number;
  total_cost_inr: number;
}

// Bookings API Methods
export const BookingsAPI = {
  /**
   * Calculate booking cost
   */
  calculateCost: (request: BookingCostRequest) =>
    api.post<BookingCostResponse>('/bookings/calculate-cost', request).then((r) => r.data),

  /**
   * Create a new booking
   */
  createBooking: (request: BookingCreateRequest) =>
    api.post<BookingResponse>('/bookings', request).then((r) => r.data),

  /**
   * Get booking details by ID
   */
  getBooking: (bookingId: string) =>
    api.get<BookingResponse>(`/bookings/${bookingId}`).then((r) => r.data),

  /**
   * Get all bookings for the current user
   */
  getMyBookings: () =>
    api.get<BookingSummary[]>('/bookings/my').then((r) => r.data),
};

