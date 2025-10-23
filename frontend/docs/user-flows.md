# Mayhouse Platform User Flows

**Complete Guide: From Sign-up to Event Run Discovery**

This document outlines all possible user journeys in the Mayhouse platform, from initial registration to discovering and booking authentic local experiences in Mumbai.

---

## 🚀 **User Journey Overview**

The Mayhouse platform supports multiple user flows:
- **Travelers**: Discover and book unique local experiences
- **Hosts**: Create and manage authentic local experiences  
- **Admins**: Review and approve hosts and experiences

---

## **1. User Registration & Onboarding Flow**

### **A. Regular User Sign-up**
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "traveler@example.com",
  "password": "securepassword123",
  "full_name": "Alex Johnson",
  "phone": "+91-9876543210"  // optional
}
```

**Response:**
- Auto-generated username (e.g., "Odyssey247", "Journey892", "Mumbai543")
- JWT access token for authentication
- User profile with default role: 'user'

### **B. Authentication & Profile Management**
```http
# Login
POST /auth/login
{
  "email": "traveler@example.com",
  "password": "securepassword123"
}

# Get current user profile
GET /auth/me
Authorization: Bearer <jwt-token>

# Update profile
PUT /auth/me
Authorization: Bearer <jwt-token>
{
  "full_name": "Alex Johnson",
  "phone": "+91-9876543210",
  "username": "MumbaiExplorer"
}

# Logout
POST /auth/logout
Authorization: Bearer <jwt-token>
```

---

## **2. Host Onboarding Flow**

### **A. Host Application Process**

#### Step 1: Check Eligibility
```http
GET /users/host-application/eligibility
Authorization: Bearer <jwt-token>
```

Returns:
- Eligibility status
- Required legal documents
- Terms and conditions links

#### Step 2: Submit Host Application
```http
POST /users/host-application
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "experience_domains": ["food", "culture"],
  "local_expertise": "Born and raised in Mumbai, food blogger for 5 years",
  "sample_experience": {
    "title": "Hidden Street Food Gems of Bandra",
    "description": "Discover authentic street food spots locals love"
  },
  "availability": {
    "days": ["saturday", "sunday"],
    "time_slots": ["morning", "evening"]
  },
  "legal_consents": {
    "terms_accepted": true,
    "background_check_consent": true,
    "photo_usage_consent": true
  }
}
```

#### Step 3: Track Application Status
```http
GET /users/host-application
Authorization: Bearer <jwt-token>
```

### **B. Admin Review Process**
```http
# List applications for review (Admin only)
GET /admin/host-applications
Authorization: Bearer <admin-jwt-token>
?status=pending&limit=20

# Review specific application (Admin only)
POST /admin/host-applications/{application_id}/review
Authorization: Bearer <admin-jwt-token>
{
  "decision": "approved",
  "admin_notes": "Great local expertise and clear communication",
  "feedback": {
    "strengths": ["Local knowledge", "Communication skills"],
    "areas_for_improvement": []
  }
}
```

**Upon Approval:**
- User role automatically upgraded to 'host'
- User gains access to experience creation endpoints
- Email notification sent to new host

---

## **3. Experience Creation Flow (Hosts Only)**

### **A. Create New Experience**
```http
POST /experiences
Authorization: Bearer <host-jwt-token>
Content-Type: application/json

{
  "title": "Hidden Street Art Walking Tour",
  "promise": "Discover Mumbai's secret street art in hidden alleys with stories from local artists",
  "description": "Join me for a 3-hour journey through Bandra's vibrant street art scene...",
  "unique_element": "Meet actual street artists and hear their stories firsthand",
  "host_story": "As a local artist myself, I've been part of Mumbai's street art community for over 8 years",
  "experience_domain": "art",
  "experience_theme": "Street Art & Culture",
  "neighborhood": "Bandra",
  "meeting_landmark": "Bandra-Worli Sea Link Viewpoint",
  "meeting_point_details": "Meet at the main entrance, look for someone with a red Mayhouse cap",
  "duration_minutes": 180,
  "traveler_min_capacity": 1,
  "traveler_max_capacity": 4,
  "price_inr": 1500.00,
  "inclusions": ["Local guide", "Artist meetings", "Photo opportunities"],
  "traveler_should_bring": ["Comfortable walking shoes", "Camera", "Water bottle"],
  "accessibility_notes": ["Moderate walking required", "Some stairs"],
  "weather_contingency_plan": "Indoor art galleries and covered areas available",
  "experience_safety_guidelines": "Stay with group, follow traffic rules, respect private property"
}
```

**Response:**
- Experience created with status: 'draft'
- Experience ID for future reference
- Full experience details

### **B. Experience Management**
```http
# List my experiences
GET /experiences
Authorization: Bearer <host-jwt-token>
?status=draft  // optional filter

# Get specific experience details
GET /experiences/{experience_id}
Authorization: Bearer <host-jwt-token>

# Update experience (draft/rejected only)
PUT /experiences/{experience_id}
Authorization: Bearer <host-jwt-token>
{
  "price_inr": 1800.00,
  "duration_minutes": 210
}

# Submit for admin review
POST /experiences/{experience_id}/submit
Authorization: Bearer <host-jwt-token>
{
  "submission_notes": "Ready for review! Updated pricing based on market research."
}
```

### **C. Admin Experience Review**
```http
# List experiences for review (Admin only)
GET /admin/experiences
Authorization: Bearer <admin-jwt-token>
?status=submitted

# Review experience (Admin only)
POST /admin/experiences/{experience_id}/review
Authorization: Bearer <admin-jwt-token>
{
  "decision": "approved",
  "admin_feedback": "Excellent experience design with strong local connections",
  "feedback_details": {
    "content_quality": "excellent",
    "safety_considerations": "adequate",
    "local_authenticity": "outstanding"
  }
}
```

---

## **4. Event Run Management Flow (Hosts Only)**

### **A. Create Event Runs**
```http
POST /hosts/event-runs
Authorization: Bearer <host-jwt-token>
Content-Type: application/json

{
  "experience_id": "93e1ecf1-6104-47ec-9dd5-73732541c32e",
  "start_datetime": "2025-11-15T10:00:00+05:30",
  "end_datetime": "2025-11-15T13:00:00+05:30",
  "max_capacity": 4,
  "special_pricing_inr": null,  // uses experience base price
  "host_meeting_instructions": "I'll be wearing a red Mayhouse cap and carrying a professional camera bag. WhatsApp group link will be shared 30 minutes before start.",
  "group_pairing_enabled": true
}
```

**Business Rules:**
- Experience must be in 'approved' status
- Host must own the experience
- Start time must be in the future
- Max capacity: 1-4 travelers
- Status defaults to 'scheduled'

### **B. Event Run Operations**
```http
# List my event runs
GET /hosts/event-runs
Authorization: Bearer <host-jwt-token>
?status=scheduled&limit=50

# Get event run details
GET /hosts/event-runs/{event_run_id}
Authorization: Bearer <host-jwt-token>

# Update event run
PUT /hosts/event-runs/{event_run_id}
Authorization: Bearer <host-jwt-token>
{
  "start_datetime": "2025-11-15T11:00:00+05:30",
  "special_pricing_inr": 1200.00,
  "host_meeting_instructions": "Updated meeting point: near the main fountain"
}

# Delete event run (only if no bookings)
DELETE /hosts/event-runs/{event_run_id}
Authorization: Bearer <host-jwt-token>
```

---

## **5. Discovery & Exploration Flow (All Users)**

### **A. Explore Upcoming Events** ⭐ **PRIMARY DISCOVERY ENDPOINT**

```http
# Get all upcoming event runs
GET /explore/
```

**Query Parameters:**
- `domain`: Filter by experience type (food, art, culture, adventure, etc.)
- `neighborhood`: Filter by location (Bandra, Colaba, Andheri, etc.)
- `limit`: Number of results (1-100, default: 50)
- `offset`: Pagination offset (default: 0)

**Examples:**
```http
# All upcoming events
GET /explore/

# Food experiences only
GET /explore/?domain=food

# Events in Bandra
GET /explore/?neighborhood=Bandra

# Art experiences in Bandra, first 10 results
GET /explore/?domain=art&neighborhood=Bandra&limit=10

# Pagination - next 20 results
GET /explore/?offset=20&limit=20
```

**Response Format:**
```json
[
  {
    "id": "421e67a3-698f-44c4-9a43-0b3999e8fdb8",
    "start_datetime": "2025-11-01T11:30:00+00:00",
    "end_datetime": "2025-11-01T15:00:00+00:00",
    "max_capacity": 4,
    "available_spots": 4,
    "price_inr": 1800.0,
    "status": "scheduled",
    
    // Experience Details
    "experience_id": "145d4617-4e2a-402c-ba83-a1cc422fba47",
    "experience_title": "Mumbai Street Art & Artist Stories",
    "experience_promise": "Discover hidden street art masterpieces and meet the artists who create them",
    "experience_domain": "art",
    "experience_theme": "Street Art & Urban Culture",
    "neighborhood": "Bandra",
    "meeting_landmark": "Bandra-Worli Sea Link Viewpoint",
    "duration_minutes": 210,
    
    // Host Details
    "host_id": "13531169-af4f-4574-8474-b05e1db1f2b6",
    "host_name": "Priya Sharma",
    "host_meeting_instructions": "Meet at Bandra-Worli Sea Link viewpoint main entrance. I will be wearing a red Mayhouse cap.",
    "group_pairing_enabled": true
  }
]
```

**Key Features:**
- **Time Filtering**: Only returns events starting from current time onwards
- **Status Filtering**: Excludes cancelled events, only approved experiences
- **Rich Data**: Complete experience + host information + pricing + availability
- **Real-time Availability**: Shows current available spots
- **Sorting**: Events ordered by start time (soonest first)
- **Public Access**: No authentication required

### **B. Additional Discovery Endpoints**

```http
# Get experience categories
GET /explore/categories

# Get featured experiences
GET /explore/featured
?limit=5

# Get specific experience details (currently mock)
GET /explore/{experience_id}
```

---

## 🎯 **Complete User Flow Examples**

### **Scenario 1: Regular Traveler Journey**
```
1. POST /auth/signup
   └── Create account with email/password
   
2. GET /auth/me
   └── Verify profile created successfully
   
3. GET /explore/
   └── Browse all upcoming events (6 found)
   
4. GET /explore/?domain=food
   └── Filter for food experiences only
   
5. GET /explore/?neighborhood=Bandra&limit=3
   └── Find experiences in preferred location
   
6. [Future: Book selected experience]
```

### **Scenario 2: Aspiring Host Journey**
```
1. POST /auth/signup
   └── Create account as regular user
   
2. GET /users/host-application/eligibility
   └── Check requirements and legal documents
   
3. POST /users/host-application
   └── Submit detailed host application
   
4. GET /users/host-application
   └── Track application status (pending → approved)
   
5. [Admin reviews and approves]
   └── User role upgraded to 'host'
   
6. POST /experiences
   └── Create first experience (status: draft)
   
7. POST /experiences/{id}/submit
   └── Submit experience for admin approval
   
8. [Admin approves experience]
   └── Experience status: draft → submitted → approved
   
9. POST /hosts/event-runs
   └── Schedule first event run
   
10. GET /explore/
    └── See own event run live in discovery!
```

### **Scenario 3: Active Host Journey**
```
1. POST /auth/login
   └── Login with existing host credentials
   
2. GET /experiences
   └── View all my experiences and their status
   
3. GET /hosts/event-runs
   └── Check upcoming scheduled events
   
4. POST /hosts/event-runs
   └── Create new event run for busy weekend
   
5. GET /explore/?domain=art
   └── Research competition in my domain
   
6. PUT /hosts/event-runs/{id}
   └── Update meeting instructions for clarity
```

---

## 📊 **API Endpoint Reference**

| **Category** | **Endpoints** | **Authentication** | **Purpose** |
|--------------|---------------|-------------------|-------------|
| **Authentication** | `/auth/signup`, `/auth/login`, `/auth/me`, `/auth/logout` | None → JWT Required | User registration and authentication |
| **Host Applications** | `/users/host-application/*`, `/admin/host-applications/*` | JWT Required (Admin for reviews) | Host onboarding process |
| **Experience Management** | `/experiences/*`, `/admin/experiences/*` | Host/Admin Required | Experience creation and approval |
| **Event Run Management** | `/hosts/event-runs/*` | Host Required | Schedule and manage event instances |
| **Discovery** | `/explore/*` | **None Required** ✨ | Public event discovery and browsing |

---

## 🔑 **Key Business Rules**

### **User Management**
- Auto-generated usernames with travel themes
- Default role: 'user', upgraded to 'host' after approval
- JWT-based authentication with 24-hour expiry

### **Host Onboarding**
- Application required with local expertise demonstration
- Admin approval required for role upgrade
- Background check consent mandatory

### **Experience Creation**
- Host-only capability
- Starts in 'draft' status
- Admin approval required before event runs can be created
- Experience domains: food, art, culture, adventure, shopping

### **Event Run Management**
- Only from approved experiences
- Maximum capacity: 4 travelers (intimate experiences)
- Minimum lead time for scheduling
- Automatic status management

### **Discovery System**
- Public access (no authentication required)
- Real-time availability calculation
- Only shows upcoming events from approved experiences
- Flexible filtering and pagination
- Rich data for informed decision-making

---

## 🌟 **User Journey Flowchart**

```
┌─────────────────┐
│   User Signs    │
│      Up         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Profile Created │
│ (role: 'user')  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐      ┌──────────────────┐
│  Want to be     │ No   │   Browse Events  │
│     Host?       ├─────▶│   via /explore/  │
└─────────┬───────┘      └──────────────────┘
          │ Yes                     ▲
          ▼                         │
┌─────────────────┐                 │
│ Submit Host     │                 │
│  Application    │                 │
└─────────┬───────┘                 │
          │                         │
          ▼                         │
┌─────────────────┐                 │
│ Admin Reviews   │                 │
│  Application    │                 │
└─────────┬───────┘                 │
          │                         │
          ▼                         │
┌─────────────────┐                 │
│   Approved?     │ No              │
└─────────┬───────┘─────────────────┘
          │ Yes
          ▼
┌─────────────────┐
│ User becomes    │
│     Host        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Create          │
│  Experience     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Submit for      │
│   Approval      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Admin Reviews   │
│   Experience    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐                 │
│   Approved?     │ No              │
└─────────┬───────┘─────────────────┘
          │ Yes                     │
          ▼                         │
┌─────────────────┐                 │
│ Create Event    │                 │
│     Runs        │                 │
└─────────┬───────┘                 │
          │                         │
          ▼                         │
┌─────────────────┐                 │
│ Event Runs      │                 │
│ appear in       │─────────────────┘
│   /explore/     │
└─────────────────┘
```

---

## 🚀 **Quick Start Guide**

### **For Travelers:**
1. Sign up: `POST /auth/signup`
2. Explore events: `GET /explore/`
3. Filter by interest: `GET /explore/?domain=food`
4. [Future: Book experience]

### **For Hosts:**
1. Sign up: `POST /auth/signup`
2. Apply to be host: `POST /users/host-application`
3. Create experience: `POST /experiences`
4. Submit for approval: `POST /experiences/{id}/submit`
5. Schedule event runs: `POST /hosts/event-runs`
6. Monitor bookings: `GET /hosts/event-runs`

### **For Admins:**
1. Review host applications: `GET /admin/host-applications`
2. Approve/reject hosts: `POST /admin/host-applications/{id}/review`
3. Review experiences: `GET /admin/experiences`
4. Approve/reject experiences: `POST /admin/experiences/{id}/review`

---

## 📈 **Current Platform Status**

✅ **Implemented Flows:**
- User registration and authentication
- Host application and approval process
- Experience creation and management
- Event run scheduling and management
- **Event discovery via /explore/ endpoint**

🔄 **In Development:**
- Booking system
- Payment integration (Razorpay)
- Review and rating system
- Host payout management

🎯 **The /explore/ endpoint is the culmination of the entire platform** - it's where all approved experiences with scheduled event runs become discoverable by travelers, creating the marketplace where authentic local experiences meet curious travelers!

---

*Last updated: October 2, 2025*
*Mayhouse Backend v1.0.0*
