# Peter's Creation Catering Services Booking System

A comprehensive web-based booking and management system designed for Peter's Creation Catering Services. This platform streamlines the process of event booking, package selection, and administrative management.

## 🌟 Key Features

### For Customers
- **Interactive Booking**: Seamlessly book catering services with a user-friendly interface.
- **Package Selection**: Browse through various catering packages (Standard, Premium, Deluxe, etc.) with detailed dish lists.
- **Customization**: Select specific dishes and add-ons for personalized events.
- **Real-time Availability**: Check date availability before booking through an integrated capacity calendar.
- **Payment Integration**: Securely pay deposits and balances via Paymongo or mock payment gateways.
- **Custom Quotes**: Request specialized quotes for unique events or large-scale gatherings.
- **Booking Tracking**: Track booking status using a unique reference code.

### For Administrators
- **Admin Dashboard**: Comprehensive overview of all bookings, revenue, and upcoming events.
- **Calendar Management**: View and manage confirmed events on a centralized calendar.
- **Package & Menu Management**: Easily update packages, dishes, and pricing.
- **Capacity Control**: Set daily booking limits and manage special dates.
- **Status Management**: Process bookings from "Pending" to "Confirmed" and "Completed".

## 🛠️ Tech Stack

### Frontend
- **React + Vite**: For a fast, modern single-page application experience.
- **Tailwind CSS**: Utility-first styling for a premium, responsive design.
- **Shadcn UI**: High-quality, accessible UI components.
- **TanStack Query**: Efficient data fetching and state management.
- **Wouter**: Lightweight routing.

### Backend
- **Node.js + Express**: Robust server-side logic and API handling.
- **PostgreSQL**: Reliable relational database for storing complex booking data.
- **Drizzle ORM**: Type-safe database interactions and migrations.
- **Passport.js**: Secure authentication for administrative access.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL Database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MrNonaRv/PetersCateringBookingService.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add the following:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_random_secret_string
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## 📦 Deployment (Vercel)

This project is optimized for deployment on Vercel:

1. Connect your repository to Vercel.
2. Set the **Output Directory** to `dist/public`.
3. Add the required environment variables in the Vercel Dashboard.
4. The system will automatically handle API routing and static file serving.

## 📝 License

This project is licensed under the MIT License.