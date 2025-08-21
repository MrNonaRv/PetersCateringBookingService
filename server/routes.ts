import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertServiceSchema, 
  insertAvailabilitySchema, 
  insertBookingSchema, 
  insertCustomerSchema,
  insertRecentEventSchema
} from "@shared/schema";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

const MemorySessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "peter-creation-catering-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemorySessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Set up authentication
  setupAuthentication(app);

  // API routes
  // Services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Error fetching service" });
    }
  });

  // Protected admin routes for services
  app.post("/api/services", isAuthenticated, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.put("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serviceData = req.body;
      const service = await storage.updateService(id, serviceData);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteService(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting service" });
    }
  });

  // Availability
  app.get("/api/availability", async (req, res) => {
    try {
      const availabilities = await storage.getAvailabilities();
      res.json(availabilities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching availability" });
    }
  });

  app.get("/api/availability/:date", async (req, res) => {
    try {
      const date = req.params.date;
      const availability = await storage.getAvailability(date);
      
      if (!availability) {
        return res.json({ date, isAvailable: true }); // Default to available
      }
      
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Error fetching availability" });
    }
  });

  app.post("/api/availability", isAuthenticated, async (req, res) => {
    try {
      const availabilityData = insertAvailabilitySchema.parse(req.body);
      const availability = await storage.setAvailability(availabilityData);
      res.status(201).json(availability);
    } catch (error) {
      res.status(400).json({ message: "Invalid availability data" });
    }
  });

  // Bookings
  app.get("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bookings" });
    }
  });

  app.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error fetching booking" });
    }
  });

  app.get("/api/bookings/reference/:reference", async (req, res) => {
    try {
      const reference = req.params.reference;
      const booking = await storage.getBookingByReference(reference);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error fetching booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const { booking, customer } = req.body;
      
      const bookingData = insertBookingSchema.parse(booking);
      const customerData = insertCustomerSchema.parse(customer);
      
      const createdBooking = await storage.createBooking(bookingData, customerData);
      res.status(201).json(createdBooking);
    } catch (error) {
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  app.patch("/api/bookings/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "confirmed", "cancelled", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const booking = await storage.updateBookingStatus(id, status);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error updating booking status" });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // Recent Events routes
  app.get("/api/recent-events", async (req, res) => {
    try {
      const events = await storage.getRecentEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent events" });
    }
  });

  app.get("/api/recent-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getRecentEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Error fetching event" });
    }
  });

  // Protected admin routes for recent events
  app.post("/api/recent-events", isAuthenticated, async (req, res) => {
    try {
      const eventData = insertRecentEventSchema.parse(req.body);
      const event = await storage.createRecentEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.put("/api/recent-events/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const eventData = insertRecentEventSchema.partial().parse(req.body);
      const event = await storage.updateRecentEvent(id, eventData);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.delete("/api/recent-events/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRecentEvent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting event" });
    }
  });

  // Payment methods endpoint
  app.get("/api/payment-methods", (req, res) => {
    const paymentMethods = [
      {
        id: "gcash",
        name: "GCash",
        description: "Pay using GCash mobile wallet",
        icon: "smartphone",
        type: "digital_wallet"
      },
      {
        id: "paymaya",
        name: "PayMaya",
        description: "Pay using PayMaya digital wallet",
        icon: "credit-card",
        type: "digital_wallet"
      },
      {
        id: "bank_transfer",
        name: "Bank Transfer",
        description: "Direct bank transfer to our account",
        icon: "building-2",
        type: "bank_transfer",
        details: {
          accountName: "Peter's Creation Catering Services",
          accountNumber: "1234567890",
          bankName: "BPI Bank",
          instructions: "Please include your booking reference in the transfer description"
        }
      },
      {
        id: "cash",
        name: "Cash Payment",
        description: "Pay in cash upon service delivery",
        icon: "banknote",
        type: "cash"
      }
    ];
    
    res.json(paymentMethods);
  });

  // Payment processing endpoint
  app.post("/api/process-payment", async (req, res) => {
    try {
      const { bookingId, paymentMethod, paymentReference } = req.body;
      
      if (!bookingId || !paymentMethod) {
        return res.status(400).json({ message: "Booking ID and payment method are required" });
      }
      
      // Simulate payment processing logic
      // In a real application, you would integrate with actual payment processors
      const paymentResult = {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        paymentMethod,
        paymentReference: paymentReference || `REF-${Date.now()}`,
        timestamp: new Date()
      };
      
      res.json(paymentResult);
    } catch (error) {
      res.status(500).json({ message: "Payment processing error" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

// Authentication setup
function setupAuthentication(app: Express) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      
      // Use bcrypt to compare passwords
      const { compare } = await import('bcrypt');
      const isMatch = await compare(password, user.password);
      
      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }
      
      // Don't send password to client
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      
      if (!user) {
        return done(null, false);
      }
      
      // Don't send password to client
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });
}

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
