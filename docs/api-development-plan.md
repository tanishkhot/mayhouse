# Mayhouse Backend Development Plan

## Overview
This document outlines the comprehensive development plan for the Mayhouse backend system - a curated micro-experiences platform connecting travelers with local hosts for authentic experiences.

**Last Updated**: October 1, 2025  
**Current Status**: Database schema complete, API development phase initiated

---

## System Architecture Overview

### Core Components
- **Database**: PostgreSQL with comprehensive schema design
- **API**: FastAPI with Supabase authentication integration
- **Authentication**: Supabase Auth (JWT-based)
- **Payments**: Razorpay integration (mocked for MVP)
- **Security**: Row Level Security (RLS) policies + enhanced RBAC permissions

### Technology Stack
- **Backend Framework**: FastAPI (Python)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **ORM**: SQLAlchemy + Pydantic models
- **Payment Gateway**: Razorpay (future integration)

---

## Current System State

### ✅ Completed Components

#### 1. Database Schema Design
- **17 Core Tables**: Users, experiences, bookings, payments, reviews, etc.
- **Robust Data Types**: Proper ENUMs instead of free text fields
- **Multi-location Support**: City/country fields for scalability
- **Migration Tracking**: Automated migration logging system

#### 2. Security Infrastructure
- **Row Level Security (RLS)**: Business-rule-aware access control
- **Enhanced RBAC System**: Permission-based access via PostgreSQL functions
- **Policy Compliance Framework**: GDPR-ready with audit trails

#### 3. Performance Optimization
- **Composite Indexes**: Optimized for booking availability and search queries
- **Database Triggers**: Capacity limit enforcement
- **Query Optimization**: Strategic indexing for common access patterns

#### 4. Policy & Compliance
- **Policy Management Tables**: Versioned policy documents
- **User Acceptance Tracking**: Mandatory policy compliance workflows
- **Audit Trail System**: Complete activity logging infrastructure

### 🚧 In Progress
- FastAPI application structure setup
- Basic middleware and health endpoints configured
- Pydantic model foundation planned

---

## Development Roadmap

### Phase 1: Authentication Foundation (M1) 🎯 NEXT
**Objective**: Establish secure user authentication and role-based access

#### Key Deliverables:
- **Supabase JWT Integration**: Middleware for token validation
- **Authentication Routes**: Login, signup, logout endpoints
- **User Profile Management**: `/me` endpoint with role information
- **Role-based Middleware**: Access control for protected routes

#### Core Endpoints:
```
POST /auth/signup
POST /auth/login
POST /auth/logout
GET /auth/me
PUT /auth/me
```

#### Technical Requirements:
- JWT token validation middleware
- User model integration with Supabase
- Role extraction and validation
- Session management

---

### Phase 2: Role Change Flow (M2)
**Objective**: Enable users to transition from traveler to host

#### Key Deliverables:
- **Host Application System**: Multi-step application process
- **Document Upload**: Identity and business verification
- **Admin Review Workflow**: Application approval/rejection
- **Role Transition**: Secure role update process

#### Core Endpoints:
```
POST /host-application/submit
GET /host-application/status
PUT /host-application/update
GET /admin/applications (admin only)
PUT /admin/applications/{id}/review (admin only)
```

#### Business Logic:
- Multi-step application form
- Document verification workflow
- Admin notification system
- Automatic role upgrade on approval

---

### Phase 3: Experience Management (M3)
**Objective**: Enable hosts to create and manage experiences

#### Key Deliverables:
- **Experience CRUD Operations**: Create, read, update, delete experiences
- **Media Management**: Photo upload and management
- **Pricing Configuration**: Flexible pricing models
- **Admin Approval Workflow**: Experience moderation system

#### Core Endpoints:
```
POST /experiences (host only)
GET /experiences/my (host only)
PUT /experiences/{id} (host only)
DELETE /experiences/{id} (host only)
GET /admin/experiences/pending (admin only)
PUT /admin/experiences/{id}/approve (admin only)
```

#### Features:
- Rich experience descriptions
- Multi-media support
- Category and tag management
- Location-based organization

---

### Phase 4: Event Run Management (M4)
**Objective**: Enable hosts to schedule and manage experience instances

#### Key Deliverables:
- **Event Run CRUD**: Schedule management for experiences
- **Capacity Management**: Attendance limits and tracking
- **Calendar Integration**: Availability management
- **Real-time Updates**: Status and availability changes

#### Core Endpoints:
```
POST /experiences/{id}/runs (host only)
GET /experiences/{id}/runs (host only)
PUT /runs/{id} (host only)
DELETE /runs/{id} (host only)
GET /runs/{id}/bookings (host only)
```

#### Business Logic:
- Automatic capacity enforcement
- Booking conflict prevention
- Calendar synchronization
- Notification system

---

### Phase 5: Discovery & Browse (M5)
**Objective**: Enable travelers to discover and explore experiences

#### Key Deliverables:
- **Public Experience Catalog**: Browse available experiences
- **Advanced Search**: Filter by location, category, price, date
- **Experience Details**: Comprehensive information display
- **Review System Integration**: Rating and review display

#### Core Endpoints:
```
GET /experiences (public)
GET /experiences/search (public)
GET /experiences/{id} (public)
GET /experiences/{id}/runs (public)
GET /experiences/{id}/reviews (public)
```

#### Features:
- Location-based search
- Category filtering
- Price range filtering
- Date availability checking
- Review and rating display

---

### Phase 6: Explore Page (M6)
**Objective**: Curated discovery experience with personalization

#### Key Deliverables:
- **Curated Feed**: Personalized experience recommendations
- **Trending Experiences**: Popular and trending content
- **Location-based Suggestions**: Context-aware recommendations
- **Social Features**: Wishlist and sharing capabilities

#### Core Endpoints:
```
GET /explore/feed (authenticated)
GET /explore/trending (public)
GET /explore/nearby (location-based)
POST /experiences/{id}/wishlist (authenticated)
GET /wishlist (authenticated)
```

#### Advanced Features:
- Machine learning recommendations
- Social proof integration
- Seasonal content curation
- Personalized filtering

---

### Phase 7: Booking & Payments (M7)
**Objective**: Complete booking flow with payment processing

#### Key Deliverables:
- **Booking Management**: Complete booking lifecycle
- **Payment Integration**: Razorpay payment processing
- **Booking Confirmation**: Automated confirmation system
- **Cancellation Handling**: Refund and cancellation policies

#### Core Endpoints:
```
POST /bookings (authenticated)
GET /bookings/my (authenticated)
PUT /bookings/{id}/cancel (authenticated)
POST /payments/process (authenticated)
GET /payments/status/{id} (authenticated)
```

#### Payment Flow:
- Secure payment processing
- Booking confirmation
- Host notification
- Receipt generation

---

## Technical Implementation Details

### Authentication Strategy
- **JWT Tokens**: Supabase-generated tokens for stateless auth
- **Role-based Access**: Three-tier system (user, host, admin)
- **Permission System**: Granular permissions via PostgreSQL functions
- **Session Management**: Secure token refresh and validation

### Database Integration
- **SQLAlchemy**: ORM for database operations
- **Pydantic Models**: Type-safe API models
- **Migration Management**: Tracked database schema evolution
- **Connection Pooling**: Optimized database connections

### Security Considerations
- **Row Level Security**: Database-level access control
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests

### Performance Optimization
- **Caching Strategy**: Redis for session and data caching
- **Database Indexing**: Optimized query performance
- **Async Operations**: Non-blocking I/O operations
- **Connection Pooling**: Efficient database resource usage

---

## Development Guidelines

### Code Organization
```
app/
├── api/
│   ├── routes/
│   ├── dependencies/
│   └── middleware/
├── core/
│   ├── config.py
│   ├── database.py
│   └── security.py
├── models/
├── services/
└── utils/
```

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Migration and query testing
- **Security Tests**: Authentication and authorization validation

### Deployment Considerations
- **Environment Configuration**: Development, staging, production
- **Database Migrations**: Automated deployment process
- **Monitoring**: Application performance and error tracking
- **Logging**: Comprehensive application logging

---

## Success Metrics

### Technical Metrics
- **API Response Time**: < 200ms for 95% of requests
- **Database Query Performance**: < 100ms for complex queries
- **Uptime**: 99.9% availability target
- **Security**: Zero critical vulnerabilities

### Business Metrics
- **User Registration**: Successful authentication flow
- **Host Onboarding**: Smooth role transition process
- **Experience Creation**: Hosts successfully creating experiences
- **Booking Completion**: End-to-end booking success rate

---

## Risk Mitigation

### Technical Risks
- **Database Performance**: Comprehensive indexing and query optimization
- **Security Vulnerabilities**: Regular security audits and updates
- **Scalability**: Horizontal scaling preparation
- **Third-party Dependencies**: Fallback strategies for external services

### Business Risks
- **User Experience**: Intuitive API design and comprehensive testing
- **Data Privacy**: GDPR compliance and audit trail implementation
- **Payment Security**: PCI compliance and secure payment processing
- **Content Moderation**: Admin approval workflows and reporting systems

---

## Next Steps

### Immediate Actions (Week 1)
1. **Setup FastAPI Authentication**: Supabase JWT integration
2. **Create Core Pydantic Models**: User, Experience base models
3. **Implement Authentication Middleware**: Role-based access control
4. **Build Authentication Endpoints**: Login, signup, profile management

### Short-term Goals (Month 1)
1. Complete Authentication Foundation (M1)
2. Implement Host Application Flow (M2)
3. Begin Experience Management System (M3)
4. Establish testing framework

### Medium-term Objectives (Month 2-3)
1. Complete Experience and Event Run Management (M3-M4)
2. Implement Discovery and Browse Features (M5)
3. Build Explore Page Functionality (M6)
4. Begin Booking System Development (M7)

---

**Document Maintenance**: This document should be updated after each milestone completion to reflect current progress and any architectural changes.

**Review Schedule**: Weekly during active development, monthly during maintenance phases.