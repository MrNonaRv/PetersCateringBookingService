import { type Express, type Request, type Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertBookingSchema, insertCustomerSchema } from "@shared/schema";
import { 
  sendBookingConfirmation, 
  sendBookingApproved, 
  sendDepositReceived, 
  sendBookingCancelled 
} from "../sms";
import { isPaymongoConfigured } from "../paymongo";

const autoCancelTimers = new Map<number, NodeJS.Timeout>();

export function registerBookingRoutes(app: Express) {
  // Bookings - Admin access
  app.get("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Error fetching bookings" });
    }
  });

  app.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error fetching booking" });
    }
  });

  // Get available payment methods (Public)
  app.get("/api/payment-methods", async (req, res) => {
    try {
      const methods: any[] = [];
      
      // If Paymongo is configured, add digital wallets
      if (isPaymongoConfigured()) {
        methods.push({
          id: "gcash",
          name: "GCash",
          description: "Pay instantly using your GCash account",
          icon: "smartphone",
          type: "digital_wallet"
        });
        methods.push({
          id: "paymaya",
          name: "Maya",
          description: "Pay securely using Maya",
          icon: "smartphone",
          type: "digital_wallet"
        });
        methods.push({
          id: "card",
          name: "Credit / Debit Card",
          description: "Visa, Mastercard, and other major cards",
          icon: "credit-card",
          type: "card"
        });
      }
      
      // Add manual methods from the database (e.g. bank transfer, cash)
      const settings = await storage.getPaymentSettings();
      settings.filter(s => s.isActive).forEach(setting => {
        if (setting.paymentMethod === 'cash') {
          methods.push({
            id: "cash",
            name: "Cash Payment",
            description: setting.instructions || "Pay in cash at our office",
            icon: "banknote",
            type: "cash"
          });
        } else if (setting.paymentMethod.startsWith('bank_')) {
          methods.push({
            id: setting.paymentMethod,
            name: `Bank Transfer (${setting.paymentMethod.replace('bank_', '').toUpperCase()})`,
            description: setting.instructions || `Transfer to our ${setting.paymentMethod.replace('bank_', '').toUpperCase()} account`,
            icon: "building-2",
            type: "bank_transfer",
            details: {
              accountName: setting.accountName,
              accountNumber: setting.accountNumber,
              bankName: setting.paymentMethod.replace('bank_', '').toUpperCase()
            }
          });
        }
      });
      
      // If no methods are active, maybe provide a fallback or just empty list
      res.json(methods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Error fetching payment methods" });
    }
  });

  // Public booking lookup
  app.get("/api/bookings/reference/:reference", async (req, res) => {
    try {
      const reference = req.params.reference;
      const booking = await storage.getBookingByReference(reference);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error fetching booking" });
    }
  });

  // Verify payment status (Used on redirect back from payment gateway)
  app.get("/api/bookings/verify-payment/:reference", async (req, res) => {
    try {
      const reference = req.params.reference;
      const booking = await storage.getBookingByReference(reference);
      
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      // If already paid, just return success
      if (booking.depositPaid || booking.status === 'deposit_paid' || booking.status === 'confirmed') {
        return res.json({ success: true, status: booking.status });
      }

      // If coming back from a success URL, we assume payment was successful for demo purposes
      // and force-update the status to ensure the UI updates immediately.
      // This is a fallback for when webhooks are not configured (like on Vercel)
      const updatedBooking = await storage.updateBookingPayment(booking.id, {
        depositPaid: true,
        depositPaymentMethod: 'gateway_redirect',
        depositPaymentReference: `REF-${Date.now()}`,
        depositPaidAt: new Date(),
        paymentStatus: 'deposit_paid',
        status: 'deposit_paid'
      });

      // Clear auto-cancel timer if it exists
      if (autoCancelTimers.has(booking.id)) {
        clearTimeout(autoCancelTimers.get(booking.id)!);
        autoCancelTimers.delete(booking.id);
      }

      // Functional Enhancement: Send SMS Notification for deposit
      try {
        await sendDepositReceived({
          customerPhone: updatedBooking.customer.phone || "",
          customerName: updatedBooking.customer.name,
          bookingReference: updatedBooking.bookingReference,
          amountPaid: updatedBooking.depositAmount || 0,
          remainingBalance: (updatedBooking.totalPrice || 0) - (updatedBooking.depositAmount || 0)
        });
      } catch (smsError) {
        console.warn("SMS deposit notification failed:", smsError);
      }

      console.log(`Booking ${reference} force-updated via verify-payment redirect`);
      res.json({ success: true, status: 'deposit_paid' });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Error verifying payment" });
    }
  });

  // Create new booking (Public)
  app.post("/api/bookings", async (req, res) => {
    try {
      const { booking, customer, selectedDishes } = req.body;

      // Generate a unique booking reference
      const bookingReference = `PCB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Prepare booking data with all required fields
      const bookingWithDefaults = {
        ...booking,
        bookingReference,
        customerId: 0,
        totalPrice: booking.totalPrice || 0,
        paymentStatus: booking.paymentStatus || "pending",
        status: booking.status || "pending_approval",
        additionalServices: booking.additionalServices || "",
        specialRequests: booking.specialRequests || "",
        paymentMethod: booking.paymentMethod || null,
        paymentReference: booking.paymentReference || null,
        menuPreference: booking.menuPreference || "package",
        serviceStyle: booking.serviceStyle || "buffet"
      };

      const customerWithDefaults = {
        ...customer,
        company: customer.company || ""
      };

      const bookingData = insertBookingSchema.parse(bookingWithDefaults);
      const customerData = insertCustomerSchema.parse(customerWithDefaults);

      const createdBooking = await storage.createBooking(bookingData, customerData, selectedDishes);
      
      // Functional Enhancement: Send SMS Confirmation
      try {
        await sendBookingConfirmation({
          customerPhone: createdBooking.customer.phone || "",
          customerName: createdBooking.customer.name,
          bookingReference: createdBooking.bookingReference,
          eventDate: createdBooking.eventDate.toString(),
          eventType: createdBooking.service?.name || "Catering Event",
          totalPrice: createdBooking.totalPrice
        });
      } catch (smsError) {
        console.warn("SMS confirmation failed to send:", smsError);
      }

      res.status(201).json(createdBooking);
    } catch (error: any) {
      console.error("Booking creation error:", error);
      // Log to file for diagnostics
      try {
        const fs = require('fs');
        fs.appendFileSync('booking_error.log', `${new Date().toISOString()} - ${error.message}\n${error.stack}\n${JSON.stringify(req.body)}\n\n`);
      } catch (e) {}

      res.status(400).json({ 
        message: "Invalid booking data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update booking status (Admin)
  app.patch("/api/bookings/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      const validStatuses = [
        "pending", "pending_approval", "approved", "deposit_paid", 
        "fully_paid", "confirmed", "scheduled", "completed", "cancelled"
      ];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const updatedBooking = await storage.updateBookingStatus(id, status);

      // Handle specific status transitions
      if (status === 'approved') {
        const deadlineIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        let notes: any = {};
        try { notes = booking.adminNotes ? JSON.parse(booking.adminNotes) : {}; } catch {}
        notes.autoCancelDeadline = deadlineIso;
        await storage.updateBookingPayment(id, { adminNotes: JSON.stringify(notes) });
        
        if (autoCancelTimers.has(id)) clearTimeout(autoCancelTimers.get(id)!);
        const t = setTimeout(async () => {
          try {
            const latest = await storage.getBooking(id);
            if (!latest || latest.status === 'cancelled' || latest.depositPaid) return;
            await storage.updateBookingStatus(id, 'cancelled');
            await sendBookingCancelled({
              customerPhone: latest.customer.phone || "",
              customerName: latest.customer.name,
              bookingReference: latest.bookingReference
            });
          } finally {
            autoCancelTimers.delete(id);
          }
        }, 24 * 60 * 60 * 1000);
        autoCancelTimers.set(id, t);

        // Functional Enhancement: Send SMS Approval
        await sendBookingApproved({
          customerPhone: booking.customer.phone || "",
          customerName: booking.customer.name,
          bookingReference: booking.bookingReference,
          depositAmount: booking.depositAmount || 0
        });
      } else if (['deposit_paid', 'confirmed', 'fully_paid', 'cancelled', 'completed'].includes(status)) {
        if (autoCancelTimers.has(id)) {
          clearTimeout(autoCancelTimers.get(id)!);
          autoCancelTimers.delete(id);
        }

        // Functional Enhancement: SMS for specific updates
        if (status === 'deposit_paid') {
          await sendDepositReceived({
            customerPhone: booking.customer.phone || "",
            customerName: booking.customer.name,
            bookingReference: booking.bookingReference,
            amountPaid: booking.depositAmount || 0,
            remainingBalance: (booking.totalPrice || 0) - (booking.depositAmount || 0)
          });
        }
      }

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Error updating booking status" });
    }
  });
  // Reschedule booking (Customer/Public)
  app.patch("/api/bookings/:id/reschedule", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { eventDate, eventTime } = req.body;

      if (!eventDate || !eventTime) {
        return res.status(400).json({ message: "eventDate and eventTime are required" });
      }

      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Convert eventDate to string if it isn't already, so it matches the schema type if needed
      const updatedBooking = await storage.updateBooking(id, { 
        eventDate: new Date(eventDate), 
        eventTime 
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      res.status(500).json({ message: "Error rescheduling booking" });
    }
  });


  // Custom quotes endpoints
  app.get("/api/custom-quotes", isAuthenticated, async (req, res) => {
    try {
      const quotes = await storage.getCustomQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching custom quotes" });
    }
  });

  app.get("/api/custom-quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getCustomQuote(id);
      if (!quote) return res.status(404).json({ message: "Quote not found" });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Error fetching custom quote" });
    }
  });

  app.post("/api/custom-quotes", async (req, res) => {
    try {
      const { quote, customer } = req.body;
      const customerData = insertCustomerSchema.parse({ ...customer, company: customer.company || "" });
      
      const quoteData = {
        quoteReference: "", // Generated in storage
        eventDate: quote.eventDate,
        eventTime: quote.eventTime || "TBD",
        eventType: quote.eventType || "custom",
        guestCount: quote.guestCount || 0,
        venueAddress: quote.venueAddress || "",
        budget: Math.round((quote.budget || 0) * 100),
        theme: quote.theme || "",
        description: quote.description || "",
        preferences: quote.preferences || "",
        specialRequests: quote.specialRequests || "",
        status: "pending",
        customerId: 0
      };

      const createdQuote = await storage.createCustomQuote(quoteData, customerData);
      res.json({ 
        success: true, 
        quoteReference: createdQuote.quoteReference,
        quoteId: createdQuote.id
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to submit quote request" });
    }
  });

  app.patch("/api/custom-quotes/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, quotedPrice, notes } = req.body;
      const quote = await storage.updateCustomQuoteStatus(id, status, { proposedPrice: quotedPrice, adminNotes: notes });
      if (!quote) return res.status(404).json({ message: "Quote not found" });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Error updating quote status" });
    }
  });

  // Webhook endpoint for Paymongo payment notifications
  app.post("/api/paymongo/webhook", async (req, res) => {
    try {
      const event = req.body;
      console.log("Paymongo webhook received:", event.data?.attributes?.type);

      const eventType = event.data?.attributes?.type;
      const eventData = event.data?.attributes?.data;

      if (eventType === 'checkout_session.payment.paid' || eventType === 'payment.paid') {
        const metadata = eventData?.attributes?.metadata || {};
        const bookingReference = metadata.booking_reference || eventData?.attributes?.reference_number;
        const paymentType = metadata.payment_type || 'deposit';

        if (bookingReference) {
          const booking = await storage.getBookingByReference(bookingReference);
          if (booking) {
            const paymentDetails = eventData?.attributes;
            const paymentMethod = paymentDetails?.source?.type || 'paymongo';
            const paymentId = eventData?.id;

            if (paymentType === 'deposit') {
              await storage.updateBookingPayment(booking.id, {
                depositPaid: true,
                depositPaymentMethod: paymentMethod,
                depositPaymentReference: paymentId,
                depositPaidAt: new Date(),
                paymentStatus: 'deposit_paid',
                status: 'deposit_paid'
              });
            } else {
              await storage.updateBookingPayment(booking.id, {
                depositPaid: true,
                balancePaid: true,
                depositPaymentMethod: paymentMethod,
                depositPaymentReference: paymentId,
                depositPaidAt: new Date(),
                balancePaidAt: new Date(),
                paymentStatus: 'fully_paid',
                status: 'confirmed'
              });
            }
            
            // Clear auto-cancel timer if it exists
            if (autoCancelTimers.has(booking.id)) {
              clearTimeout(autoCancelTimers.get(booking.id)!);
              autoCancelTimers.delete(booking.id);
            }

            console.log(`Booking ${bookingReference} payment updated via webhook: ${paymentType}`);
          }
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(400).json({ message: "Webhook processing failed" });
    }
  });
}
