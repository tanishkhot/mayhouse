'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookingSummary, BookingsAPI } from '@/lib/bookings-api';
import { formatPrice } from '@/lib/experience-preview-normalizer';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface BookingDetailModalProps {
  booking: BookingSummary;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig = {
  confirmed: { label: 'Confirmed', variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' },
  upcoming: { label: 'Upcoming', variant: 'default' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Completed', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' },
  cancelled: { label: 'Cancelled', variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-200' },
  no_show: { label: 'No Show', variant: 'outline' as const, className: 'bg-orange-100 text-orange-800 border-orange-200' },
  experience_completed: { label: 'Completed', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export default function BookingDetailModal({ 
  booking, 
  isOpen, 
  onClose 
}: BookingDetailModalProps) {
  // Fetch full booking details if needed
  const { data: fullBooking, isLoading: isLoadingFull } = useQuery({
    queryKey: ['booking', booking.id],
    queryFn: () => BookingsAPI.getBooking(booking.id),
    enabled: isOpen,
  });
  
  const experience = booking.event_run?.experiences;
  const eventRun = booking.event_run;
  const startDate = eventRun?.start_datetime ? new Date(eventRun.start_datetime) : null;
  const endDate = eventRun?.end_datetime ? new Date(eventRun.end_datetime) : null;
  
  const status = booking.booking_status.toLowerCase();
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || 
    { label: status, variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {experience?.title || 'Booking Details'}
          </DialogTitle>
          <DialogDescription>
            View full details of your booking including event information and payment details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="default">Booking #{booking.id.substring(0, 8)}</Badge>
            <Badge 
              variant={statusInfo.variant}
              className={statusInfo.className}
            >
              {statusInfo.label}
            </Badge>
          </div>
          
          <Separator />
          
          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Event Details</h3>
            
            {startDate && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {startDate.toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {startDate.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {endDate && ` - ${endDate.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">{booking.seat_count} {booking.seat_count === 1 ? 'Person' : 'People'}</p>
              </div>
            </div>
            
            {experience?.experience_domain && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium capitalize">{experience.experience_domain}</p>
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Payment Details</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-semibold text-lg">
                {formatPrice(booking.total_amount_inr)}
              </span>
            </div>
            {fullBooking?.payment && (
              <div className="text-sm text-gray-600 mt-2">
                <p>Payment ID: {fullBooking.payment.payment_id}</p>
                <p>Transaction ID: {fullBooking.payment.transaction_id}</p>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Actions */}
          <div className="flex gap-3">
            {experience?.id && (
              <Link href={`/experiences/${experience.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Experience
                </Button>
              </Link>
            )}
            <Button variant="outline" className="flex-1" disabled>
              Contact Host
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

