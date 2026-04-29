import express, { type Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { 
  insertRecentEventSchema, 
  insertPaymentSettingSchema,
  insertAvailabilitySchema,
  insertCapacityCalendarSchema
} from "@shared/schema";
import { 
  isPaymongoConfigured, 
  createCheckoutSession, 
  getCheckoutSession 
} from "../paymongo";
import { isSMSConfigured } from "../sms";

export function registerAdminRoutes(app: Express) {
  // Availability
  app.get("/api/availability", async (req, res) => {
    try {
      const availabilities = await storage.getAvailabilities();
      res.json(availabilities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching availability" });
    }
  });

  app.post("/api/availability", isAuthenticated, async (req, res) => {
    try {
      const data = insertAvailabilitySchema.parse(req.body);
      const availability = await storage.setAvailability(data);
      res.status(201).json(availability);
    } catch (error) {
      res.status(400).json({ message: "Invalid availability data" });
    }
  });

  // Capacity Calendar
  app.get("/api/capacity-calendar", async (req, res) => {
    try {
      const capacity = await storage.getCapacityCalendar();
      res.json(capacity);
    } catch (error) {
      res.status(500).json({ message: "Error fetching capacity calendar" });
    }
  });

  // Recent Events
  app.get("/api/recent-events", async (req, res) => {
    try {
      const events = await storage.getRecentEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent events" });
    }
  });

  app.post("/api/recent-events", isAuthenticated, async (req, res) => {
    try {
      const eventData = insertRecentEventSchema.parse(req.body);
      const event = await storage.createRecentEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  // Paymongo Integration
  app.get("/api/paymongo/status", (req, res) => {
    res.json({ 
      configured: isPaymongoConfigured(),
      publicKey: process.env.PAYMONGO_PUBLIC_KEY ? 'configured' : 'missing'
    });
  });

  app.post("/api/paymongo/create-checkout", async (req, res) => {
    try {
      const { bookingId, paymentType, successUrl, cancelUrl } = req.body;
      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const amount = paymentType === 'deposit' ? Math.round(booking.totalPrice * 0.5) : booking.totalPrice;
      const description = `${paymentType === 'deposit' ? 'Deposit' : 'Full'} Payment for Catering Service`;

      if (!isPaymongoConfigured()) {
        // Fallback to Mock Payment Gateway
        const mockCheckoutUrl = `/mock-payment?bookingId=${booking.id}&amount=${amount}&paymentType=${paymentType}&ref=${booking.bookingReference}&successUrl=${encodeURIComponent(successUrl || '')}&cancelUrl=${encodeURIComponent(cancelUrl || '')}`;
        return res.json({ success: true, checkoutUrl: mockCheckoutUrl });
      }

      const checkoutSession = await createCheckoutSession({
        amount: amount, // booking.totalPrice is already in centavos
        description,
        bookingReference: booking.bookingReference,
        customerEmail: booking.customer.email,
        customerName: booking.customer.name,
        customerPhone: booking.customer.phone || undefined,
        paymentType,
        successUrl: successUrl || `http://localhost:5000/payment-success?ref=${booking.bookingReference}`,
        cancelUrl: cancelUrl || `http://localhost:5000/payment-cancelled?ref=${booking.bookingReference}`
      });

      res.json({ success: true, checkoutUrl: checkoutSession.checkoutUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });

  app.post("/api/mock-payment/process", async (req, res) => {
    try {
      const { bookingId, paymentType } = req.body;
      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      if (paymentType === 'deposit') {
        await storage.updateBookingPayment(booking.id, {
          depositPaid: true,
          depositPaymentMethod: 'mock_gateway',
          depositPaymentReference: `MOCK-${Date.now()}`,
          depositPaidAt: new Date(),
          paymentStatus: 'deposit_paid',
          status: 'deposit_paid'
        });
      } else {
        await storage.updateBookingPayment(booking.id, {
          depositPaid: true,
          balancePaid: true,
          depositPaymentMethod: 'mock_gateway',
          depositPaymentReference: `MOCK-${Date.now()}`,
          depositPaidAt: booking.depositPaidAt || new Date(),
          balancePaidAt: new Date(),
          paymentStatus: 'fully_paid',
          status: 'confirmed'
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to process mock payment" });
    }
  });

  // SMS Status
  app.get("/api/sms/status", (req, res) => {
    res.json({ configured: isSMSConfigured() });
  });

  // Payment Settings
  app.get("/api/payment-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment settings" });
    }
  });

  app.post("/api/payment-settings", isAuthenticated, async (req, res) => {
    try {
      const settingData = insertPaymentSettingSchema.parse(req.body);
      const setting = await storage.upsertPaymentSetting(settingData);
      res.status(201).json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid payment setting data" });
    }
  });
}
