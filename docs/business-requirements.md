# Mayhouse Business Requirements

## Overview
Mayhouse is a curated micro-experiences platform for authentic local adventures, starting with Mumbai as pilot city.

## Business Model

### Commission Structure
- **Mayhouse Commission**: 30% of total booking amount
- **Host Payout**: 70% of total booking amount
- **Payment Schedule**: Hosts receive monthly payouts with billing

### Pricing
- **Host Sets Price**: Hosts determine their own pricing
- **Admin Approval**: Mayhouse reviews and provides pricing guidance during experience approval
- **Approval Required**: Any pricing changes require admin review

### Cancellation Policy
- **72+ hours before event**: 100% full refund
- **Less than 72 hours**: 50% refund
- **No-show**: No refund

## User Management

### User Roles
- **User**: Can browse and book experiences
- **Host**: Can create and manage experiences (requires approval)
- **Admin**: Can approve experiences and manage platform

### Host Requirements
- **To Be Determined**: Eligibility criteria not yet finalized
- **Verification**: Verification process not yet defined
- **Role Change**: Users can request to become hosts (manual approval process)

## Experience Management

### Booking Types
- **Single**: Individual booking (1 person)
- **Plus One**: Booking for 2 people (1+1)
- **Group Limit**: Maximum 4 people per event
- **No Friends Groups**: No multi-friend group bookings initially

### Experience Lifecycle
1. **Host Creates Experience** → **Admin Reviews** → **Approved/Rejected**
2. **Approved Experience** → **Host Creates Event Runs** → **Users Book**
3. **Experience Changes** → **Requires Re-submission for Approval**

### Recurring Events
- **Recurring Support**: Hosts can create multiple event runs from one approved experience
- **Template System**: One experience template → Multiple scheduled event runs

## Geographic Scope

### Launch City
- **Primary Market**: Mumbai, India
- **Host Location**: Experiences must be located in Mumbai
- **Future Expansion**: TBD

### Location Services
- **Maps Integration**: Google Maps API (Google for Startups application planned)
- **Detail Level**: Neighborhood and landmark-based locations

## Technical Requirements

### Payment Gateway
- **Primary**: Razorpay (optimized for Indian market)
- **Currency**: INR
- **Features**: Commission splitting, refund handling

### File Storage
- **Provider**: AWS S3
- **Usage**: Experience photos, host documents, user uploads

### Key Features Not Yet Defined
- **Launch Domains**: 4 initial experience domains (TBD)
- **Host Eligibility**: Criteria for becoming a host
- **Verification Process**: Host verification requirements
- **Notification System**: Email/SMS preferences

## Success Metrics (from original document)
- **North Star**: Magical Wow = Seats filled × % guests who report "magic moment" (4-5 rating)
- **Demand**: Fill rate, show-up rate, time to sellout
- **Experience Quality**: Magic-moment score (1-5), recommendation score (1-10)
- **Growth**: 30-day repeat rate, referral share, social media sharing
- **Host Health**: Host satisfaction, retention, listing hit rate
- **Economics**: Contribution per seat, cancellation costs

## Phase 1 MVP Focus
1. User discovery and booking flow
2. Host experience creation and approval
3. Basic payment processing
4. Admin approval system
5. Simple review system

---
*Last Updated: October 1, 2025*