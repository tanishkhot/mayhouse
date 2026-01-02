# Traveler Bookings Page - Design Proposal

## Context

The booking flow is working. Users can book experiences from the experience run detail page (`/experiences/:experienceId/runs/:runId`). We need to build the traveler-facing experience for viewing and managing their bookings.

## Current State

✅ **Booking creation works** (backend API `/bookings` creates records in `event_run_bookings` table)  
✅ **Backend API endpoint exists**: `GET /bookings/my` returns user bookings  
✅ **Frontend has BookEventButton component** that handles booking creation  
✅ **Booking data includes**: booking ID, event run details, booking status, costs, dates

## What Needs to Be Built

### Core Features
- **My Bookings Page** - A dedicated page/route where users can view all their bookings
- **Booking Card/List View** - Display bookings with key information (experience name, date, status, etc.)
- **Booking Detail View** - Detailed view of a single booking (similar to experience detail but for the booking)
- **Booking Status Management** - Visual indicators and actions based on booking status (confirmed, cancelled, completed, etc.)

## Design Considerations

### Layout Inspiration
- **Airbnb "Trips" page** (upcoming/past bookings, clear status indicators)
- **Booking.com "My Bookings"** (timeline view, easy cancellation)
- **Eventbrite "Tickets"** (QR codes, event details, check-in status)

### Key Information to Display
- Experience title and host name
- Event date/time (formatted clearly)
- Meeting point/location
- Booking status (confirmed, upcoming, completed, cancelled)
- Number of seats booked
- Total amount paid
- Booking ID (for reference)
- Actions available (view details, cancel if allowed, contact host)

### User Flows to Consider
- View all bookings (upcoming first, then past)
- Filter by status (upcoming, past, cancelled)
- View booking details (full experience info, meeting instructions, host contact)
- Cancel booking (if within cancellation window)
- Check-in/attendance tracking (future feature)

## Technical Context

### Backend API
- **Endpoint**: `GET /bookings/my` returns list of bookings with event run and experience details
- **Response Structure**:
  ```typescript
  {
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
  ```

### Frontend Route
- Consider `/account/bookings` or `/my-bookings` (check if route exists)
- Currently: No dedicated bookings page exists

### Data Structure
- Bookings include `event_runs` with nested `experiences` data
- Booking Status Values: `confirmed`, `cancelled`, `no_show`, `experience_completed`

### Design System
- Use existing token-based styling (Card, Button, Badge components from shadcn)

## Design Decisions

### Page Structure: Single Page with Tabs
**Decision**: Single page with tabs (Upcoming/Past) for simplicity and consistency with common patterns.

**Rationale**: 
- Cleaner navigation than separate pages
- Matches user expectations from Airbnb, Booking.com patterns
- Easier to implement and maintain

### Card Design: Minimal Cards with Expandable Details
**Decision**: Minimal cards with expandable details (click to expand or "View Details" button)

**Rationale**:
- Better information hierarchy
- Less overwhelming on initial view
- Allows users to dive deeper when needed

### Status Indicators: Color-coded Badges + Icons
**Decision**: Color-coded badges with icons

**Status Mapping**:
- `confirmed` → Green badge with checkmark
- `upcoming` → Blue badge with calendar icon  
- `completed` → Gray badge with checkmark
- `cancelled` → Red badge with X icon
- `no_show` → Orange badge with warning icon

### Actions Available
- **View Details** (opens modal/sheet) - Always available
- **Cancel Booking** (if within cancellation window) - Only for upcoming confirmed bookings
- **Contact Host** (future: link to messaging) - For upcoming bookings
- **Download Receipt** (future) - For all bookings

### Empty States
- Friendly message when user has no bookings
- Link to explore experiences
- Different messages for "No upcoming bookings" vs "No past bookings"

### Mobile Experience
- Responsive card layout
- Bottom sheet for booking details on mobile (future enhancement)
- Touch-friendly action buttons

## Component Architecture

```
/my-bookings (page)
├── BookingsPage (main container)
│   ├── BookingsHeader (title, filter tabs)
│   ├── BookingsList (upcoming/past sections)
│   │   └── BookingCard (enhanced version)
│   │       ├── BookingCardHeader (title, status, date)
│   │       ├── BookingCardDetails (seats, price, location)
│   │       └── BookingCardActions (view details, cancel)
│   └── EmptyState (when no bookings)
└── BookingDetailModal (detailed view)
    ├── BookingDetailHeader
    ├── ExperienceInfo
    ├── EventRunDetails
    ├── BookingInfo
    └── Actions
```

## Implementation Details

### 1. Enhanced Booking Card Component

**File**: `frontend/src/components/bookings/BookingCard.tsx`

**Features**:
- Displays key booking information at a glance
- Status badge with color coding
- Date/time formatting
- Quick actions (View Details, Cancel)
- Opens detail modal on "View Details" click

**Key Props**:
```typescript
interface BookingCardProps {
  booking: BookingSummary;
}
```

**Status Configuration**:
```typescript
const statusConfig = {
  confirmed: { label: 'Confirmed', variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
  upcoming: { label: 'Upcoming', variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Completed', variant: 'secondary', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  cancelled: { label: 'Cancelled', variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
  no_show: { label: 'No Show', variant: 'outline', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  experience_completed: { label: 'Completed', variant: 'secondary', className: 'bg-gray-100 text-gray-800 border-gray-200' },
};
```

### 2. Bookings Page with Tabs

**File**: `frontend/src/app/my-bookings/page.tsx`

**Features**:
- Tab navigation (Upcoming/Past)
- Automatic categorization of bookings
- Loading states
- Error handling
- Empty states

**Tab Logic**:
- **Upcoming**: Bookings with `start_datetime > now` AND status != 'cancelled'
- **Past**: All other bookings (past dates OR cancelled)

### 3. Booking Detail Modal

**File**: `frontend/src/components/bookings/BookingDetailModal.tsx`

**Features**:
- Full booking information
- Event details (date, time, location)
- Payment information
- Actions (View Experience, Contact Host)
- Responsive design

**Data Fetching**:
- Uses `BookingsAPI.getBooking(bookingId)` for full details
- Falls back to summary data if full fetch fails

### 4. Required UI Components

**Check if these exist, create if missing**:
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from shadcn/ui
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from shadcn/ui
- `Separator` from shadcn/ui (likely exists)

## Code Implementation

### BookingCard Component

```typescript
// frontend/src/components/bookings/BookingCard.tsx
'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, IndianRupee, ChevronRight, Clock } from 'lucide-react';
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
  const isPast = startDate && startDate < new Date();
  
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
              <IndianRupee className="w-4 h-4" />
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
```

### Bookings Page

```typescript
// frontend/src/app/my-bookings/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { BookingsAPI, BookingSummary } from '@/lib/bookings-api';
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
            <p className="text-sm text-red-600">{error.message}</p>
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
```

### Booking Detail Modal

```typescript
// frontend/src/components/bookings/BookingDetailModal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookingSummary, BookingsAPI } from '@/lib/bookings-api';
import { formatPrice } from '@/lib/experience-preview-normalizer';
import { Calendar, Clock, MapPin, Users, IndianRupee } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface BookingDetailModalProps {
  booking: BookingSummary;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingDetailModal({ 
  booking, 
  isOpen, 
  onClose 
}: BookingDetailModalProps) {
  // Fetch full booking details if needed
  const { data: fullBooking } = useQuery({
    queryKey: ['booking', booking.id],
    queryFn: () => BookingsAPI.getBooking(booking.id),
    enabled: isOpen,
  });
  
  const experience = booking.event_run?.experiences;
  const eventRun = booking.event_run;
  const startDate = eventRun?.start_datetime ? new Date(eventRun.start_datetime) : null;
  const endDate = eventRun?.end_datetime ? new Date(eventRun.end_datetime) : null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {experience?.title || 'Booking Details'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="default">Booking #{booking.id.substring(0, 8)}</Badge>
            <Badge variant="default">{booking.booking_status}</Badge>
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
              <span className="font-semibold text-lg flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {formatPrice(booking.total_amount_inr)}
              </span>
            </div>
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
            <Button variant="outline" className="flex-1">
              Contact Host
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Implementation Checklist

### Phase 1: Core Structure
- [ ] Check if `Tabs` component exists in `frontend/src/components/ui/`
- [ ] Create `Tabs` component if missing (from shadcn/ui)
- [ ] Check if `Dialog` component exists
- [ ] Create `Dialog` component if missing (from shadcn/ui)
- [ ] Create `frontend/src/components/bookings/` directory
- [ ] Create `BookingCard.tsx` component
- [ ] Create `BookingDetailModal.tsx` component
- [ ] Create `frontend/src/app/my-bookings/page.tsx`

### Phase 2: Data Integration
- [ ] Verify `BookingSummary` interface matches backend response
- [ ] Update interface if needed based on actual API response
- [ ] Test API call with `BookingsAPI.getMyBookings()`
- [ ] Test individual booking fetch with `BookingsAPI.getBooking()`

### Phase 3: UI/UX Polish
- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty states
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Verify date/time formatting
- [ ] Verify price formatting

### Phase 4: Navigation & Integration
- [ ] Add navigation link to `/my-bookings` in main navigation
- [ ] Add link from user profile page
- [ ] Add link from booking confirmation (after booking creation)
- [ ] Test navigation flow

### Phase 5: Actions (Future)
- [ ] Implement cancel booking functionality
  - [ ] Create backend endpoint `DELETE /bookings/:id` (if needed)
  - [ ] Add cancel confirmation dialog
  - [ ] Handle cancellation success/error states
- [ ] Implement contact host functionality
- [ ] Add download receipt functionality
- [ ] Add check-in/attendance tracking (future feature)

## Questions to Resolve

1. **Route Path**: Should we use `/my-bookings` or `/account/bookings`?
2. **Cancellation Policy**: What is the cancellation window? (e.g., 24 hours before event)
3. **Host Contact**: How should users contact hosts? (In-app messaging, email, phone?)
4. **Receipts**: What format should receipts be in? (PDF download, email, in-app view?)
5. **Mobile Bottom Sheet**: Should we implement a bottom sheet for mobile instead of modal?

## Files to Review

- `frontend/src/components/UserBookings.tsx` - Existing component (may be deprecated)
- `frontend/src/lib/bookings-api.ts` - API client structure
- `frontend/src/lib/api.ts` - ProfileAPI.getBookings() implementation
- `backend/app/api/bookings.py` - Backend endpoint structure
- `backend/app/services/booking_service.py` - Service layer implementation
- `backend/app/schemas/booking.py` - Booking schemas

## Design Inspiration Sources

- **Airbnb Trips page** - Clean, status-focused design
- **Booking.com My Bookings** - Timeline view, clear actions
- **Eventbrite Tickets** - Event-focused, check-in ready
- **Uber Rides history** - Simple, chronological layout

## Notes

- The existing `UserBookings.tsx` component uses `ProfileAPI.getBookings()` which calls the same endpoint as `BookingsAPI.getMyBookings()`. We should consolidate to use `BookingsAPI` for consistency.
- Consider deprecating `UserBookings.tsx` once the new bookings page is complete.
- The backend returns `traveler_count` but the frontend expects `seat_count`. The service layer maps this correctly.
- Booking status values from backend: `confirmed`, `cancelled`, `no_show`, `experience_completed`

