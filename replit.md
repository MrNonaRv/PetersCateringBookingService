# Peter's Creation Catering Services

## Overview

This is a full-stack web application for Peter's Creation Catering Services, a professional catering business that provides services for weddings, corporate events, and private parties. The application features a customer-facing website for browsing services and making bookings, along with an admin dashboard for managing bookings, services, and customer information.

The system allows customers to view available catering services, select event dates, submit booking requests, and choose from multiple Filipino payment methods including GCash, PayMaya, bank transfers, and cash payments. The website showcases recent events to build credibility and trust with potential customers.

Administrators can manage service offerings, track bookings, view customer information, manage recent events showcase, and monitor business operations through a comprehensive dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with **React 18** and **TypeScript**, utilizing a component-based architecture with two main sections:
- **Customer View**: Public-facing interface for service browsing and booking
- **Admin Dashboard**: Protected interface for business management

**UI Framework**: shadcn/ui components with Radix UI primitives for accessibility and consistency. The design uses a custom color scheme with primary blue (#1a5276) and secondary orange (#f39c12) colors, styled with Tailwind CSS.

**Routing**: Uses Wouter for client-side routing with protected routes for admin sections.

**State Management**: React Query (TanStack Query) for server state management and caching, with React Context for authentication state.

### Backend Architecture
**Server Framework**: Express.js with TypeScript for the REST API backend.

**Database Layer**: Uses Drizzle ORM with PostgreSQL (Neon serverless) for data persistence. The schema includes tables for users, services, customers, bookings, availability tracking, and recent events showcase. Payment tracking has been enhanced with payment method selection, payment status, and payment reference fields.

**Authentication**: Session-based authentication using Passport.js with local strategy and bcrypt for password hashing. Sessions are stored in memory with express-session.

**API Design**: RESTful endpoints following standard HTTP methods for CRUD operations on all major entities (bookings, services, customers, availability).

### Data Storage Solutions
**Primary Database**: PostgreSQL via Neon serverless connection with connection pooling for scalability.

**ORM**: Drizzle ORM provides type-safe database queries with automatic TypeScript type generation from the schema.

**Session Storage**: In-memory session store for development (MemoryStore), suitable for single-instance deployment.

### Authentication and Authorization
**Strategy**: Local authentication strategy with username/password credentials.

**Session Management**: Express sessions with secure cookie configuration and automatic expiration after 24 hours.

**Route Protection**: Frontend route guards prevent unauthorized access to admin sections, with automatic redirection to login page.

**Role-Based Access**: User roles (admin/staff) defined in the database schema, though currently all authenticated users have admin access.

## External Dependencies

### UI and Styling
- **shadcn/ui**: Comprehensive component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management with Zod validation

### Database and ORM
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **Drizzle ORM**: Type-safe ORM with automatic migrations
- **Drizzle Kit**: CLI tools for database schema management

### Authentication and Security
- **Passport.js**: Authentication middleware for Node.js
- **bcrypt**: Password hashing and verification
- **express-session**: Session management middleware

### Development Tools
- **Vite**: Build tool and development server with HMR
- **TypeScript**: Static type checking and improved developer experience
- **ESBuild**: Fast bundling for production builds

### Additional Libraries
- **React Query**: Server state management and caching
- **React Router (Wouter)**: Lightweight routing solution
- **date-fns**: Date manipulation utilities for booking functionality
- **React Helmet**: Dynamic head tag management for SEO

## Recent Changes (January 2026)

### Booking Flow Improvements
- **Two Booking Flows**: Standard Package (7 steps) and Custom Quote (5 steps)
- **Conditional Validation**: serviceId and packageId required only for standard bookings
- **Step-level Validation**: Service and package selection validated at step 5 before proceeding
- **Selected Dishes Persistence**: Customer dish selections now saved to `booking_dishes` table

### Status Workflow
Booking statuses: `pending_approval` → `approved` → `deposit_paid` → `fully_paid` → `confirmed` → `completed` (with `cancelled` option)

### Admin Calendar Accuracy
- **Automatic Capacity Tracking**: When a booking is created, the `capacity_calendar` table is updated with booked slot counts
- **Visual Indicators**: Admin calendar shows booking counts and capacity (e.g., "3/7" for 3 of 7 slots booked)
- **Color Coding**: Full capacity dates shown in red, partial bookings in blue

### Data Notes
- **Package Pricing**: The `pricePerPerson` field in `service_packages` table stores total package price (not per-person) for fixed-price packages like "Diamond Wedding ₱235,000"
- **Currency**: All prices displayed in Philippine Peso (₱) with centavos stored in database

### SMS Notifications (Twilio)
- **Integration**: Uses Twilio SDK for SMS notifications (not using Replit integration - credentials stored as secrets)
- **Required Secrets**: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- **Features**:
  - Send booking approval SMS with payment details (GCash, PayMaya, Bank Transfer links)
  - Send payment reminders to customers
  - Send custom messages from admin dashboard
- **Admin UI**: SMS button in BookingsTable allows admins to approve bookings and send payment links in one action
- **Phone Format**: Automatically formats Philippine mobile numbers (09XX → +639XX)

### Payment Settings
- **Admin Settings Page**: `/admin/settings` for configuring payment accounts
- **Saved Payment Accounts**: Stored in `payment_settings` table for GCash, PayMaya, BDO, BPI, and Cash
- **Integration with SMS**: When approving bookings, saved payment account details are auto-populated in the SMS message
- **Override Option**: Admin can override saved settings per booking if needed
- **Fields per Payment Method**: Account Name, Account Number/Mobile Number, Instructions, Active status