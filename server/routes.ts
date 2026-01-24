import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertServiceSchema,
  insertServicePackageSchema,
  insertAvailabilitySchema,
  insertBookingSchema,
  insertCustomerSchema,
  insertRecentEventSchema,
  insertGalleryImageSchema,
  insertDishSchema,
  insertVenueSchema,
  insertPaymentSettingSchema,
} from "../shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import {
  createCheckoutSession,
  getCheckoutSession,
  isPaymongoConfigured,
} from "./paymongo";
import {
  isSMSConfigured,
  sendBookingConfirmation,
  sendBookingApproved,
  sendDepositReceived,
  sendPaymentReminder,
  sendEventReminder,
  sendCustomMessage,
  sendBookingCancelled,
} from "./sms";

const MemorySessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  const autoCancelTimers = new Map<number, NodeJS.Timeout>();
  // Serve static files from uploads directory
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "public", "uploads")),
  );

  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "peter-creation-catering-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemorySessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

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

  // Dishes routes
  app.get("/api/dishes", async (req, res) => {
    try {
      const { category } = req.query;
      if (category && typeof category === "string") {
        const dishes = await storage.getDishesByCategory(category);
        res.json(dishes);
      } else {
        const dishes = await storage.getDishes();
        res.json(dishes);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching dishes" });
    }
  });

  app.post("/api/dishes", isAuthenticated, async (req, res) => {
    try {
      const dishData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(dishData);
      res.status(201).json(dish);
    } catch (error) {
      res.status(400).json({ message: "Invalid dish data" });
    }
  });

  app.patch("/api/dishes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dishData = insertDishSchema.partial().parse(req.body);
      const dish = await storage.updateDish(id, dishData);
      if (!dish) {
        return res.status(404).json({ message: "Dish not found" });
      }
      res.json(dish);
    } catch (error) {
      res.status(400).json({ message: "Invalid dish data" });
    }
  });

  app.delete("/api/dishes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDish(id);
      if (!deleted) {
        return res.status(404).json({ message: "Dish not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting dish" });
    }
  });

  // Service Packages routes
  app.get("/api/service-packages", async (req, res) => {
    try {
      const { serviceId } = req.query;
      if (serviceId && typeof serviceId === "string") {
        const packages = await storage.getServicePackagesByService(
          parseInt(serviceId),
        );
        res.json(packages);
      } else {
        const packages = await storage.getServicePackages();
        res.json(packages);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching service packages" });
    }
  });

  app.get("/api/service-packages/service/:serviceId", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const packages = await storage.getServicePackagesByService(serviceId);
      res.json(packages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching service packages" });
    }
  });

  app.get("/api/service-packages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const servicePackage = await storage.getServicePackage(id);

      if (!servicePackage) {
        return res.status(404).json({ message: "Service package not found" });
      }

      res.json(servicePackage);
    } catch (error) {
      res.status(500).json({ message: "Error fetching service package" });
    }
  });

  app.post("/api/service-packages", isAuthenticated, async (req, res) => {
    try {
      const packageData = insertServicePackageSchema.parse(req.body);
      const servicePackage = await storage.createServicePackage(packageData);
      res.status(201).json(servicePackage);
    } catch (error) {
      res.status(400).json({ message: "Invalid service package data" });
    }
  });

  app.put("/api/service-packages/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const packageData = insertServicePackageSchema.partial().parse(req.body);
      const servicePackage = await storage.updateServicePackage(
        id,
        packageData,
      );

      if (!servicePackage) {
        return res.status(404).json({ message: "Service package not found" });
      }

      res.json(servicePackage);
    } catch (error) {
      res.status(400).json({ message: "Invalid service package data" });
    }
  });

  app.delete("/api/service-packages/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteServicePackage(id);

      if (!deleted) {
        return res.status(404).json({ message: "Service package not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting service package" });
    }
  });

  // Venues routes
  app.get("/api/venues", async (req, res) => {
    try {
      const venues = await storage.getVenues();
      res.json(venues);
    } catch (error) {
      res.status(500).json({ message: "Error fetching venues" });
    }
  });

  app.get("/api/venues/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const venue = await storage.getVenue(id);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.json(venue);
    } catch (error) {
      res.status(500).json({ message: "Error fetching venue" });
    }
  });

  // Protected admin routes for venues
  app.post("/api/venues", isAuthenticated, async (req, res) => {
    try {
      const venueData = insertVenueSchema.parse(req.body);
      const venue = await storage.createVenue(venueData);
      res.status(201).json(venue);
    } catch (error) {
      res.status(400).json({ message: "Invalid venue data" });
    }
  });

  app.put("/api/venues/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const venueData = insertVenueSchema.partial().parse(req.body);
      const venue = await storage.updateVenue(id, venueData);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.json(venue);
    } catch (error) {
      res.status(400).json({ message: "Invalid venue data" });
    }
  });

  app.delete("/api/venues/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteVenue(id);
      if (!deleted) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting venue" });
    }
  });

  // Gallery images routes
  // Setup multer for file upload
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
          ),
        );
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });

  // Generic single image upload (returns public URL)
  app.post(
    "/api/upload-image",
    isAuthenticated,
    upload.single("image"),
    async (req, res) => {
      try {
        const file = req.file as Express.Multer.File | undefined;
        if (!file) {
          return res.status(400).json({ message: "No image uploaded" });
        }
        const publicUrl = `/uploads/${file.filename}`;
        res.status(201).json({ url: publicUrl, filename: file.filename });
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(400).json({ message: "Error uploading image" });
      }
    },
  );

  app.get("/api/gallery-images", async (req, res) => {
    try {
      const category = req.query.category as string;
      const images = category
        ? await storage.getGalleryImagesByCategory(category)
        : await storage.getGalleryImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Error fetching gallery images" });
    }
  });

  app.get("/api/gallery-images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const image = await storage.getGalleryImage(id);

      if (!image) {
        return res.status(404).json({ message: "Gallery image not found" });
      }

      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Error fetching gallery image" });
    }
  });

  app.post(
    "/api/gallery-images",
    isAuthenticated,
    upload.array("images", 10),
    async (req, res) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({ message: "No images uploaded" });
        }

        const { title, description, category } = req.body;

        const uploadedImages = [];

        for (const file of files) {
          const imageData = {
            title: title || file.originalname,
            description: description || "",
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            category: category || "general",
            isActive: true,
          };

          const image = await storage.createGalleryImage(imageData);
          uploadedImages.push(image);
        }

        res.status(201).json(uploadedImages);
      } catch (error) {
        console.error("Error uploading images:", error);
        res.status(400).json({ message: "Error uploading images" });
      }
    },
  );

  app.put("/api/gallery-images/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const imageData = insertGalleryImageSchema.partial().parse(req.body);
      const image = await storage.updateGalleryImage(id, imageData);

      if (!image) {
        return res.status(404).json({ message: "Gallery image not found" });
      }

      res.json(image);
    } catch (error) {
      res.status(400).json({ message: "Invalid gallery image data" });
    }
  });

  app.delete("/api/gallery-images/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Get image info first to delete file
      const image = await storage.getGalleryImage(id);
      if (image) {
        const filePath = path.join(uploadDir, image.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      const deleted = await storage.deleteGalleryImage(id);

      if (!deleted) {
        return res.status(404).json({ message: "Gallery image not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting gallery image" });
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

  // Capacity Calendar - shows booked slots per date (admin only)
  app.get("/api/capacity-calendar", isAuthenticated, async (req, res) => {
    try {
      const capacity = await storage.getCapacityCalendar();
      res.json(capacity);
    } catch (error) {
      res.status(500).json({ message: "Error fetching capacity calendar" });
    }
  });

  app.get("/api/capacity-calendar/:date", isAuthenticated, async (req, res) => {
    try {
      const date = req.params.date;
      const capacity = await storage.getCapacityByDate(date);

      if (!capacity) {
        return res.json({
          date,
          bookedSlots: 0,
          maxSlots: 7,
          dayType: "normal",
        });
      }

      res.json(capacity);
    } catch (error) {
      res.status(500).json({ message: "Error fetching capacity" });
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
      const { booking, customer, selectedDishes } = req.body;

      console.log("Received booking data:", booking);
      console.log("Received customer data:", customer);
      console.log("Received selected dishes:", selectedDishes);

      // Generate a unique booking reference
      const bookingReference = `PCB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Prepare booking data with all required fields
      const bookingWithDefaults = {
        ...booking,
        bookingReference,
        customerId: 0, // This will be overridden by storage layer
        totalPrice: booking.totalPrice || 0,
        paymentStatus: booking.paymentStatus || "pending",
        status: booking.status || "pending_approval",
        additionalServices: booking.additionalServices || "",
        specialRequests: booking.specialRequests || "",
        paymentMethod: booking.paymentMethod || null,
        paymentReference: booking.paymentReference || null,
        menuPreference: booking.menuPreference || "package",
        serviceStyle: booking.serviceStyle || "buffet",
      };

      console.log("Prepared booking data:", bookingWithDefaults);

      // Prepare customer data
      const customerWithDefaults = {
        ...customer,
        company: customer.company || "",
      };

      console.log("Prepared customer data:", customerWithDefaults);

      // Validate the data
      const bookingData = insertBookingSchema.parse(bookingWithDefaults);
      const customerData = insertCustomerSchema.parse(customerWithDefaults);

      const createdBooking = await storage.createBooking(
        bookingData,
        customerData,
        selectedDishes,
      );
      res.status(201).json(createdBooking);
    } catch (error) {
      console.error("Booking creation error:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({
        message: "Invalid booking data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Custom quotes endpoints
  app.get("/api/custom-quotes", isAuthenticated, async (req, res) => {
    try {
      const quotes = await storage.getCustomQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching custom quotes:", error);
      res.status(500).json({ message: "Error fetching custom quotes" });
    }
  });

  app.get("/api/custom-quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getCustomQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error fetching custom quote:", error);
      res.status(500).json({ message: "Error fetching custom quote" });
    }
  });

  // Custom quote request endpoint
  app.post("/api/custom-quotes", async (req, res) => {
    try {
      const { quote, customer } = req.body;

      // Prepare customer data
      const customerWithDefaults = {
        ...customer,
        company: customer.company || "",
      };

      const customerData = insertCustomerSchema.parse(customerWithDefaults);

      // Generate a unique quote reference
      const quoteReference = `PCQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Prepare quote data
      const quoteData = {
        quoteReference,
        eventDate: quote.eventDate,
        eventTime: quote.eventTime || "TBD",
        eventType: quote.eventType || "custom",
        guestCount: quote.guestCount || 0,
        venueAddress: quote.venueAddress || "",
        budget: quote.budget || 0,
        theme: quote.theme || "",
        description: quote.description || "",
        preferences: quote.preferences || "",
        specialRequests: quote.specialRequests || "",
        status: "pending",
        quotedPrice: null,
        notes: null,
        customerId: 0,
      };

      const createdQuote = await storage.createCustomQuote(
        quoteData,
        customerData,
      );

      res.json({
        success: true,
        quoteReference: createdQuote.quoteReference,
        quoteId: createdQuote.id,
      });
    } catch (error) {
      console.error("Custom quote creation error:", error);
      res.status(400).json({
        message: "Failed to submit quote request",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.patch(
    "/api/custom-quotes/:id/status",
    isAuthenticated,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { status, quotedPrice, notes } = req.body;

        const validStatuses = [
          "pending",
          "reviewing",
          "quoted",
          "accepted",
          "rejected",
          "expired",
        ];

        if (!status || !validStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const quote = await storage.updateCustomQuoteStatus(id, status, {
          proposedPrice: quotedPrice,
          adminNotes: notes,
        });

        if (!quote) {
          return res.status(404).json({ message: "Quote not found" });
        }

        res.json(quote);
      } catch (error) {
        console.error("Error updating custom quote:", error);
        res.status(500).json({ message: "Error updating quote status" });
      }
    },
  );

  app.patch("/api/bookings/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      const validStatuses = [
        "pending",
        "pending_approval",
        "approved",
        "deposit_paid",
        "fully_paid",
        "confirmed",
        "scheduled",
        "completed",
        "cancelled",
      ];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const booking = await storage.updateBookingStatus(id, status);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Schedule auto-cancel when approved; clear when paid/confirmed/cancelled
      if (booking) {
        if (status === "approved") {
          const deadlineIso = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ).toISOString();
          let notes: any = {};
          try {
            notes = booking.adminNotes ? JSON.parse(booking.adminNotes) : {};
          } catch {}
          notes.autoCancelDeadline = deadlineIso;
          await storage.updateBookingPayment(id, {
            adminNotes: JSON.stringify(notes),
          });
          if (autoCancelTimers.has(id)) clearTimeout(autoCancelTimers.get(id)!);
          const t = setTimeout(
            async () => {
              try {
                const latest = await storage.getBooking(id);
                if (!latest) return;
                if (latest.status === "cancelled") return;
                if (latest.depositPaid) return;
                await storage.updateBookingStatus(id, "cancelled");
                await sendBookingCancelled({
                  customerPhone: latest.customer.phone,
                  customerName: latest.customer.name,
                  bookingReference: latest.bookingReference,
                });
              } finally {
                autoCancelTimers.delete(id);
              }
            },
            24 * 60 * 60 * 1000,
          );
          autoCancelTimers.set(id, t);
        } else if (
          [
            "deposit_paid",
            "confirmed",
            "fully_paid",
            "cancelled",
            "completed",
          ].includes(status)
        ) {
          if (autoCancelTimers.has(id)) {
            clearTimeout(autoCancelTimers.get(id)!);
            autoCancelTimers.delete(id);
          }
        }
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

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const allUsers = await storage.getUsers();
      const user = allUsers.find((u: { email: string }) => u.email === email);

      if (user) {
        // In production, you would:
        // 1. Generate a password reset token
        // 2. Store the token with expiration in the database
        // 3. Send an email with a reset link containing the token
        // For now, we just log this for demonstration
        console.log(
          `Password reset requested for user: ${user.username} (${email})`,
        );

        // If Twilio SMS is configured, we could also send an SMS notification
        // For security, we always return the same response regardless of whether
        // the email exists to prevent email enumeration attacks
      }

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message:
          "If an account exists with this email, password reset instructions will be sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Error processing request" });
    }
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
        type: "digital_wallet",
      },
      {
        id: "paymaya",
        name: "PayMaya",
        description: "Pay using PayMaya digital wallet",
        icon: "credit-card",
        type: "digital_wallet",
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
          instructions:
            "Please include your booking reference in the transfer description",
        },
      },
      {
        id: "cash",
        name: "Cash Payment",
        description: "Pay in cash upon service delivery",
        icon: "banknote",
        type: "cash",
      },
    ];

    res.json(paymentMethods);
  });

  // Payment processing endpoint (legacy - kept for backward compatibility)
  app.post("/api/process-payment", async (req, res) => {
    try {
      const { bookingId, paymentMethod, paymentReference } = req.body;

      if (!bookingId || !paymentMethod) {
        return res
          .status(400)
          .json({ message: "Booking ID and payment method are required" });
      }

      // Simulate payment processing logic
      // In a real application, you would integrate with actual payment processors
      const paymentResult = {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        paymentMethod,
        paymentReference: paymentReference || `REF-${Date.now()}`,
        timestamp: new Date(),
      };

      res.json(paymentResult);
    } catch (error) {
      res.status(500).json({ message: "Payment processing error" });
    }
  });

  // Paymongo Payment Integration Routes

  // Check if Paymongo is configured
  app.get("/api/paymongo/status", (req, res) => {
    res.json({
      configured: isPaymongoConfigured(),
      publicKey: process.env.PAYMONGO_PUBLIC_KEY ? "configured" : "missing",
    });
  });

  // Create Paymongo checkout session for booking payment
  app.post("/api/paymongo/create-checkout", async (req, res) => {
    try {
      if (!isPaymongoConfigured()) {
        return res.status(503).json({
          message:
            "Online payment is not available. Please contact us for alternative payment options.",
          code: "PAYMONGO_NOT_CONFIGURED",
        });
      }

      const {
        bookingId,
        paymentType, // 'deposit', 'balance', or 'full'
        successUrl,
        cancelUrl,
      } = req.body;

      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      // Get booking details
      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get customer details
      const customer = await storage.getCustomer(booking.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Calculate amount based on payment type
      let amount: number;
      let description: string;

      if (paymentType === "deposit") {
        // Deposit is typically 50% of total
        amount = Math.round(booking.totalPrice * 0.5);
        description = `Deposit Payment for Catering Service`;
      } else if (paymentType === "balance") {
        // Balance is the remaining amount
        amount = booking.balanceAmount || Math.round(booking.totalPrice * 0.5);
        description = `Balance Payment for Catering Service`;
      } else {
        // Full payment
        amount = booking.totalPrice;
        description = `Full Payment for Catering Service`;
      }

      // Build success and cancel URLs
      const baseUrl =
        process.env.REPLIT_DEPLOYMENT_URL || process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : "http://localhost:5000";

      const finalSuccessUrl =
        successUrl ||
        `${baseUrl}/payment-success?booking=${booking.bookingReference}&type=${paymentType}`;
      const finalCancelUrl =
        cancelUrl ||
        `${baseUrl}/payment-cancelled?booking=${booking.bookingReference}`;

      // Create checkout session
      const checkoutSession = await createCheckoutSession({
        amount,
        description,
        bookingReference: booking.bookingReference,
        customerEmail: customer.email,
        customerName: customer.name,
        customerPhone: customer.phone,
        paymentType,
        successUrl: finalSuccessUrl,
        cancelUrl: finalCancelUrl,
      });

      res.json({
        success: true,
        checkoutUrl: checkoutSession.checkoutUrl,
        checkoutId: checkoutSession.id,
        amount,
        paymentType,
      });
    } catch (error: any) {
      console.error("Paymongo checkout error:", error);
      res.status(500).json({
        message: error.message || "Failed to create checkout session",
      });
    }
  });

  // Verify payment status
  app.get("/api/paymongo/verify/:checkoutId", async (req, res) => {
    try {
      if (!isPaymongoConfigured()) {
        return res.status(503).json({
          message: "Payment verification is not available.",
          code: "PAYMONGO_NOT_CONFIGURED",
        });
      }

      const { checkoutId } = req.params;

      const session = await getCheckoutSession(checkoutId);

      // Check if payment was successful
      const isPaid = session.payments.some((p) => p.status === "paid");

      res.json({
        checkoutId: session.id,
        status: session.status,
        isPaid,
        payments: session.payments,
      });
    } catch (error: any) {
      console.error("Paymongo verify error:", error);
      res.status(500).json({
        message: "Failed to verify payment status",
      });
    }
  });

  // Webhook endpoint for Paymongo payment notifications
  app.post(
    "/api/paymongo/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      try {
        const payload = req.body.toString();
        const event = JSON.parse(payload);

        console.log("Paymongo webhook received:", event.data?.attributes?.type);

        const eventType = event.data?.attributes?.type;
        const eventData = event.data?.attributes?.data;

        if (
          eventType === "checkout_session.payment.paid" ||
          eventType === "payment.paid"
        ) {
          // Extract booking reference from metadata or reference number
          const metadata = eventData?.attributes?.metadata || {};
          const bookingReference =
            metadata.booking_reference ||
            eventData?.attributes?.reference_number;
          const paymentType = metadata.payment_type || "deposit";

          if (bookingReference) {
            const booking =
              await storage.getBookingByReference(bookingReference);

            if (booking) {
              // Update booking payment status
              const paymentDetails = eventData?.attributes;
              const paymentMethod = paymentDetails?.source?.type || "paymongo";
              const paymentId = eventData?.id;

              if (paymentType === "deposit") {
                await storage.updateBookingPayment(booking.id, {
                  depositPaid: true,
                  depositPaymentMethod: paymentMethod,
                  depositPaymentReference: paymentId,
                  depositPaidAt: new Date(),
                  paymentStatus: "deposit_paid",
                  status: "deposit_paid",
                });
                if (autoCancelTimers.has(booking.id)) {
                  clearTimeout(autoCancelTimers.get(booking.id)!);
                  autoCancelTimers.delete(booking.id);
                }
              } else if (paymentType === "balance") {
                await storage.updateBookingPayment(booking.id, {
                  balancePaid: true,
                  balancePaymentMethod: paymentMethod,
                  balancePaymentReference: paymentId,
                  balancePaidAt: new Date(),
                  paymentStatus: "fully_paid",
                  status: "confirmed",
                });
                if (autoCancelTimers.has(booking.id)) {
                  clearTimeout(autoCancelTimers.get(booking.id)!);
                  autoCancelTimers.delete(booking.id);
                }
              } else {
                // Full payment
                await storage.updateBookingPayment(booking.id, {
                  depositPaid: true,
                  balancePaid: true,
                  depositPaymentMethod: paymentMethod,
                  depositPaymentReference: paymentId,
                  depositPaidAt: new Date(),
                  balancePaidAt: new Date(),
                  paymentStatus: "fully_paid",
                  status: "confirmed",
                });
                if (autoCancelTimers.has(booking.id)) {
                  clearTimeout(autoCancelTimers.get(booking.id)!);
                  autoCancelTimers.delete(booking.id);
                }
              }

              console.log(
                `Booking ${bookingReference} payment updated: ${paymentType}`,
              );
            }
          }
        }

        res.json({ received: true });
      } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(400).json({ message: "Webhook processing failed" });
      }
    },
  );

  // Update booking payment status manually (for admin)
  app.patch("/api/bookings/:id/payment", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const paymentData = req.body;

      const booking = await storage.updateBookingPayment(id, paymentData);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Update payment error:", error);
      res.status(500).json({ message: "Error updating payment status" });
    }
  });

  // Payment Settings Routes (all routes require authentication for security)
  app.get("/api/payment-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      res.status(500).json({ message: "Error fetching payment settings" });
    }
  });

  app.get(
    "/api/payment-settings/:method",
    isAuthenticated,
    async (req, res) => {
      try {
        const setting = await storage.getPaymentSetting(req.params.method);
        if (!setting) {
          return res.status(404).json({ message: "Payment setting not found" });
        }
        res.json(setting);
      } catch (error) {
        console.error("Error fetching payment setting:", error);
        res.status(500).json({ message: "Error fetching payment setting" });
      }
    },
  );

  app.post("/api/payment-settings", isAuthenticated, async (req, res) => {
    try {
      const settingData = insertPaymentSettingSchema.parse(req.body);
      const setting = await storage.upsertPaymentSetting(settingData);
      res.status(201).json(setting);
    } catch (error: any) {
      console.error("Error creating payment setting:", error);
      res
        .status(400)
        .json({ message: error.message || "Invalid payment setting data" });
    }
  });

  app.put(
    "/api/payment-settings/:method",
    isAuthenticated,
    async (req, res) => {
      try {
        const settingData = { ...req.body, paymentMethod: req.params.method };
        const setting = await storage.upsertPaymentSetting(settingData);
        res.json(setting);
      } catch (error: any) {
        console.error("Error updating payment setting:", error);
        res
          .status(400)
          .json({ message: error.message || "Invalid payment setting data" });
      }
    },
  );

  app.delete("/api/payment-settings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePaymentSetting(id);
      if (!deleted) {
        return res.status(404).json({ message: "Payment setting not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting payment setting:", error);
      res.status(500).json({ message: "Error deleting payment setting" });
    }
  });

  // SMS Integration Routes (iProgSMS)

  // Check if SMS is configured
  app.get("/api/sms/status", (req, res) => {
    res.json({
      configured: isSMSConfigured(),
    });
  });

  // Send booking confirmation SMS (automatically called when booking is created)
  app.post(
    "/api/sms/booking-confirmation",
    isAuthenticated,
    async (req, res) => {
      try {
        const { bookingId } = req.body;

        if (!bookingId) {
          return res.status(400).json({ message: "Booking ID is required" });
        }

        const booking = await storage.getBooking(parseInt(bookingId));
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }

        const result = await sendBookingConfirmation({
          customerPhone: booking.customer.phone,
          customerName: booking.customer.name,
          bookingReference: booking.bookingReference,
          eventDate: booking.eventDate,
          eventType: booking.eventType,
          totalPrice: booking.totalPrice,
        });

        res.json(result);
      } catch (error: any) {
        console.error("SMS booking confirmation error:", error);
        res
          .status(500)
          .json({ message: error.message || "Failed to send SMS" });
      }
    },
  );

  // Send booking approved SMS with payment link
  app.post("/api/sms/booking-approved", isAuthenticated, async (req, res) => {
    try {
      const { bookingId, paymentLink } = req.body;

      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const depositAmount = Math.round(booking.totalPrice * 0.5);

      const result = await sendBookingApproved({
        customerPhone: booking.customer.phone,
        customerName: booking.customer.name,
        bookingReference: booking.bookingReference,
        depositAmount,
        paymentLink,
      });

      res.json(result);
    } catch (error: any) {
      console.error("SMS booking approved error:", error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });

  // Send deposit received confirmation SMS
  app.post("/api/sms/deposit-received", isAuthenticated, async (req, res) => {
    try {
      const { bookingId, amountPaid } = req.body;

      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const remainingBalance =
        booking.balanceAmount || Math.round(booking.totalPrice * 0.5);

      const result = await sendDepositReceived({
        customerPhone: booking.customer.phone,
        customerName: booking.customer.name,
        bookingReference: booking.bookingReference,
        amountPaid: amountPaid || Math.round(booking.totalPrice * 0.5),
        remainingBalance,
      });

      res.json(result);
    } catch (error: any) {
      console.error("SMS deposit received error:", error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });

  // Send payment reminder SMS
  app.post("/api/sms/payment-reminder", isAuthenticated, async (req, res) => {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const parseLocalYMD = (dateString: string) => {
        const [y, m, d] = dateString.split("-").map((v) => parseInt(v, 10));
        return new Date(y, (m || 1) - 1, d || 1);
      };
      const eventDate = parseLocalYMD(booking.eventDate);
      const today = new Date();
      const daysUntilEvent = Math.ceil(
        (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      const result = await sendPaymentReminder({
        customerPhone: booking.customer.phone,
        customerName: booking.customer.name,
        bookingReference: booking.bookingReference,
        balanceAmount:
          booking.balanceAmount || Math.round(booking.totalPrice * 0.5),
        eventDate: booking.eventDate,
        daysUntilEvent,
      });

      res.json(result);
    } catch (error: any) {
      console.error("SMS payment reminder error:", error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });

  // Send event reminder SMS (day before event)
  app.post("/api/sms/event-reminder", isAuthenticated, async (req, res) => {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const result = await sendEventReminder({
        customerPhone: booking.customer.phone,
        customerName: booking.customer.name,
        bookingReference: booking.bookingReference,
        eventDate: booking.eventDate,
        eventTime: booking.eventTime,
        venueAddress: booking.venueAddress,
      });

      res.json(result);
    } catch (error: any) {
      console.error("SMS event reminder error:", error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });

  // Send custom SMS message to customer
  app.post("/api/sms/custom", isAuthenticated, async (req, res) => {
    try {
      const { bookingId, message } = req.body;

      if (!bookingId || !message) {
        return res
          .status(400)
          .json({ message: "Booking ID and message are required" });
      }

      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const result = await sendCustomMessage({
        customerPhone: booking.customer.phone,
        message,
      });

      res.json(result);
    } catch (error: any) {
      console.error("SMS custom message error:", error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
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

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }

        // Use bcrypt to compare passwords
        const { compare } = await import("bcrypt");
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
    }),
  );

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
