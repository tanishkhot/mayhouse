# Mayhouse Technical Architecture

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: AWS S3
- **Payment**: Razorpay
- **Deployment**: TBD

### Core Dependencies
- FastAPI
- Supabase (database + auth)
- Razorpay Python SDK
- AWS Boto3 (S3)
- Pydantic (data validation)

## Database Schema

### Core Entities

#### Users
```sql
users (
  id: UUID (primary key)
  email: STRING (unique)
  full_name: STRING
  phone: STRING
  role: ENUM('user', 'host', 'admin') DEFAULT 'user'
  profile_image_url: STRING
  preferences: JSONB
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)
```

#### Host Applications
```sql
host_applications (
  id: UUID (primary key)
  user_id: UUID (foreign key to users)
  application_data: JSONB
  status: ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
  admin_notes: TEXT
  applied_at: TIMESTAMP
  reviewed_at: TIMESTAMP
  reviewed_by: UUID (foreign key to users)
)
```

#### Experiences (Templates)
```sql
experiences (
  id: UUID (primary key)
  host_id: UUID (foreign key to users)
  title: STRING
  promise: TEXT (2-line description)
  description: TEXT
  ungoogleable_detail: TEXT
  host_story: TEXT
  domain: STRING
  theme: STRING
  neighborhood: STRING
  meet_landmark: STRING
  meet_point_details: TEXT
  duration_minutes: INTEGER
  min_capacity: INTEGER DEFAULT 1
  max_capacity: INTEGER DEFAULT 4
  price_inr: DECIMAL(10,2)
  inclusions: JSONB
  what_to_bring: JSONB
  accessibility_tags: JSONB
  weather_plan: TEXT
  photo_consent_required: BOOLEAN DEFAULT true
  safety_boundaries: TEXT
  status: ENUM('draft', 'submitted', 'approved', 'rejected', 'archived') DEFAULT 'draft'
  admin_feedback: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  approved_at: TIMESTAMP
  approved_by: UUID (foreign key to users)
)
```

#### Event Runs (Scheduled Instances)
```sql
event_runs (
  id: UUID (primary key)
  experience_id: UUID (foreign key to experiences)
  start_datetime: TIMESTAMP
  end_datetime: TIMESTAMP
  seats_offered: INTEGER
  seats_held: INTEGER DEFAULT 0
  waitlist_count: INTEGER DEFAULT 0
  price_override: DECIMAL(10,2) (nullable)
  status: ENUM('scheduled', 'low_seats', 'sold_out', 'completed', 'cancelled') DEFAULT 'scheduled'
  meet_cue: TEXT
  pairing_enabled: BOOLEAN DEFAULT false
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)
```

#### Bookings
```sql
bookings (
  id: UUID (primary key)
  event_run_id: UUID (foreign key to event_runs)
  user_id: UUID (foreign key to users)
  booking_type: ENUM('single', 'plus_one') DEFAULT 'single'
  seats_booked: INTEGER
  total_amount_inr: DECIMAL(10,2)
  mayhouse_commission_inr: DECIMAL(10,2)
  host_payout_inr: DECIMAL(10,2)
  payment_status: ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending'
  payment_id: STRING (Razorpay payment ID)
  status: ENUM('confirmed', 'cancelled', 'no_show', 'attended') DEFAULT 'confirmed'
  guest_details: JSONB
  special_requests: TEXT
  check_in_notes: TEXT
  booked_at: TIMESTAMP
  cancelled_at: TIMESTAMP
)
```

#### Reviews
```sql
reviews (
  id: UUID (primary key)
  booking_id: UUID (foreign key to bookings)
  user_id: UUID (foreign key to users)
  experience_id: UUID (foreign key to experiences)
  magic_moment_score: INTEGER CHECK (magic_moment_score >= 1 AND magic_moment_score <= 5)
  would_recommend_score: INTEGER CHECK (would_recommend_score >= 1 AND would_recommend_score <= 10)
  memorable_moment: TEXT
  overall_feedback: TEXT
  photo_story_consent: BOOLEAN DEFAULT false
  created_at: TIMESTAMP
)
```

#### Payments
```sql
payments (
  id: UUID (primary key)
  booking_id: UUID (foreign key to bookings)
  razorpay_payment_id: STRING
  razorpay_order_id: STRING
  amount_inr: DECIMAL(10,2)
  status: ENUM('created', 'attempted', 'paid', 'failed', 'refunded')
  refund_amount_inr: DECIMAL(10,2) DEFAULT 0
  gateway_response: JSONB
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)
```

#### Host Payouts
```sql
host_payouts (
  id: UUID (primary key)
  host_id: UUID (foreign key to users)
  period_start: DATE
  period_end: DATE
  total_earnings_inr: DECIMAL(10,2)
  total_bookings: INTEGER
  payout_status: ENUM('pending', 'processing', 'paid') DEFAULT 'pending'
  payout_details: JSONB
  created_at: TIMESTAMP
  paid_at: TIMESTAMP
)
```

## API Structure

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile

### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `POST /users/host-application` - Apply to become host

### Experience Management (Host)
- `GET /experiences` - List host's experiences
- `POST /experiences` - Create new experience
- `PUT /experiences/{id}` - Update experience
- `POST /experiences/{id}/submit` - Submit for approval
- `GET /experiences/{id}/runs` - Get event runs
- `POST /experiences/{id}/runs` - Create event run

### Discovery (User)
- `GET /discover/experiences` - Browse experiences with filters
- `GET /discover/experiences/{id}` - Get experience details
- `GET /discover/experiences/{id}/runs` - Get available event runs

### Booking Flow
- `POST /bookings` - Create booking
- `GET /bookings/{id}` - Get booking details
- `POST /bookings/{id}/cancel` - Cancel booking
- `GET /bookings/user/{user_id}` - User's bookings

### Payment
- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/verify` - Verify payment
- `POST /payments/refund` - Process refund

### Admin
- `GET /admin/experiences/pending` - Pending approvals
- `POST /admin/experiences/{id}/approve` - Approve experience
- `POST /admin/experiences/{id}/reject` - Reject experience
- `GET /admin/host-applications` - Pending host applications

### Reviews
- `POST /reviews` - Submit review
- `GET /reviews/experience/{id}` - Get experience reviews

## Key Business Logic

### Commission Calculation
```python
total_amount = booking_amount
mayhouse_commission = total_amount * 0.30
host_payout = total_amount * 0.70
```

### Refund Logic
```python
hours_until_event = (event_start_time - current_time).hours

if hours_until_event >= 72:
    refund_percentage = 1.0  # 100% refund
elif hours_until_event > 0:
    refund_percentage = 0.5  # 50% refund
else:
    refund_percentage = 0.0  # No refund
```

### Capacity Management
```python
max_seats_per_booking = 2 if booking_type == 'plus_one' else 1
max_total_capacity = 4  # per event run
```

---
*Last Updated: October 1, 2025*