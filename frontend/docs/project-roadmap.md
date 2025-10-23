# Mayhouse MVP Project Roadmap

## 📋 **Project Structure for Jira/Task Management**

### **Epic 1: Foundation & Infrastructure**
**Priority**: Highest | **Estimated Time**: 1-2 weeks

#### **Story 1.1: Database Setup**
- **Task 1.1.1**: Set up Supabase project and database
  - Create Supabase account and project
  - Configure environment variables
  - Test database connection
- **Task 1.1.2**: Create database tables using SQL migration
  - Users table with role enum
  - Host applications table
  - Experiences table with all canvas fields
  - Event runs table
  - Bookings table with payment fields
  - Reviews table
  - Payments table
  - Host payouts table
- **Task 1.1.3**: Set up database constraints and indexes
  - Foreign key constraints
  - Unique constraints
  - Performance indexes
- **Task 1.1.4**: Create Pydantic models for all entities
  - User models (User, UserCreate, UserUpdate)
  - Experience models (Experience, ExperienceCreate, etc.)
  - Booking models
  - Payment models
  - Review models

#### **Story 1.2: Authentication System**
- **Task 1.2.1**: Set up Supabase Auth integration
  - Configure Supabase auth settings
  - Add auth dependencies to project
- **Task 1.2.2**: Create authentication middleware
  - JWT token validation
  - Role-based access control
  - User session management
- **Task 1.2.3**: Build auth endpoints
  - POST /auth/register
  - POST /auth/login
  - GET /auth/me
  - POST /auth/logout
- **Task 1.2.4**: Test authentication flow
  - Unit tests for auth functions
  - Integration tests for endpoints
- **Task 1.2.5**: Set up OAuth providers
  - Configure Google OAuth 2.0
  - Configure Facebook OAuth 2.0
  - Configure Apple Sign-In (iOS)
  - Set up OAuth provider secrets and client IDs
- **Task 1.2.6**: Implement OAuth authentication flow
  - OAuth redirect endpoints
  - Token exchange and validation
  - User profile data extraction
  - Link OAuth accounts to existing users
- **Task 1.2.7**: Create OAuth endpoints
  - GET /auth/oauth/{provider}/authorize
  - GET /auth/oauth/{provider}/callback
  - POST /auth/oauth/{provider}/link
  - DELETE /auth/oauth/{provider}/unlink
- **Task 1.2.8**: Handle OAuth user registration
  - Auto-create user accounts from OAuth data
  - Merge OAuth profiles with existing accounts
  - Handle email conflicts and verification
  - Store OAuth provider tokens securely
- **Task 1.2.9**: Test OAuth integration
  - Unit tests for OAuth flows
  - Integration tests with OAuth providers
  - Test account linking/unlinking
  - Test error handling for OAuth failures

#### **Story 1.3: Core Infrastructure**
- **Task 1.3.1**: Set up error handling and logging
  - Custom exception classes
  - Logging configuration
  - Error response formatting
- **Task 1.3.2**: Add input validation and sanitization
  - Request/response schemas
  - Data validation rules
  - Security headers
- **Task 1.3.3**: Set up development tools
  - Database migrations system
  - Testing framework
  - Code formatting and linting

---

### **Epic 2: User Management & Profiles**
**Priority**: High | **Estimated Time**: 3-4 days

#### **Story 2.1: User Profile Management**
- **Task 2.1.1**: Create user profile endpoints
  - GET /users/profile
  - PUT /users/profile
  - User preferences handling
- **Task 2.1.2**: Build user profile validation
  - Phone number validation
  - Email verification
  - Profile completeness checks

#### **Story 2.2: Host Application System**
- **Task 2.2.1**: Create host application form endpoint
  - POST /users/host-application
  - Application data validation
  - File upload for documents
- **Task 2.2.2**: Build admin review interface
  - GET /admin/host-applications
  - POST /admin/host-applications/{id}/approve
  - POST /admin/host-applications/{id}/reject
- **Task 2.2.3**: Implement role change workflow
  - Status tracking
  - Email notifications
  - Role update mechanism

---

### **Epic 3: Experience Management**
**Priority**: High | **Estimated Time**: 1-1.5 weeks

#### **Story 3.1: Host Experience Creation**
- **Task 3.1.1**: Create experience CRUD endpoints
  - POST /experiences (create draft)
  - GET /experiences/{id}
  - PUT /experiences/{id}
  - DELETE /experiences/{id}
- **Task 3.1.2**: Implement Experience Canvas validation
  - All required fields validation
  - Business rule validation (capacity, pricing)
  - Content quality checks
- **Task 3.1.3**: Add photo upload functionality
  - AWS S3 integration
  - Image processing and optimization
  - Multiple photo support

#### **Story 3.2: Experience Approval Workflow**
- **Task 3.2.1**: Build submission system
  - POST /experiences/{id}/submit
  - Status change workflow
  - Validation before submission
- **Task 3.2.2**: Create admin approval interface
  - GET /admin/experiences/pending
  - POST /admin/experiences/{id}/approve
  - POST /admin/experiences/{id}/reject
  - Admin feedback system
- **Task 3.2.3**: Handle approval notifications
  - Email notifications to hosts
  - Status update tracking
  - Approval history

#### **Story 3.3: Event Run Management**
- **Task 3.3.1**: Create event run endpoints
  - POST /experiences/{id}/runs
  - GET /experiences/{id}/runs
  - PUT /event-runs/{id}
  - DELETE /event-runs/{id}
- **Task 3.3.2**: Implement scheduling logic
  - Date/time validation
  - Capacity management
  - Recurring event support
- **Task 3.3.3**: Add availability tracking
  - Seat counting
  - Booking status updates
  - Waitlist management

---

### **Epic 4: Discovery & Booking**
**Priority**: High | **Estimated Time**: 1-1.5 weeks

#### **Story 4.1: Experience Discovery**
- **Task 4.1.1**: Build discovery endpoints
  - GET /discover/experiences
  - Advanced filtering system
  - Search functionality
- **Task 4.1.2**: Implement search filters
  - Domain filtering
  - Neighborhood filtering
  - Date range filtering
  - Price range filtering
  - Booking type filtering
- **Task 4.1.3**: Add experience details endpoint
  - GET /discover/experiences/{id}
  - Related experiences
  - Host information
  - Reviews summary

#### **Story 4.2: Booking System**
- **Task 4.2.1**: Create booking endpoints
  - POST /bookings
  - GET /bookings/{id}
  - GET /bookings/user/{user_id}
- **Task 4.2.2**: Implement booking validation
  - Seat availability checking
  - Overbooking prevention
  - User eligibility validation
- **Task 4.2.3**: Build booking management
  - Booking confirmation
  - Cancellation handling
  - Status tracking

---

### **Epic 5: Payment Integration**
**Priority**: High | **Estimated Time**: 1 week

#### **Story 5.1: Razorpay Integration**
- **Task 5.1.1**: Set up Razorpay account and keys
  - Create Razorpay account
  - Get API keys
  - Configure webhook endpoints
- **Task 5.1.2**: Build payment endpoints
  - POST /payments/create-order
  - POST /payments/verify
  - GET /payments/{id}/status
- **Task 5.1.3**: Implement payment flow
  - Order creation
  - Payment verification
  - Webhook handling

#### **Story 5.2: Commission & Payout System**
- **Task 5.2.1**: Build commission calculation
  - 30/70 split logic
  - Commission tracking
  - Tax handling (if applicable)
- **Task 5.2.2**: Create payout system
  - Monthly payout calculation
  - Host payout tracking
  - Payout status management
- **Task 5.2.3**: Handle refunds
  - POST /payments/refund
  - Refund policy implementation
  - Partial refund handling

---

### **Epic 6: Reviews & Feedback**
**Priority**: Medium | **Estimated Time**: 3-4 days

#### **Story 6.1: Review System**
- **Task 6.1.1**: Create review endpoints
  - POST /reviews
  - GET /reviews/experience/{id}
  - GET /reviews/user/{id}
- **Task 6.1.2**: Implement review validation
  - Magic moment score validation
  - Review eligibility checking
  - Spam prevention
- **Task 6.1.3**: Build review aggregation
  - Average ratings calculation
  - Review statistics
  - Review display logic

---

### **Epic 7: Admin Dashboard**
**Priority**: Medium | **Estimated Time**: 3-5 days

#### **Story 7.1: Admin Interface**
- **Task 7.1.1**: Create admin overview dashboard
  - Key metrics display
  - Pending approvals count
  - Recent activity
- **Task 7.1.2**: Build approval queues
  - Experience approval queue
  - Host application queue
  - Bulk approval actions
- **Task 7.1.3**: Add admin reporting
  - Booking statistics
  - Revenue reports
  - User activity reports

---

## 🚀 **Recommended Development Workflow**

### **Phase 1: Foundation (Week 1-2)**
```
1. Set up Supabase → 2. Create database schema → 3. Build Pydantic models → 4. Implement authentication
```

### **Phase 2: Core Features (Week 3-4)**
```
1. User management → 2. Experience creation → 3. Admin approval → 4. Event run management
```

### **Phase 3: Booking & Payments (Week 5-6)**
```
1. Discovery API → 2. Booking system → 3. Razorpay integration → 4. Payment flow
```

### **Phase 4: Reviews & Polish (Week 7)**
```
1. Review system → 2. Admin dashboard → 3. Testing → 4. Bug fixes
```

## 📊 **Daily Development Workflow**

### **For Each Task:**
1. **Planning (15 min)**
   - Read task requirements
   - Plan implementation approach
   - Identify dependencies

2. **Development (2-4 hours)**
   - Write code
   - Test locally
   - Handle edge cases

3. **Testing (30 min)**
   - Unit tests
   - API testing
   - Manual testing

4. **Documentation (15 min)**
   - Update API docs
   - Add code comments
   - Update project status

### **End of Day (15 min)**
- Update task status in Jira
- Plan next day's tasks
- Commit and push code

## 📈 **Progress Tracking**

### **Jira Ticket Template:**
```
Epic: [Epic Name]
Story: [Story Name]
Task: [Task Description]

Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass
- [ ] Documentation updated

Estimated Time: [X hours]
Priority: [High/Medium/Low]
```

### **Weekly Review Questions:**
1. Which epics are completed?
2. What blockers were encountered?
3. Are we on track for MVP timeline?
4. What needs to be prioritized next week?

---

## 🎯 **Next Immediate Actions**

### **Today (Day 1):**
1. Set up Jira project with these epics/stories
2. Set up Supabase project
3. Start with "Epic 1, Story 1.1: Database Setup"

### **This Week:**
- Complete Epic 1 (Foundation)
- Start Epic 2 (User Management)

**Would you like me to create more detailed task breakdowns for any specific epic?**