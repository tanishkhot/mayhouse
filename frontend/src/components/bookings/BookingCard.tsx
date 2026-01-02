'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingSummary } from '@/lib/bookings-api';
import { formatPrice } from '@/lib/experience-preview-normalizer';
import BookingDetailModal from './BookingDetailModal';

interface BookingCardProps {
  booking: BookingSummary;
}

const statusConfig = {
  confirmed: { label: 'Confirmed', variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' },
  upcoming: { label: 'Upcoming', variant: 'default' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Completed', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' },
  cancelled: { label: 'Cancelled', variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-200' },
  no_show: { label: 'No Show', variant: 'outline' as const, className: 'bg-orange-100 text-orange-800 border-orange-200' },
  experience_completed: { label: 'Completed', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export default function BookingCard({ booking }: BookingCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const experience = booking.event_run?.experiences;
  const eventRun = booking.event_run;
  
  const startDate = eventRun?.start_datetime 
    ? new Date(eventRun.start_datetime) 
    : null;
  
  const isUpcoming = startDate && startDate > new Date();
  
  const status = booking.booking_status.toLowerCase();
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || 
    { label: status, variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {experience?.title || 'Experience'}
              </h3>
              <p className="text-sm text-gray-500">
                Booking #{booking.id.substring(0, 8)}
              </p>
            </div>
            <Badge 
              variant={statusInfo.variant}
              className={statusInfo.className}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Date & Time */}
          {startDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDate(startDate)}</span>
              <span className="text-gray-400">•</span>
              <Clock className="w-4 h-4" />
              <span>{formatTime(startDate)}</span>
            </div>
          )}
          
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span>{booking.seat_count} {booking.seat_count === 1 ? 'Person' : 'People'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-semibold">{formatPrice(booking.total_amount_inr)}</span>
            </div>
            {experience?.experience_domain && (
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <MapPin className="w-4 h-4" />
                <span className="capitalize">{experience.experience_domain}</span>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDetailOpen(true)}
              className="text-terracotta-600 hover:text-terracotta-700"
            >
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            
            {isUpcoming && status === 'confirmed' && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                // onClick={handleCancel} // TODO: Implement cancel
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <BookingDetailModal
        booking={booking}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
}

