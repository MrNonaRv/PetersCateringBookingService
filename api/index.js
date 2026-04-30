var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  addOns: () => addOns,
  addOnsRelations: () => addOnsRelations,
  availability: () => availability,
  bookingAddOns: () => bookingAddOns,
  bookingAddOnsRelations: () => bookingAddOnsRelations,
  bookingDishes: () => bookingDishes,
  bookingDishesRelations: () => bookingDishesRelations,
  bookings: () => bookings,
  bookingsRelations: () => bookingsRelations,
  capacityCalendar: () => capacityCalendar,
  customQuotes: () => customQuotes,
  customQuotesRelations: () => customQuotesRelations,
  customers: () => customers,
  customersRelations: () => customersRelations,
  dishes: () => dishes,
  dishesRelations: () => dishesRelations,
  galleryImages: () => galleryImages,
  insertAddOnSchema: () => insertAddOnSchema,
  insertAvailabilitySchema: () => insertAvailabilitySchema,
  insertBookingAddOnSchema: () => insertBookingAddOnSchema,
  insertBookingDishSchema: () => insertBookingDishSchema,
  insertBookingSchema: () => insertBookingSchema,
  insertCapacityCalendarSchema: () => insertCapacityCalendarSchema,
  insertCustomQuoteSchema: () => insertCustomQuoteSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertDishSchema: () => insertDishSchema,
  insertGalleryImageSchema: () => insertGalleryImageSchema,
  insertPackageDishSchema: () => insertPackageDishSchema,
  insertPaymentSettingSchema: () => insertPaymentSettingSchema,
  insertRecentEventSchema: () => insertRecentEventSchema,
  insertServicePackageSchema: () => insertServicePackageSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertUserSchema: () => insertUserSchema,
  insertVenueSchema: () => insertVenueSchema,
  packageDishes: () => packageDishes,
  packageDishesRelations: () => packageDishesRelations,
  paymentSettings: () => paymentSettings,
  recentEvents: () => recentEvents,
  recentEventsRelations: () => recentEventsRelations,
  servicePackages: () => servicePackages,
  servicePackagesRelations: () => servicePackagesRelations,
  services: () => services,
  servicesRelations: () => servicesRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  venues: () => venues
});
import { pgTable, text, serial, integer, boolean, date, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users, capacityCalendar, dishes, addOns, venues, customQuotes, packageDishes, bookingDishes, bookingAddOns, services, servicePackages, availability, customers, bookings, recentEvents, paymentSettings, galleryImages, insertUserSchema, insertServiceSchema, insertServicePackageSchema, insertAvailabilitySchema, insertBookingSchema, insertCustomerSchema, insertRecentEventSchema, insertGalleryImageSchema, insertCapacityCalendarSchema, insertDishSchema, insertAddOnSchema, insertVenueSchema, insertCustomQuoteSchema, insertPackageDishSchema, insertBookingDishSchema, insertBookingAddOnSchema, insertPaymentSettingSchema, usersRelations, servicesRelations, servicePackagesRelations, recentEventsRelations, bookingsRelations, customersRelations, dishesRelations, addOnsRelations, customQuotesRelations, packageDishesRelations, bookingDishesRelations, bookingAddOnsRelations;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      name: text("name").notNull(),
      role: text("role").notNull().default("staff"),
      // 'admin' or 'staff'
      email: text("email").notNull(),
      phone: text("phone")
    });
    capacityCalendar = pgTable("capacity_calendar", {
      id: serial("id").primaryKey(),
      date: date("date").notNull(),
      dayType: text("day_type").notNull().default("normal"),
      // 'normal', 'peak', 'closed'
      maxSlots: integer("max_slots").notNull().default(7),
      // 7 normal, 10 peak, 0 closed
      bookedSlots: integer("booked_slots").notNull().default(0),
      notes: text("notes")
    });
    dishes = pgTable("dishes", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description"),
      category: text("category").notNull(),
      // 'appetizer', 'main', 'dessert', 'beverage', 'side'
      tags: text("tags").array(),
      // e.g., ['vegetarian', 'spicy', 'popular']
      imageUrl: text("image_url"),
      additionalCost: integer("additional_cost").default(0),
      // in cents, for premium items
      isAvailable: boolean("is_available").default(true),
      sortOrder: integer("sort_order").default(0)
    });
    addOns = pgTable("add_ons", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description"),
      category: text("category").notNull(),
      // 'equipment', 'service', 'decoration', 'entertainment'
      priceType: text("price_type").notNull().default("fixed"),
      // 'fixed', 'per_person', 'per_hour'
      price: integer("price").notNull(),
      // in cents
      minQuantity: integer("min_quantity").default(1),
      maxQuantity: integer("max_quantity"),
      isAvailable: boolean("is_available").default(true)
    });
    venues = pgTable("venues", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description"),
      address: text("address").notNull(),
      capacityMin: integer("capacity_min").default(0),
      capacityMax: integer("capacity_max"),
      price: integer("price").notNull(),
      // in cents
      type: text("type").notNull().default("venue"),
      // 'venue', 'room', etc.
      imageUrl: text("image_url"),
      isAvailable: boolean("is_available").default(true)
    });
    customQuotes = pgTable("custom_quotes", {
      id: serial("id").primaryKey(),
      customerId: integer("customer_id").notNull().references(() => customers.id),
      quoteReference: text("quote_reference").notNull().unique(),
      eventDate: date("event_date").notNull(),
      eventTime: text("event_time").notNull(),
      eventType: text("event_type").notNull(),
      guestCount: integer("guest_count").notNull(),
      venueAddress: text("venue_address").notNull(),
      budget: integer("budget"),
      // in cents, customer's budget range
      theme: text("theme"),
      description: text("description"),
      // Client's description of the event
      preferences: text("preferences"),
      // dietary preferences, cuisine style
      specialRequests: text("special_requests"),
      status: text("status").notNull().default("new"),
      // 'new', 'quote_sent', 'accepted', 'revision_requested', 'rejected', 'approved', 'deposit_paid'
      proposedPackage: text("proposed_package"),
      // JSON string of proposed menu/package
      proposedPrice: integer("proposed_price"),
      // in cents
      depositAmount: integer("deposit_amount"),
      // in cents
      adminNotes: text("admin_notes"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    packageDishes = pgTable("package_dishes", {
      packageId: integer("package_id").notNull().references(() => servicePackages.id, { onDelete: "cascade" }),
      dishId: integer("dish_id").notNull().references(() => dishes.id, { onDelete: "cascade" }),
      isRequired: boolean("is_required").default(false),
      maxSelections: integer("max_selections").default(1)
    }, (t) => ({
      pk: primaryKey({ columns: [t.packageId, t.dishId] })
    }));
    bookingDishes = pgTable("booking_dishes", {
      id: serial("id").primaryKey(),
      bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
      dishId: integer("dish_id").notNull().references(() => dishes.id),
      quantity: integer("quantity").default(1)
    });
    bookingAddOns = pgTable("booking_add_ons", {
      id: serial("id").primaryKey(),
      bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
      addOnId: integer("add_on_id").notNull().references(() => addOns.id),
      quantity: integer("quantity").default(1),
      totalPrice: integer("total_price").notNull()
      // calculated price for this add-on
    });
    services = pgTable("services", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      imageUrl: text("image_url").notNull(),
      basePrice: integer("base_price").notNull(),
      // price per person in cents
      featured: boolean("featured").default(false)
    });
    servicePackages = pgTable("service_packages", {
      id: serial("id").primaryKey(),
      serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      // e.g., "Basic Package", "Premium Package"
      description: text("description").notNull(),
      pricePerPerson: integer("price_per_person").notNull(),
      // in cents
      minGuests: integer("min_guests").notNull().default(10),
      maxGuests: integer("max_guests"),
      // null = no limit
      features: text("features").array(),
      // array of features included
      hasThemedCake: boolean("has_themed_cake").default(false),
      isActive: boolean("is_active").default(true),
      sortOrder: integer("sort_order").default(0)
      // for ordering packages
    });
    availability = pgTable("availability", {
      id: serial("id").primaryKey(),
      date: date("date").notNull(),
      isAvailable: boolean("is_available").default(true),
      notes: text("notes")
    });
    customers = pgTable("customers", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      email: text("email").notNull(),
      phone: text("phone").notNull(),
      company: text("company")
    });
    bookings = pgTable("bookings", {
      id: serial("id").primaryKey(),
      customerId: integer("customer_id").notNull().references(() => customers.id),
      bookingReference: text("booking_reference").notNull().unique(),
      serviceId: integer("service_id").notNull().references(() => services.id),
      packageId: integer("package_id").references(() => servicePackages.id),
      eventDate: date("event_date").notNull(),
      eventType: text("event_type").notNull(),
      eventTime: text("event_time").notNull(),
      eventDuration: integer("event_duration").default(4),
      // in hours
      guestCount: integer("guest_count").notNull(),
      venueAddress: text("venue_address").notNull(),
      menuPreference: text("menu_preference").notNull(),
      serviceStyle: text("service_style").notNull(),
      additionalServices: text("additional_services"),
      theme: text("theme"),
      // Theme for the cake or event if applicable
      specialRequests: text("special_requests"),
      status: text("status").notNull().default("pending_approval"),
      // pending_approval, approved, deposit_paid, fully_paid, confirmed, completed, cancelled
      totalPrice: integer("total_price").notNull(),
      // in cents
      depositAmount: integer("deposit_amount").default(0),
      // in cents (typically 50% of total)
      depositPaid: boolean("deposit_paid").default(false),
      depositPaymentMethod: text("deposit_payment_method"),
      // gcash, paymaya, bank_transfer
      depositPaymentReference: text("deposit_payment_reference"),
      depositPaidAt: timestamp("deposit_paid_at"),
      balanceAmount: integer("balance_amount").default(0),
      // remaining balance in cents
      balancePaid: boolean("balance_paid").default(false),
      balancePaymentMethod: text("balance_payment_method"),
      balancePaymentReference: text("balance_payment_reference"),
      balancePaidAt: timestamp("balance_paid_at"),
      paymentMethod: text("payment_method"),
      // gcash, paymaya, bank_transfer, cash (legacy)
      paymentStatus: text("payment_status").notNull().default("pending"),
      // pending, deposit_paid, fully_paid, failed
      paymentReference: text("payment_reference"),
      adminNotes: text("admin_notes"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    recentEvents = pgTable("recent_events", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      eventType: text("event_type").notNull(),
      eventDate: date("event_date").notNull(),
      venue: text("venue").notNull(),
      guestCount: integer("guest_count").notNull(),
      imageUrl: text("image_url").notNull(),
      highlights: text("highlights").array(),
      // array of highlight features
      featured: boolean("featured").default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    paymentSettings = pgTable("payment_settings", {
      id: serial("id").primaryKey(),
      paymentMethod: text("payment_method").notNull().unique(),
      // gcash, paymaya, bank_bdo, bank_bpi, etc.
      accountName: text("account_name").notNull(),
      accountNumber: text("account_number").notNull(),
      isActive: boolean("is_active").default(true),
      instructions: text("instructions"),
      // Additional payment instructions
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    galleryImages = pgTable("gallery_images", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description"),
      filename: text("filename").notNull(),
      originalName: text("original_name").notNull(),
      mimeType: text("mime_type").notNull(),
      size: integer("size").notNull(),
      // in bytes
      category: text("category").default("general").notNull(),
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      password: true,
      name: true,
      role: true,
      email: true,
      phone: true
    });
    insertServiceSchema = createInsertSchema(services).pick({
      name: true,
      description: true,
      imageUrl: true,
      basePrice: true,
      featured: true
    });
    insertServicePackageSchema = createInsertSchema(servicePackages).omit({
      id: true
    });
    insertAvailabilitySchema = createInsertSchema(availability).pick({
      date: true,
      isAvailable: true,
      notes: true
    });
    insertBookingSchema = createInsertSchema(bookings).omit({
      id: true,
      createdAt: true
    });
    insertCustomerSchema = createInsertSchema(customers).omit({
      id: true
    });
    insertRecentEventSchema = createInsertSchema(recentEvents).omit({
      id: true,
      createdAt: true
    });
    insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
      id: true,
      createdAt: true
    });
    insertCapacityCalendarSchema = createInsertSchema(capacityCalendar).omit({
      id: true
    });
    insertDishSchema = createInsertSchema(dishes).omit({
      id: true
    });
    insertAddOnSchema = createInsertSchema(addOns).omit({
      id: true
    });
    insertVenueSchema = createInsertSchema(venues).omit({
      id: true
    });
    insertCustomQuoteSchema = createInsertSchema(customQuotes).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPackageDishSchema = createInsertSchema(packageDishes);
    insertBookingDishSchema = createInsertSchema(bookingDishes).omit({
      id: true
    });
    insertBookingAddOnSchema = createInsertSchema(bookingAddOns).omit({
      id: true
    });
    insertPaymentSettingSchema = createInsertSchema(paymentSettings).omit({
      id: true,
      updatedAt: true
    });
    usersRelations = relations(users, ({ many }) => ({
      bookings: many(bookings)
    }));
    servicesRelations = relations(services, ({ many }) => ({
      bookings: many(bookings),
      packages: many(servicePackages)
    }));
    servicePackagesRelations = relations(servicePackages, ({ one }) => ({
      service: one(services, {
        fields: [servicePackages.serviceId],
        references: [services.id]
      })
    }));
    recentEventsRelations = relations(recentEvents, ({}) => ({}));
    bookingsRelations = relations(bookings, ({ one }) => ({
      customer: one(customers, {
        fields: [bookings.customerId],
        references: [customers.id]
      }),
      service: one(services, {
        fields: [bookings.serviceId],
        references: [services.id]
      })
    }));
    customersRelations = relations(customers, ({ many }) => ({
      bookings: many(bookings),
      customQuotes: many(customQuotes)
    }));
    dishesRelations = relations(dishes, ({ many }) => ({
      packageDishes: many(packageDishes),
      bookingDishes: many(bookingDishes)
    }));
    addOnsRelations = relations(addOns, ({ many }) => ({
      bookingAddOns: many(bookingAddOns)
    }));
    customQuotesRelations = relations(customQuotes, ({ one }) => ({
      customer: one(customers, {
        fields: [customQuotes.customerId],
        references: [customers.id]
      })
    }));
    packageDishesRelations = relations(packageDishes, ({ one }) => ({
      package: one(servicePackages, {
        fields: [packageDishes.packageId],
        references: [servicePackages.id]
      }),
      dish: one(dishes, {
        fields: [packageDishes.dishId],
        references: [dishes.id]
      })
    }));
    bookingDishesRelations = relations(bookingDishes, ({ one }) => ({
      booking: one(bookings, {
        fields: [bookingDishes.bookingId],
        references: [bookings.id]
      }),
      dish: one(dishes, {
        fields: [bookingDishes.dishId],
        references: [dishes.id]
      })
    }));
    bookingAddOnsRelations = relations(bookingAddOns, ({ one }) => ({
      booking: one(bookings, {
        fields: [bookingAddOns.bookingId],
        references: [bookings.id]
      }),
      addOn: one(addOns, {
        fields: [bookingAddOns.addOnId],
        references: [addOns.id]
      })
    }));
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var Pool, connectionString, isExternalDb, cleanConnectionString, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    ({ Pool } = pg);
    connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      console.warn("Neither DATABASE_URL nor POSTGRES_URL is set. Running in in-memory mode.");
    } else {
      console.log("Database connection string detected.");
    }
    isExternalDb = connectionString?.includes("supabase.com") || connectionString?.includes("pooler.supabase.com") || connectionString?.includes("neon.tech");
    cleanConnectionString = connectionString?.replace(/[?&]sslmode=[^&]+/, (match) => {
      return match.startsWith("?") ? "" : "";
    }).replace(/[?&]$/, "") ?? connectionString;
    pool = null;
    try {
      pool = cleanConnectionString ? new Pool({
        connectionString: cleanConnectionString,
        ssl: isExternalDb ? { rejectUnauthorized: false } : void 0,
        connectionTimeoutMillis: 1e4
        // 10s timeout
      }) : null;
      if (pool) {
        pool.on("error", (err) => {
          console.error("Unexpected error on idle client", err);
        });
      }
    } catch (error) {
      console.error("Failed to create database pool:", error);
    }
    db = pool ? drizzle(pool, { schema: schema_exports }) : null;
  }
});

// server/storage/database.ts
import { eq, desc, inArray } from "drizzle-orm";
var db2, DatabaseStorage;
var init_database = __esm({
  "server/storage/database.ts"() {
    "use strict";
    init_schema();
    init_db();
    db2 = db;
    DatabaseStorage = class {
      async getUser(id) {
        const [user] = await db2.select().from(users).where(eq(users.id, id));
        return user || void 0;
      }
      async getUsers() {
        return db2.select().from(users);
      }
      async getUserByUsername(username) {
        const [user] = await db2.select().from(users).where(eq(users.username, username));
        return user || void 0;
      }
      async createUser(insertUser) {
        const [user] = await db2.insert(users).values(insertUser).returning();
        return user;
      }
      async updateUser(id, userUpdate) {
        const [updatedUser] = await db2.update(users).set(userUpdate).where(eq(users.id, id)).returning();
        return updatedUser || void 0;
      }
      async getServices() {
        return db2.select().from(services);
      }
      async getService(id) {
        const [service] = await db2.select().from(services).where(eq(services.id, id));
        return service || void 0;
      }
      async createService(insertService) {
        const [service] = await db2.insert(services).values(insertService).returning();
        return service;
      }
      async updateService(id, serviceUpdate) {
        const [updatedService] = await db2.update(services).set(serviceUpdate).where(eq(services.id, id)).returning();
        return updatedService || void 0;
      }
      async deleteService(id) {
        const result = await db2.delete(services).where(eq(services.id, id)).returning({ deletedId: services.id });
        return result.length > 0;
      }
      async getAvailabilities() {
        return db2.select().from(availability);
      }
      async getAvailability(dateStr) {
        const [availabilityRecord] = await db2.select().from(availability).where(eq(availability.date, dateStr));
        return availabilityRecord || void 0;
      }
      async setAvailability(insertAvailability) {
        const existingAvailability = await this.getAvailability(insertAvailability.date);
        if (existingAvailability) {
          const [updated] = await db2.update(availability).set(insertAvailability).where(eq(availability.id, existingAvailability.id)).returning();
          return updated;
        } else {
          const [newAvailability] = await db2.insert(availability).values(insertAvailability).returning();
          return newAvailability;
        }
      }
      async updateAvailability(id, availabilityUpdate) {
        const [updatedAvailability] = await db2.update(availability).set(availabilityUpdate).where(eq(availability.id, id)).returning();
        return updatedAvailability || void 0;
      }
      async getBookings() {
        const bookingsData = await db2.select({
          booking: bookings,
          customer: customers,
          service: services,
          package: servicePackages
        }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id)).leftJoin(services, eq(bookings.serviceId, services.id)).leftJoin(servicePackages, eq(bookings.packageId, servicePackages.id)).orderBy(desc(bookings.createdAt));
        if (bookingsData.length === 0) return [];
        const bookingIds = bookingsData.map((b) => b.booking.id);
        const allDishes = await db2.select({
          bookingId: bookingDishes.bookingId,
          dish: dishes,
          quantity: bookingDishes.quantity
        }).from(bookingDishes).innerJoin(dishes, eq(bookingDishes.dishId, dishes.id)).where(inArray(bookingDishes.bookingId, bookingIds));
        const dishesMap = allDishes.reduce((acc, curr) => {
          if (!acc[curr.bookingId]) acc[curr.bookingId] = [];
          acc[curr.bookingId].push({ ...curr.dish, quantity: curr.quantity || 1 });
          return acc;
        }, {});
        return bookingsData.map((b) => ({
          ...b.booking,
          customer: b.customer,
          service: b.service,
          package: b.package,
          selectedDishes: dishesMap[b.booking.id] || []
        }));
      }
      async getBooking(id) {
        const [data] = await db2.select({
          booking: bookings,
          customer: customers,
          service: services,
          package: servicePackages
        }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id)).leftJoin(services, eq(bookings.serviceId, services.id)).leftJoin(servicePackages, eq(bookings.packageId, servicePackages.id)).where(eq(bookings.id, id));
        if (!data) return void 0;
        const dishesResult = await db2.select({
          dish: dishes,
          quantity: bookingDishes.quantity
        }).from(bookingDishes).innerJoin(dishes, eq(bookingDishes.dishId, dishes.id)).where(eq(bookingDishes.bookingId, id));
        const selectedDishes = dishesResult.map((d) => ({
          ...d.dish,
          quantity: d.quantity || 1
        }));
        return {
          ...data.booking,
          customer: data.customer,
          service: data.service,
          package: data.package,
          selectedDishes
        };
      }
      async getBookingByReference(reference) {
        const [data] = await db2.select({
          booking: bookings,
          customer: customers,
          service: services,
          package: servicePackages
        }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id)).leftJoin(services, eq(bookings.serviceId, services.id)).leftJoin(servicePackages, eq(bookings.packageId, servicePackages.id)).where(eq(bookings.bookingReference, reference));
        if (!data) return void 0;
        const dishesResult = await db2.select({
          dish: dishes,
          quantity: bookingDishes.quantity
        }).from(bookingDishes).innerJoin(dishes, eq(bookingDishes.dishId, dishes.id)).where(eq(bookingDishes.bookingId, data.booking.id));
        const selectedDishes = dishesResult.map((d) => ({
          ...d.dish,
          quantity: d.quantity || 1
        }));
        return {
          ...data.booking,
          customer: data.customer,
          service: data.service,
          package: data.package,
          selectedDishes
        };
      }
      async createBooking(insertBooking, insertCustomer, selectedDishes) {
        let customer;
        const [existingCustomer] = await db2.select().from(customers).where(eq(customers.email, insertCustomer.email));
        if (existingCustomer) {
          const [updatedCustomer] = await db2.update(customers).set(insertCustomer).where(eq(customers.id, existingCustomer.id)).returning();
          customer = updatedCustomer;
        } else {
          const [newCustomer] = await db2.insert(customers).values(insertCustomer).returning();
          customer = newCustomer;
        }
        const [booking] = await db2.insert(bookings).values({ ...insertBooking, customerId: customer.id }).returning();
        if (selectedDishes && selectedDishes.length > 0) {
          const dishInserts = selectedDishes.map((dishId) => ({ bookingId: booking.id, dishId, quantity: 1 }));
          await db2.insert(bookingDishes).values(dishInserts);
        }
        const [service] = await db2.select().from(services).where(eq(services.id, booking.serviceId));
        return { ...booking, customer, service };
      }
      async updateBookingStatus(id, status) {
        const [updatedBooking] = await db2.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
        return updatedBooking || void 0;
      }
      async updateBookingPayment(id, paymentData) {
        const [updatedBooking] = await db2.update(bookings).set(paymentData).where(eq(bookings.id, id)).returning();
        return updatedBooking || void 0;
      }
      async updateBooking(id, data) {
        const [updatedBooking] = await db2.update(bookings).set(data).where(eq(bookings.id, id)).returning();
        return updatedBooking || void 0;
      }
      async getCustomer(id) {
        const [customer] = await db2.select().from(customers).where(eq(customers.id, id));
        return customer || void 0;
      }
      async getCustomerByEmail(email) {
        const [customer] = await db2.select().from(customers).where(eq(customers.email, email));
        return customer || void 0;
      }
      async getRecentEvents() {
        return db2.select().from(recentEvents).orderBy(desc(recentEvents.eventDate));
      }
      async getRecentEvent(id) {
        const [event] = await db2.select().from(recentEvents).where(eq(recentEvents.id, id));
        return event || void 0;
      }
      async createRecentEvent(insertEvent) {
        const [event] = await db2.insert(recentEvents).values(insertEvent).returning();
        return event;
      }
      async updateRecentEvent(id, eventUpdate) {
        const [updatedEvent] = await db2.update(recentEvents).set(eventUpdate).where(eq(recentEvents.id, id)).returning();
        return updatedEvent || void 0;
      }
      async deleteRecentEvent(id) {
        const result = await db2.delete(recentEvents).where(eq(recentEvents.id, id)).returning({ deletedId: recentEvents.id });
        return result.length > 0;
      }
      async getServicePackages() {
        return db2.select().from(servicePackages);
      }
      async getServicePackagesByService(serviceId) {
        return db2.select().from(servicePackages).where(eq(servicePackages.serviceId, serviceId)).orderBy(servicePackages.sortOrder, servicePackages.pricePerPerson);
      }
      async getServicePackage(id) {
        const [servicePackage] = await db2.select().from(servicePackages).where(eq(servicePackages.id, id));
        return servicePackage || void 0;
      }
      async createServicePackage(insertServicePackage) {
        const [servicePackage] = await db2.insert(servicePackages).values(insertServicePackage).returning();
        return servicePackage;
      }
      async updateServicePackage(id, servicePackageUpdate) {
        const [updatedServicePackage] = await db2.update(servicePackages).set(servicePackageUpdate).where(eq(servicePackages.id, id)).returning();
        return updatedServicePackage || void 0;
      }
      async deleteServicePackage(id) {
        const result = await db2.delete(servicePackages).where(eq(servicePackages.id, id)).returning({ deletedId: servicePackages.id });
        return result.length > 0;
      }
      async getGalleryImages() {
        return db2.select().from(galleryImages).orderBy(galleryImages.createdAt);
      }
      async getGalleryImagesByCategory(category) {
        return db2.select().from(galleryImages).where(eq(galleryImages.category, category)).orderBy(galleryImages.createdAt);
      }
      async getGalleryImage(id) {
        const [image] = await db2.select().from(galleryImages).where(eq(galleryImages.id, id));
        return image || void 0;
      }
      async createGalleryImage(insertGalleryImage) {
        const [image] = await db2.insert(galleryImages).values(insertGalleryImage).returning();
        return image;
      }
      async updateGalleryImage(id, imageUpdate) {
        const [updatedImage] = await db2.update(galleryImages).set(imageUpdate).where(eq(galleryImages.id, id)).returning();
        return updatedImage || void 0;
      }
      async deleteGalleryImage(id) {
        const result = await db2.delete(galleryImages).where(eq(galleryImages.id, id)).returning({ deletedId: galleryImages.id });
        return result.length > 0;
      }
      async getCapacityCalendar() {
        return db2.select().from(capacityCalendar).orderBy(capacityCalendar.date);
      }
      async getCapacityByDate(dateStr) {
        const [capacity] = await db2.select().from(capacityCalendar).where(eq(capacityCalendar.date, dateStr));
        return capacity || void 0;
      }
      async setCapacity(insertCapacity) {
        const existing = await this.getCapacityByDate(insertCapacity.date);
        if (existing) {
          const [updated] = await db2.update(capacityCalendar).set(insertCapacity).where(eq(capacityCalendar.id, existing.id)).returning();
          return updated;
        } else {
          const [newCapacity] = await db2.insert(capacityCalendar).values(insertCapacity).returning();
          return newCapacity;
        }
      }
      async updateCapacity(id, capacityUpdate) {
        const [updated] = await db2.update(capacityCalendar).set(capacityUpdate).where(eq(capacityCalendar.id, id)).returning();
        return updated || void 0;
      }
      async getDishes() {
        return db2.select().from(dishes).orderBy(dishes.sortOrder);
      }
      async getDishesByCategory(category) {
        return db2.select().from(dishes).where(eq(dishes.category, category)).orderBy(dishes.sortOrder);
      }
      async getDish(id) {
        const [dish] = await db2.select().from(dishes).where(eq(dishes.id, id));
        return dish || void 0;
      }
      async createDish(insertDish) {
        const [dish] = await db2.insert(dishes).values(insertDish).returning();
        return dish;
      }
      async updateDish(id, dishUpdate) {
        const [updated] = await db2.update(dishes).set(dishUpdate).where(eq(dishes.id, id)).returning();
        return updated || void 0;
      }
      async deleteDish(id) {
        const result = await db2.delete(dishes).where(eq(dishes.id, id)).returning({ deletedId: dishes.id });
        return result.length > 0;
      }
      async getAddOns() {
        return db2.select().from(addOns);
      }
      async getAddOnsByCategory(category) {
        return db2.select().from(addOns).where(eq(addOns.category, category));
      }
      async getAddOn(id) {
        const [addOn] = await db2.select().from(addOns).where(eq(addOns.id, id));
        return addOn || void 0;
      }
      async createAddOn(insertAddOn) {
        const [addOn] = await db2.insert(addOns).values(insertAddOn).returning();
        return addOn;
      }
      async updateAddOn(id, addOnUpdate) {
        const [updated] = await db2.update(addOns).set(addOnUpdate).where(eq(addOns.id, id)).returning();
        return updated || void 0;
      }
      async deleteAddOn(id) {
        const result = await db2.delete(addOns).where(eq(addOns.id, id)).returning({ deletedId: addOns.id });
        return result.length > 0;
      }
      async getVenues() {
        return db2.select().from(venues).orderBy(venues.name);
      }
      async getVenue(id) {
        const [venue] = await db2.select().from(venues).where(eq(venues.id, id));
        return venue || void 0;
      }
      async createVenue(insertVenue) {
        const [venue] = await db2.insert(venues).values(insertVenue).returning();
        return venue;
      }
      async updateVenue(id, venueUpdate) {
        const [updated] = await db2.update(venues).set(venueUpdate).where(eq(venues.id, id)).returning();
        return updated || void 0;
      }
      async deleteVenue(id) {
        const result = await db2.delete(venues).where(eq(venues.id, id)).returning({ deletedId: venues.id });
        return result.length > 0;
      }
      async getCustomQuotes() {
        const quotesData = await db2.select({
          quote: customQuotes,
          customer: customers
        }).from(customQuotes).innerJoin(customers, eq(customQuotes.customerId, customers.id)).orderBy(desc(customQuotes.createdAt));
        return quotesData.map((q) => ({
          ...q.quote,
          customer: q.customer
        }));
      }
      async getCustomQuote(id) {
        const [data] = await db2.select({
          quote: customQuotes,
          customer: customers
        }).from(customQuotes).innerJoin(customers, eq(customQuotes.customerId, customers.id)).where(eq(customQuotes.id, id));
        if (!data) return void 0;
        return { ...data.quote, customer: data.customer };
      }
      async getCustomQuoteByReference(reference) {
        const [data] = await db2.select({
          quote: customQuotes,
          customer: customers
        }).from(customQuotes).innerJoin(customers, eq(customQuotes.customerId, customers.id)).where(eq(customQuotes.quoteReference, reference));
        if (!data) return void 0;
        return { ...data.quote, customer: data.customer };
      }
      async createCustomQuote(insertQuote, insertCustomer) {
        let customer;
        const [existingCustomer] = await db2.select().from(customers).where(eq(customers.email, insertCustomer.email));
        if (existingCustomer) {
          customer = existingCustomer;
        } else {
          const [newCustomer] = await db2.insert(customers).values(insertCustomer).returning();
          customer = newCustomer;
        }
        const quoteReference = `PCQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const [quote] = await db2.insert(customQuotes).values({ ...insertQuote, customerId: customer.id, quoteReference }).returning();
        return { ...quote, customer };
      }
      async updateCustomQuoteStatus(id, status, updates) {
        const [updated] = await db2.update(customQuotes).set({ ...updates, status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(customQuotes.id, id)).returning();
        return updated || void 0;
      }
      async getPaymentSettings() {
        return db2.select().from(paymentSettings).orderBy(paymentSettings.paymentMethod);
      }
      async getPaymentSetting(paymentMethod) {
        const [setting] = await db2.select().from(paymentSettings).where(eq(paymentSettings.paymentMethod, paymentMethod));
        return setting || void 0;
      }
      async upsertPaymentSetting(setting) {
        const existing = await this.getPaymentSetting(setting.paymentMethod);
        if (existing) {
          const [updated] = await db2.update(paymentSettings).set({ ...setting, updatedAt: /* @__PURE__ */ new Date() }).where(eq(paymentSettings.paymentMethod, setting.paymentMethod)).returning();
          return updated;
        } else {
          const [created] = await db2.insert(paymentSettings).values(setting).returning();
          return created;
        }
      }
      async deletePaymentSetting(id) {
        const result = await db2.delete(paymentSettings).where(eq(paymentSettings.id, id)).returning({ deletedId: paymentSettings.id });
        return result.length > 0;
      }
    };
  }
});

// server/storage/memory.ts
var MemStorage;
var init_memory = __esm({
  "server/storage/memory.ts"() {
    "use strict";
    MemStorage = class {
      users = /* @__PURE__ */ new Map();
      services = /* @__PURE__ */ new Map();
      servicePackages = /* @__PURE__ */ new Map();
      availability = /* @__PURE__ */ new Map();
      bookings = /* @__PURE__ */ new Map();
      bookingDishes = /* @__PURE__ */ new Map();
      customers = /* @__PURE__ */ new Map();
      recentEvents = /* @__PURE__ */ new Map();
      galleryImages = /* @__PURE__ */ new Map();
      capacityCalendar = /* @__PURE__ */ new Map();
      dishes = /* @__PURE__ */ new Map();
      addOns = /* @__PURE__ */ new Map();
      venues = /* @__PURE__ */ new Map();
      customQuotes = /* @__PURE__ */ new Map();
      paymentSettings = /* @__PURE__ */ new Map();
      currentId = 1;
      constructor() {
        this.seed();
      }
      seed() {
        this.users.set(1, {
          id: 1,
          username: "admin",
          password: "$2b$10$W2HgvkUYMxJ5fHYKpdhB4eeTcgsK5ZvA.0hhic6Sp/85YnGOK90EO",
          // "admin"
          name: "Admin User",
          role: "admin",
          email: "admin@peterscreation.com",
          phone: null
        });
        const weddingService = { id: 2, name: "Wedding Receptions", description: "Complete wedding catering", imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed", basePrice: 15e4, featured: true };
        this.services.set(2, weddingService);
        this.servicePackages.set(1, { id: 1, serviceId: 2, name: "Gold Package", description: "Premium wedding package", pricePerPerson: 1500, minGuests: 50, maxGuests: 500, features: ["Full decor", "5 Main dishes"], hasThemedCake: true, isActive: true, sortOrder: 1 });
        this.dishes.set(1, { id: 1, name: "Lechon", description: "Roasted pig", category: "main", tags: ["popular"], imageUrl: "", additionalCost: 0, isAvailable: true, sortOrder: 1 });
        this.currentId = 3;
      }
      async getUser(id) {
        return this.users.get(id);
      }
      async getUsers() {
        return Array.from(this.users.values());
      }
      async getUserByUsername(username) {
        return Array.from(this.users.values()).find((u) => u.username === username);
      }
      async createUser(insertUser) {
        const id = this.currentId++;
        const user = { ...insertUser, id, phone: insertUser.phone || null };
        this.users.set(id, user);
        return user;
      }
      async updateUser(id, userUpdate) {
        const user = this.users.get(id);
        if (!user) return void 0;
        const updated = { ...user, ...userUpdate };
        this.users.set(id, updated);
        return updated;
      }
      async getServices() {
        return Array.from(this.services.values());
      }
      async getService(id) {
        return this.services.get(id);
      }
      async createService(s) {
        const id = this.currentId++;
        const service = { ...s, id };
        this.services.set(id, service);
        return service;
      }
      async updateService(id, s) {
        const service = this.services.get(id);
        if (!service) return void 0;
        const updated = { ...service, ...s };
        this.services.set(id, updated);
        return updated;
      }
      async deleteService(id) {
        return this.services.delete(id);
      }
      async getServicePackages() {
        return Array.from(this.servicePackages.values());
      }
      async getServicePackagesByService(serviceId) {
        return Array.from(this.servicePackages.values()).filter((p) => p.serviceId === serviceId);
      }
      async getServicePackage(id) {
        return this.servicePackages.get(id);
      }
      async createServicePackage(p) {
        const id = this.currentId++;
        const pkg = { ...p, id, maxGuests: p.maxGuests || null, features: p.features || null, sortOrder: p.sortOrder || 0, hasThemedCake: p.hasThemedCake || false, isActive: p.isActive ?? true };
        this.servicePackages.set(id, pkg);
        return pkg;
      }
      async updateServicePackage(id, p) {
        const pkg = this.servicePackages.get(id);
        if (!pkg) return void 0;
        const updated = { ...pkg, ...p };
        this.servicePackages.set(id, updated);
        return updated;
      }
      async deleteServicePackage(id) {
        return this.servicePackages.delete(id);
      }
      async getAvailabilities() {
        return Array.from(this.availability.values());
      }
      async getAvailability(date2) {
        return this.availability.get(date2);
      }
      async setAvailability(a) {
        const id = this.currentId++;
        const avail = { ...a, id, notes: a.notes || null, isAvailable: a.isAvailable ?? true };
        this.availability.set(a.date, avail);
        return avail;
      }
      async updateAvailability(id, a) {
        const avail = Array.from(this.availability.values()).find((v) => v.id === id);
        if (!avail) return void 0;
        const updated = { ...avail, ...a };
        this.availability.set(updated.date, updated);
        return updated;
      }
      async getBookings() {
        return Promise.all(Array.from(this.bookings.values()).map((b) => this.getBooking(b.id)));
      }
      async getBooking(id) {
        const booking = this.bookings.get(id);
        if (!booking) return void 0;
        const customer = this.customers.get(booking.customerId);
        const service = this.services.get(booking.serviceId) || null;
        return { ...booking, customer, service };
      }
      async getBookingByReference(ref) {
        const booking = Array.from(this.bookings.values()).find((b) => b.bookingReference === ref);
        return booking ? this.getBooking(booking.id) : void 0;
      }
      async createBooking(b, c, selectedDishes) {
        let customer = Array.from(this.customers.values()).find((cust) => cust.email === c.email);
        if (!customer) {
          const cid = this.currentId++;
          customer = { ...c, id: cid, company: c.company || null };
          this.customers.set(cid, customer);
        }
        const bid = this.currentId++;
        const booking = {
          ...b,
          id: bid,
          customerId: customer.id,
          createdAt: /* @__PURE__ */ new Date(),
          eventDuration: b.eventDuration || 4,
          depositAmount: b.depositAmount || 0,
          depositPaid: b.depositPaid || false,
          balanceAmount: b.balanceAmount || 0,
          balancePaid: b.balancePaid || false,
          paymentStatus: b.paymentStatus || "pending",
          status: b.status || "pending_approval",
          additionalServices: b.additionalServices || null,
          specialRequests: b.specialRequests || null,
          theme: b.theme || null,
          depositPaymentMethod: b.depositPaymentMethod || null,
          depositPaymentReference: b.depositPaymentReference || null,
          depositPaidAt: b.depositPaidAt || null,
          balancePaymentMethod: b.balancePaymentMethod || null,
          balancePaymentReference: b.balancePaymentReference || null,
          balancePaidAt: b.balancePaidAt || null,
          paymentMethod: b.paymentMethod || null,
          paymentReference: b.paymentReference || null,
          adminNotes: b.adminNotes || null,
          packageId: b.packageId || null
        };
        this.bookings.set(bid, booking);
        return this.getBooking(bid);
      }
      async updateBookingStatus(id, status) {
        const b = this.bookings.get(id);
        if (!b) return void 0;
        b.status = status;
        return b;
      }
      async updateBookingPayment(id, data) {
        const b = this.bookings.get(id);
        if (!b) return void 0;
        Object.assign(b, data);
        return b;
      }
      async updateBooking(id, data) {
        const b = this.bookings.get(id);
        if (!b) return void 0;
        Object.assign(b, data);
        return b;
      }
      async getCustomer(id) {
        return this.customers.get(id);
      }
      async getCustomerByEmail(email) {
        return Array.from(this.customers.values()).find((c) => c.email === email);
      }
      async getRecentEvents() {
        return Array.from(this.recentEvents.values());
      }
      async getRecentEvent(id) {
        return this.recentEvents.get(id);
      }
      async createRecentEvent(e) {
        const id = this.currentId++;
        const event = { ...e, id, createdAt: /* @__PURE__ */ new Date(), highlights: e.highlights || null, featured: e.featured || false };
        this.recentEvents.set(id, event);
        return event;
      }
      async updateRecentEvent(id, e) {
        const event = this.recentEvents.get(id);
        if (!event) return void 0;
        const updated = { ...event, ...e };
        this.recentEvents.set(id, updated);
        return updated;
      }
      async deleteRecentEvent(id) {
        return this.recentEvents.delete(id);
      }
      async getGalleryImages() {
        return Array.from(this.galleryImages.values());
      }
      async getGalleryImagesByCategory(cat) {
        return Array.from(this.galleryImages.values()).filter((i) => i.category === cat);
      }
      async getGalleryImage(id) {
        return this.galleryImages.get(id);
      }
      async createGalleryImage(i) {
        const id = this.currentId++;
        const img = { ...i, id, createdAt: /* @__PURE__ */ new Date(), description: i.description || null, category: i.category || "general", isActive: i.isActive ?? true };
        this.galleryImages.set(id, img);
        return img;
      }
      async updateGalleryImage(id, i) {
        const img = this.galleryImages.get(id);
        if (!img) return void 0;
        const updated = { ...img, ...i };
        this.galleryImages.set(id, updated);
        return updated;
      }
      async deleteGalleryImage(id) {
        return this.galleryImages.delete(id);
      }
      async getCapacityCalendar() {
        return Array.from(this.capacityCalendar.values());
      }
      async getCapacityByDate(date2) {
        return this.capacityCalendar.get(date2);
      }
      async setCapacity(c) {
        const id = this.currentId++;
        const cap = { ...c, id, notes: c.notes || null, dayType: c.dayType || "normal", maxSlots: c.maxSlots || 7, bookedSlots: c.bookedSlots || 0 };
        this.capacityCalendar.set(c.date, cap);
        return cap;
      }
      async updateCapacity(id, c) {
        const cap = Array.from(this.capacityCalendar.values()).find((v) => v.id === id);
        if (!cap) return void 0;
        const updated = { ...cap, ...c };
        this.capacityCalendar.set(updated.date, updated);
        return updated;
      }
      async getDishes() {
        return Array.from(this.dishes.values());
      }
      async getDishesByCategory(cat) {
        return Array.from(this.dishes.values()).filter((d) => d.category === cat);
      }
      async getDish(id) {
        return this.dishes.get(id);
      }
      async createDish(d) {
        const id = this.currentId++;
        const dish = { ...d, id, description: d.description || null, tags: d.tags || null, imageUrl: d.imageUrl || null, additionalCost: d.additionalCost || 0, isAvailable: d.isAvailable ?? true, sortOrder: d.sortOrder || 0 };
        this.dishes.set(id, dish);
        return dish;
      }
      async updateDish(id, d) {
        const dish = this.dishes.get(id);
        if (!dish) return void 0;
        const updated = { ...dish, ...d };
        this.dishes.set(id, updated);
        return updated;
      }
      async deleteDish(id) {
        return this.dishes.delete(id);
      }
      async getAddOns() {
        return Array.from(this.addOns.values());
      }
      async getAddOnsByCategory(cat) {
        return Array.from(this.addOns.values()).filter((a) => a.category === cat);
      }
      async getAddOn(id) {
        return this.addOns.get(id);
      }
      async createAddOn(a) {
        const id = this.currentId++;
        const addOn = { ...a, id, description: a.description || null, minQuantity: a.minQuantity || 1, maxQuantity: a.maxQuantity || null, isAvailable: a.isAvailable ?? true, priceType: a.priceType || "fixed" };
        this.addOns.set(id, addOn);
        return addOn;
      }
      async updateAddOn(id, a) {
        const addOn = this.addOns.get(id);
        if (!addOn) return void 0;
        const updated = { ...addOn, ...a };
        this.addOns.set(id, updated);
        return updated;
      }
      async deleteAddOn(id) {
        return this.addOns.delete(id);
      }
      async getVenues() {
        return Array.from(this.venues.values());
      }
      async getVenue(id) {
        return this.venues.get(id);
      }
      async createVenue(v) {
        const id = this.currentId++;
        const venue = { ...v, id, description: v.description || null, capacityMin: v.capacityMin || 0, capacityMax: v.capacityMax || null, imageUrl: v.imageUrl || null, isAvailable: v.isAvailable ?? true, type: v.type || "venue" };
        this.venues.set(id, venue);
        return venue;
      }
      async updateVenue(id, v) {
        const venue = this.venues.get(id);
        if (!venue) return void 0;
        const updated = { ...venue, ...v };
        this.venues.set(id, updated);
        return updated;
      }
      async deleteVenue(id) {
        return this.venues.delete(id);
      }
      async getCustomQuotes() {
        return Promise.all(Array.from(this.customQuotes.values()).map((q) => this.getCustomQuote(q.id)));
      }
      async getCustomQuote(id) {
        const quote = this.customQuotes.get(id);
        if (!quote) return void 0;
        const customer = this.customers.get(quote.customerId);
        return { ...quote, customer };
      }
      async getCustomQuoteByReference(ref) {
        const quote = Array.from(this.customQuotes.values()).find((q) => q.quoteReference === ref);
        return quote ? this.getCustomQuote(quote.id) : void 0;
      }
      async createCustomQuote(q, c) {
        let customer = Array.from(this.customers.values()).find((cust) => cust.email === c.email);
        if (!customer) {
          const cid = this.currentId++;
          customer = { ...c, id: cid, company: c.company || null };
          this.customers.set(cid, customer);
        }
        const qid = this.currentId++;
        const quote = {
          ...q,
          id: qid,
          customerId: customer.id,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          budget: q.budget || null,
          theme: q.theme || null,
          description: q.description || null,
          preferences: q.preferences || null,
          specialRequests: q.specialRequests || null,
          status: q.status || "new",
          proposedPackage: q.proposedPackage || null,
          proposedPrice: q.proposedPrice || null,
          depositAmount: q.depositAmount || null,
          adminNotes: q.adminNotes || null
        };
        this.customQuotes.set(qid, quote);
        return this.getCustomQuote(qid);
      }
      async updateCustomQuoteStatus(id, status, updates) {
        const q = this.customQuotes.get(id);
        if (!q) return void 0;
        q.status = status;
        if (updates) Object.assign(q, updates);
        q.updatedAt = /* @__PURE__ */ new Date();
        return q;
      }
      async getPaymentSettings() {
        return Array.from(this.paymentSettings.values());
      }
      async getPaymentSetting(method) {
        return this.paymentSettings.get(method);
      }
      async upsertPaymentSetting(s) {
        const id = this.currentId++;
        const setting = { ...s, id, isActive: s.isActive ?? true, instructions: s.instructions || null, updatedAt: /* @__PURE__ */ new Date() };
        this.paymentSettings.set(s.paymentMethod, setting);
        return setting;
      }
      async deletePaymentSetting(id) {
        const setting = Array.from(this.paymentSettings.values()).find((s) => s.id === id);
        if (setting) return this.paymentSettings.delete(setting.paymentMethod);
        return false;
      }
    };
  }
});

// server/storage/index.ts
var storage;
var init_storage = __esm({
  "server/storage/index.ts"() {
    "use strict";
    init_db();
    init_database();
    init_memory();
    storage = db ? new DatabaseStorage() : new MemStorage();
  }
});

// server/storage.ts
var init_storage2 = __esm({
  "server/storage.ts"() {
    "use strict";
    init_storage();
  }
});

// server/auth.ts
var auth_exports = {};
__export(auth_exports, {
  isAuthenticated: () => isAuthenticated,
  setupAuthentication: () => setupAuthentication
});
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
function setupAuthentication(app2) {
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      const { compare } = await import("bcrypt");
      const isMatch = await compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });
}
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage2();
  }
});

// server/routes/auth.ts
import passport2 from "passport";
function registerAuthRoutes(app2) {
  app2.post("/api/auth/login", passport2.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
  app2.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    res.status(401).json({ message: "Not authenticated" });
  });
  app2.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { compare, hash: hash2 } = await import("bcrypt");
      const isMatch = await compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }
      const hashedPassword = await hash2(newPassword, 10);
      await storage.updateUser(userId, { password: hashedPassword });
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Error updating password" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const allUsers = await storage.getUsers();
      const user = allUsers.find((u) => u.email === email);
      if (user) {
        console.log(`Password reset requested for user: ${user.username} (${email})`);
      }
      res.json({ message: "If an account exists with this email, you will receive password reset instructions." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Error processing forgot password request" });
    }
  });
}
var init_auth2 = __esm({
  "server/routes/auth.ts"() {
    "use strict";
    init_storage2();
    init_auth();
  }
});

// server/sms.ts
function isSMSConfigured() {
  return !!IPROGSMS_API_TOKEN;
}
async function sendSMS(to, message) {
  if (!IPROGSMS_API_TOKEN) {
    console.warn("iProgSMS not configured. Skipping SMS:", { to, message: message.substring(0, 50) + "..." });
    return { success: false, error: "iProgSMS API token not configured" };
  }
  try {
    const formattedNumber = formatPhoneNumber(to);
    console.log("Sending SMS to:", formattedNumber, "Original:", to);
    console.log("Message:", message);
    const response = await fetch(IPROGSMS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_token: IPROGSMS_API_TOKEN,
        phone_number: formattedNumber,
        message,
        sender_name: IPROGSMS_SENDER_NAME
      })
    });
    const data = await response.json();
    console.log("iProgSMS response:", data);
    if (data.status === 200) {
      console.log("SMS sent successfully:", data.message_id);
      return { success: true, messageId: data.message_id };
    } else {
      console.error("Failed to send SMS:", data);
      const providerError = data.message || "Failed to send SMS";
      return { success: false, error: providerError };
    }
  } catch (error) {
    console.error("Failed to send SMS:", error.message);
    return { success: false, error: error.message };
  }
}
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("63") && cleaned.length === 12) {
    cleaned = "0" + cleaned.substring(2);
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}
async function sendBookingConfirmation(params) {
  const message = `Hi ${params.customerName}! Your catering request ${params.bookingReference} for ${params.eventType} on ${params.eventDate} has been received. We will call you shortly. - Peters Creation Catering`;
  return sendSMS(params.customerPhone, message);
}
async function sendBookingApproved2(params) {
  let message = `Hi ${params.customerName}, booking ${params.bookingReference} is APPROVED. To pay the deposit, please visit our website and enter code: ${params.bookingReference}. - Peters Catering`;
  return sendSMS(params.customerPhone, message);
}
async function sendDepositReceived(params) {
  const message = `Hi ${params.customerName}, update received for ${params.bookingReference}. Your date is secured. - Peters Catering`;
  return sendSMS(params.customerPhone, message);
}
async function sendBookingCancelled(params) {
  const message = `Hi ${params.customerName}, your reservation ${params.bookingReference} has been cancelled. Please contact us if you have questions or want to rebook. - Peters Creation Catering`;
  return sendSMS(params.customerPhone, message);
}
var IPROGSMS_API_TOKEN, IPROGSMS_API_URL, IPROGSMS_SENDER_NAME;
var init_sms = __esm({
  "server/sms.ts"() {
    "use strict";
    IPROGSMS_API_TOKEN = process.env.IPROGSMS_API_TOKEN;
    IPROGSMS_API_URL = "https://www.iprogsms.com/api/v1/sms_messages";
    IPROGSMS_SENDER_NAME = process.env.IPROGSMS_SENDER_NAME || "IPROGSMS";
  }
});

// server/paymongo.ts
import axios from "axios";
function getPaymongoApi() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Paymongo is not configured. PAYMONGO_SECRET_KEY is missing.");
  }
  if (!paymongoApi) {
    paymongoApi = axios.create({
      baseURL: "https://api.paymongo.com/v1",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(secretKey + ":").toString("base64")}`
      }
    });
  }
  return paymongoApi;
}
function isPaymongoConfigured() {
  return !!process.env.PAYMONGO_SECRET_KEY;
}
async function createCheckoutSession(params) {
  const {
    amount,
    description,
    bookingReference,
    customerEmail,
    customerName,
    customerPhone,
    paymentType,
    successUrl,
    cancelUrl
  } = params;
  try {
    const api = getPaymongoApi();
    const response = await api.post("/checkout_sessions", {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: "PHP",
              amount,
              // Paymongo expects amount in centavos
              description,
              name: `Catering ${paymentType === "deposit" ? "Deposit" : paymentType === "balance" ? "Balance Payment" : "Full Payment"}`,
              quantity: 1
            }
          ],
          payment_method_types: [
            "gcash",
            "paymaya",
            "card",
            "grab_pay",
            "billease"
          ],
          description: `${description} - Ref: ${bookingReference}`,
          reference_number: bookingReference,
          success_url: successUrl,
          cancel_url: cancelUrl,
          billing: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone || void 0
          },
          metadata: {
            booking_reference: bookingReference,
            payment_type: paymentType
          }
        }
      }
    });
    const checkoutData = response.data.data;
    return {
      id: checkoutData.id,
      checkoutUrl: checkoutData.attributes.checkout_url,
      paymentIntentId: checkoutData.attributes.payment_intent?.id || null,
      status: checkoutData.attributes.status
    };
  } catch (error) {
    console.error("Paymongo checkout session error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || "Failed to create checkout session");
  }
}
var paymongoApi;
var init_paymongo = __esm({
  "server/paymongo.ts"() {
    "use strict";
    paymongoApi = null;
  }
});

// server/routes/bookings.ts
function registerBookingRoutes(app2) {
  app2.get("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const bookings3 = await storage.getBookings();
      res.json(bookings3);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Error fetching bookings" });
    }
  });
  app2.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error fetching booking" });
    }
  });
  app2.get("/api/payment-methods", async (req, res) => {
    try {
      const methods = [];
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
      const settings = await storage.getPaymentSettings();
      settings.filter((s) => s.isActive).forEach((setting) => {
        if (setting.paymentMethod === "cash") {
          methods.push({
            id: "cash",
            name: "Cash Payment",
            description: setting.instructions || "Pay in cash at our office",
            icon: "banknote",
            type: "cash"
          });
        } else if (setting.paymentMethod.startsWith("bank_")) {
          methods.push({
            id: setting.paymentMethod,
            name: `Bank Transfer (${setting.paymentMethod.replace("bank_", "").toUpperCase()})`,
            description: setting.instructions || `Transfer to our ${setting.paymentMethod.replace("bank_", "").toUpperCase()} account`,
            icon: "building-2",
            type: "bank_transfer",
            details: {
              accountName: setting.accountName,
              accountNumber: setting.accountNumber,
              bankName: setting.paymentMethod.replace("bank_", "").toUpperCase()
            }
          });
        }
      });
      res.json(methods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Error fetching payment methods" });
    }
  });
  app2.get("/api/bookings/reference/:reference", async (req, res) => {
    try {
      const reference = req.params.reference;
      const booking = await storage.getBookingByReference(reference);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error fetching booking" });
    }
  });
  app2.get("/api/bookings/verify-payment/:reference", async (req, res) => {
    try {
      const reference = req.params.reference;
      const booking = await storage.getBookingByReference(reference);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (booking.depositPaid || booking.status === "deposit_paid" || booking.status === "confirmed") {
        return res.json({ success: true, status: booking.status });
      }
      const updatedBooking = await storage.updateBookingPayment(booking.id, {
        depositPaid: true,
        depositPaymentMethod: "gateway_redirect",
        depositPaymentReference: `REF-${Date.now()}`,
        depositPaidAt: /* @__PURE__ */ new Date(),
        paymentStatus: "deposit_paid",
        status: "deposit_paid"
      });
      if (autoCancelTimers.has(booking.id)) {
        clearTimeout(autoCancelTimers.get(booking.id));
        autoCancelTimers.delete(booking.id);
      }
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
      res.json({ success: true, status: "deposit_paid" });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Error verifying payment" });
    }
  });
  app2.post("/api/bookings", async (req, res) => {
    try {
      const { booking, customer, selectedDishes } = req.body;
      const bookingReference = `PCB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
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
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(400).json({
        message: "Invalid booking data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.patch("/api/bookings/:id/status", isAuthenticated, async (req, res) => {
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
        "cancelled"
      ];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      const updatedBooking = await storage.updateBookingStatus(id, status);
      if (status === "approved") {
        const deadlineIso = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
        let notes = {};
        try {
          notes = booking.adminNotes ? JSON.parse(booking.adminNotes) : {};
        } catch {
        }
        notes.autoCancelDeadline = deadlineIso;
        await storage.updateBookingPayment(id, { adminNotes: JSON.stringify(notes) });
        if (autoCancelTimers.has(id)) clearTimeout(autoCancelTimers.get(id));
        const t = setTimeout(async () => {
          try {
            const latest = await storage.getBooking(id);
            if (!latest || latest.status === "cancelled" || latest.depositPaid) return;
            await storage.updateBookingStatus(id, "cancelled");
            await sendBookingCancelled({
              customerPhone: latest.customer.phone || "",
              customerName: latest.customer.name,
              bookingReference: latest.bookingReference
            });
          } finally {
            autoCancelTimers.delete(id);
          }
        }, 24 * 60 * 60 * 1e3);
        autoCancelTimers.set(id, t);
        await sendBookingApproved2({
          customerPhone: booking.customer.phone || "",
          customerName: booking.customer.name,
          bookingReference: booking.bookingReference,
          depositAmount: booking.depositAmount || 0
        });
      } else if (["deposit_paid", "confirmed", "fully_paid", "cancelled", "completed"].includes(status)) {
        if (autoCancelTimers.has(id)) {
          clearTimeout(autoCancelTimers.get(id));
          autoCancelTimers.delete(id);
        }
        if (status === "deposit_paid") {
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
  app2.patch("/api/bookings/:id/reschedule", async (req, res) => {
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
  app2.get("/api/custom-quotes", isAuthenticated, async (req, res) => {
    try {
      const quotes = await storage.getCustomQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching custom quotes" });
    }
  });
  app2.get("/api/custom-quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getCustomQuote(id);
      if (!quote) return res.status(404).json({ message: "Quote not found" });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Error fetching custom quote" });
    }
  });
  app2.post("/api/custom-quotes", async (req, res) => {
    try {
      const { quote, customer } = req.body;
      const customerData = insertCustomerSchema.parse({ ...customer, company: customer.company || "" });
      const quoteData = {
        quoteReference: "",
        // Generated in storage
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
  app2.patch("/api/custom-quotes/:id/status", isAuthenticated, async (req, res) => {
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
  app2.post("/api/paymongo/webhook", async (req, res) => {
    try {
      const event = req.body;
      console.log("Paymongo webhook received:", event.data?.attributes?.type);
      const eventType = event.data?.attributes?.type;
      const eventData = event.data?.attributes?.data;
      if (eventType === "checkout_session.payment.paid" || eventType === "payment.paid") {
        const metadata = eventData?.attributes?.metadata || {};
        const bookingReference = metadata.booking_reference || eventData?.attributes?.reference_number;
        const paymentType = metadata.payment_type || "deposit";
        if (bookingReference) {
          const booking = await storage.getBookingByReference(bookingReference);
          if (booking) {
            const paymentDetails = eventData?.attributes;
            const paymentMethod = paymentDetails?.source?.type || "paymongo";
            const paymentId = eventData?.id;
            if (paymentType === "deposit") {
              await storage.updateBookingPayment(booking.id, {
                depositPaid: true,
                depositPaymentMethod: paymentMethod,
                depositPaymentReference: paymentId,
                depositPaidAt: /* @__PURE__ */ new Date(),
                paymentStatus: "deposit_paid",
                status: "deposit_paid"
              });
            } else {
              await storage.updateBookingPayment(booking.id, {
                depositPaid: true,
                balancePaid: true,
                depositPaymentMethod: paymentMethod,
                depositPaymentReference: paymentId,
                depositPaidAt: /* @__PURE__ */ new Date(),
                balancePaidAt: /* @__PURE__ */ new Date(),
                paymentStatus: "fully_paid",
                status: "confirmed"
              });
            }
            if (autoCancelTimers.has(booking.id)) {
              clearTimeout(autoCancelTimers.get(booking.id));
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
var autoCancelTimers;
var init_bookings = __esm({
  "server/routes/bookings.ts"() {
    "use strict";
    init_storage2();
    init_auth();
    init_schema();
    init_sms();
    init_paymongo();
    autoCancelTimers = /* @__PURE__ */ new Map();
  }
});

// server/routes/services.ts
import multer from "multer";
import path2 from "path";
import fs from "fs";
function registerServiceRoutes(app2) {
  app2.get("/api/services", async (req, res) => {
    try {
      const services2 = await storage.getServices();
      res.json(services2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services" });
    }
  });
  app2.post("/api/services", isAuthenticated, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ message: "Invalid service data" });
    }
  });
  app2.get("/api/dishes", async (req, res) => {
    try {
      const { category } = req.query;
      if (category && typeof category === "string") {
        const dishes2 = await storage.getDishesByCategory(category);
        res.json(dishes2);
      } else {
        const dishes2 = await storage.getDishes();
        res.json(dishes2);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching dishes" });
    }
  });
  app2.post("/api/dishes", isAuthenticated, async (req, res) => {
    try {
      const dishData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(dishData);
      res.status(201).json(dish);
    } catch (error) {
      res.status(400).json({ message: "Invalid dish data" });
    }
  });
  app2.get("/api/service-packages", async (req, res) => {
    try {
      const { serviceId } = req.query;
      if (serviceId && typeof serviceId === "string") {
        const packages = await storage.getServicePackagesByService(parseInt(serviceId));
        res.json(packages);
      } else {
        const packages = await storage.getServicePackages();
        res.json(packages);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching service packages" });
    }
  });
  app2.post("/api/service-packages", isAuthenticated, async (req, res) => {
    try {
      const packageData = insertServicePackageSchema.parse(req.body);
      const servicePackage = await storage.createServicePackage(packageData);
      res.status(201).json(servicePackage);
    } catch (error) {
      res.status(400).json({ message: "Invalid service package data" });
    }
  });
  app2.get("/api/add-ons", async (req, res) => {
    try {
      const { category } = req.query;
      if (category && typeof category === "string") {
        const addOns2 = await storage.getAddOnsByCategory(category);
        res.json(addOns2);
      } else {
        const addOns2 = await storage.getAddOns();
        res.json(addOns2);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching add-ons" });
    }
  });
  app2.post("/api/add-ons", isAuthenticated, async (req, res) => {
    try {
      const addOnData = insertAddOnSchema.parse(req.body);
      const addOn = await storage.createAddOn(addOnData);
      res.status(201).json(addOn);
    } catch (error) {
      res.status(400).json({ message: "Invalid add-on data" });
    }
  });
  const uploadDir = path2.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path2.extname(file.originalname));
      }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
  });
  app2.get("/api/gallery-images", async (req, res) => {
    try {
      const category = req.query.category;
      const images = category ? await storage.getGalleryImagesByCategory(category) : await storage.getGalleryImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Error fetching gallery images" });
    }
  });
  app2.post("/api/gallery-images", isAuthenticated, upload.array("images", 10), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) return res.status(400).json({ message: "No images uploaded" });
      const { title, description, category } = req.body;
      const uploadedImages = [];
      for (const file of files) {
        const image = await storage.createGalleryImage({
          title: title || file.originalname,
          description: description || "",
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          category: category || "general",
          isActive: true
        });
        uploadedImages.push(image);
      }
      res.status(201).json(uploadedImages);
    } catch (error) {
      res.status(400).json({ message: "Error uploading images" });
    }
  });
}
var init_services = __esm({
  "server/routes/services.ts"() {
    "use strict";
    init_storage2();
    init_auth();
    init_schema();
  }
});

// server/routes/admin.ts
function registerAdminRoutes(app2) {
  app2.get("/api/availability", async (req, res) => {
    try {
      const availabilities = await storage.getAvailabilities();
      res.json(availabilities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching availability" });
    }
  });
  app2.post("/api/availability", isAuthenticated, async (req, res) => {
    try {
      const data = insertAvailabilitySchema.parse(req.body);
      const availability2 = await storage.setAvailability(data);
      res.status(201).json(availability2);
    } catch (error) {
      res.status(400).json({ message: "Invalid availability data" });
    }
  });
  app2.get("/api/capacity-calendar", async (req, res) => {
    try {
      const capacity = await storage.getCapacityCalendar();
      res.json(capacity);
    } catch (error) {
      res.status(500).json({ message: "Error fetching capacity calendar" });
    }
  });
  app2.get("/api/recent-events", async (req, res) => {
    try {
      const events = await storage.getRecentEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent events" });
    }
  });
  app2.post("/api/recent-events", isAuthenticated, async (req, res) => {
    try {
      const eventData = insertRecentEventSchema.parse(req.body);
      const event = await storage.createRecentEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });
  app2.get("/api/paymongo/status", (req, res) => {
    res.json({
      configured: isPaymongoConfigured(),
      publicKey: process.env.PAYMONGO_PUBLIC_KEY ? "configured" : "missing"
    });
  });
  app2.post("/api/paymongo/create-checkout", async (req, res) => {
    try {
      const { bookingId, paymentType, successUrl, cancelUrl } = req.body;
      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      const amount = paymentType === "deposit" ? Math.round(booking.totalPrice * 0.5) : booking.totalPrice;
      const description = `${paymentType === "deposit" ? "Deposit" : "Full"} Payment for Catering Service`;
      if (!isPaymongoConfigured()) {
        const mockCheckoutUrl = `/mock-payment?bookingId=${booking.id}&amount=${amount}&paymentType=${paymentType}&ref=${booking.bookingReference}&successUrl=${encodeURIComponent(successUrl || "")}&cancelUrl=${encodeURIComponent(cancelUrl || "")}`;
        return res.json({ success: true, checkoutUrl: mockCheckoutUrl });
      }
      const checkoutSession = await createCheckoutSession({
        amount,
        // booking.totalPrice is already in centavos
        description,
        bookingReference: booking.bookingReference,
        customerEmail: booking.customer.email,
        customerName: booking.customer.name,
        customerPhone: booking.customer.phone || void 0,
        paymentType,
        successUrl: successUrl || `http://localhost:5000/payment-success?ref=${booking.bookingReference}`,
        cancelUrl: cancelUrl || `http://localhost:5000/payment-cancelled?ref=${booking.bookingReference}`
      });
      res.json({ success: true, checkoutUrl: checkoutSession.checkoutUrl });
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });
  app2.post("/api/mock-payment/process", async (req, res) => {
    try {
      const { bookingId, paymentType } = req.body;
      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (paymentType === "deposit") {
        await storage.updateBookingPayment(booking.id, {
          depositPaid: true,
          depositPaymentMethod: "mock_gateway",
          depositPaymentReference: `MOCK-${Date.now()}`,
          depositPaidAt: /* @__PURE__ */ new Date(),
          paymentStatus: "deposit_paid",
          status: "deposit_paid"
        });
      } else {
        await storage.updateBookingPayment(booking.id, {
          depositPaid: true,
          balancePaid: true,
          depositPaymentMethod: "mock_gateway",
          depositPaymentReference: `MOCK-${Date.now()}`,
          depositPaidAt: booking.depositPaidAt || /* @__PURE__ */ new Date(),
          balancePaidAt: /* @__PURE__ */ new Date(),
          paymentStatus: "fully_paid",
          status: "confirmed"
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to process mock payment" });
    }
  });
  app2.get("/api/sms/status", (req, res) => {
    res.json({ configured: isSMSConfigured() });
  });
  app2.post("/api/sms/booking-approved", isAuthenticated, async (req, res) => {
    try {
      const { bookingId, customerPhone, customerName, bookingReference, depositAmount } = req.body;
      const result = await sendBookingApproved({
        customerPhone,
        customerName,
        bookingReference,
        depositAmount
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/sms/payment-reminder", isAuthenticated, async (req, res) => {
    try {
      const { customerPhone, customerName, bookingReference, balanceAmount, eventDate, daysUntilEvent } = req.body;
      const result = await sendPaymentReminder({
        customerPhone,
        customerName,
        bookingReference,
        balanceAmount,
        eventDate,
        daysUntilEvent
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/sms/custom", isAuthenticated, async (req, res) => {
    try {
      const { bookingId, message } = req.body;
      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      const result = await sendCustomMessage({
        customerPhone: booking.customer.phone || "",
        message
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.get("/api/payment-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment settings" });
    }
  });
  app2.post("/api/payment-settings", isAuthenticated, async (req, res) => {
    try {
      const settingData = insertPaymentSettingSchema.parse(req.body);
      const setting = await storage.upsertPaymentSetting(settingData);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ message: error.message || "Invalid payment setting data" });
    }
  });
}
var init_admin = __esm({
  "server/routes/admin.ts"() {
    "use strict";
    init_storage2();
    init_auth();
    init_schema();
    init_paymongo();
    init_sms();
  }
});

// server/routes/index.ts
import { createServer } from "http";
async function registerRoutes(app2) {
  registerAuthRoutes(app2);
  registerBookingRoutes(app2);
  registerServiceRoutes(app2);
  registerAdminRoutes(app2);
  const httpServer = createServer(app2);
  return httpServer;
}
var init_routes = __esm({
  "server/routes/index.ts"() {
    "use strict";
    init_auth2();
    init_bookings();
    init_services();
    init_admin();
  }
});

// server/routes.ts
var routes_exports = {};
__export(routes_exports, {
  registerRoutes: () => registerRoutes
});
var init_routes2 = __esm({
  "server/routes.ts"() {
    "use strict";
    init_routes();
  }
});

// server/index.prod.ts
import "dotenv/config";
import express from "express";
import path3 from "path";
import fs2 from "fs";

// server/initDatabase.ts
init_db();
async function initializeDatabase() {
  if (!pool) {
    console.warn("Database pool is null, skipping initialization (running in in-memory mode)");
    return;
  }
  const client = await pool.connect();
  try {
    await client.query(`
      -- Capacity calendar for daily booking limits
      CREATE TABLE IF NOT EXISTS capacity_calendar (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        day_type TEXT NOT NULL DEFAULT 'normal',
        max_slots INTEGER NOT NULL DEFAULT 7,
        booked_slots INTEGER NOT NULL DEFAULT 0,
        notes TEXT
      );

      -- Session table for connect-pg-simple
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      );
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
          ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

      -- Dishes/Menu items for package selection
      CREATE TABLE IF NOT EXISTS dishes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        tags TEXT[],
        image_url TEXT,
        additional_cost INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0
      );

      -- Add-ons/Extra services
      CREATE TABLE IF NOT EXISTS add_ons (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price_type TEXT NOT NULL DEFAULT 'fixed',
        price INTEGER NOT NULL,
        min_quantity INTEGER DEFAULT 1,
        max_quantity INTEGER,
        is_available BOOLEAN DEFAULT true
      );

      -- Custom quote requests (depends on customers table)
      CREATE TABLE IF NOT EXISTS custom_quotes (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        quote_reference TEXT NOT NULL UNIQUE,
        event_date DATE NOT NULL,
        event_time TEXT NOT NULL,
        event_type TEXT NOT NULL,
        guest_count INTEGER NOT NULL,
        venue_address TEXT NOT NULL,
        budget INTEGER,
        preferences TEXT,
        special_requests TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        proposed_package TEXT,
        proposed_price INTEGER,
        deposit_amount INTEGER,
        admin_notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Package dishes junction table
      CREATE TABLE IF NOT EXISTS package_dishes (
        package_id INTEGER NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
        dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
        is_required BOOLEAN DEFAULT false,
        max_selections INTEGER DEFAULT 1,
        PRIMARY KEY (package_id, dish_id)
      );

      -- Booking dishes (selected dishes for a booking)
      CREATE TABLE IF NOT EXISTS booking_dishes (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        dish_id INTEGER NOT NULL REFERENCES dishes(id),
        quantity INTEGER DEFAULT 1
      );

      -- Booking add-ons (selected add-ons for a booking)
      CREATE TABLE IF NOT EXISTS booking_add_ons (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        add_on_id INTEGER NOT NULL REFERENCES add_ons(id),
        quantity INTEGER DEFAULT 1,
        total_price INTEGER NOT NULL
      );

      -- Add new columns to bookings table if they don't exist
      DO $$ 
      BEGIN
        -- Service Packages new columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'has_themed_cake') THEN
          ALTER TABLE service_packages ADD COLUMN has_themed_cake BOOLEAN DEFAULT false;
        END IF;

        -- Bookings new columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'theme') THEN
          ALTER TABLE bookings ADD COLUMN theme TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'package_id') THEN
          ALTER TABLE bookings ADD COLUMN package_id INTEGER REFERENCES service_packages(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'event_duration') THEN
          ALTER TABLE bookings ADD COLUMN event_duration INTEGER DEFAULT 4;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_amount') THEN
          ALTER TABLE bookings ADD COLUMN deposit_amount INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_paid') THEN
          ALTER TABLE bookings ADD COLUMN deposit_paid BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_payment_method') THEN
          ALTER TABLE bookings ADD COLUMN deposit_payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_payment_reference') THEN
          ALTER TABLE bookings ADD COLUMN deposit_payment_reference TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_paid_at') THEN
          ALTER TABLE bookings ADD COLUMN deposit_paid_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_amount') THEN
          ALTER TABLE bookings ADD COLUMN balance_amount INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_paid') THEN
          ALTER TABLE bookings ADD COLUMN balance_paid BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_payment_method') THEN
          ALTER TABLE bookings ADD COLUMN balance_payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_payment_reference') THEN
          ALTER TABLE bookings ADD COLUMN balance_payment_reference TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_paid_at') THEN
          ALTER TABLE bookings ADD COLUMN balance_paid_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'admin_notes') THEN
          ALTER TABLE bookings ADD COLUMN admin_notes TEXT;
        END IF;
      END $$;
    `);
    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// server/seed.ts
init_db();
init_schema();
import { hash } from "bcrypt";
import { sql } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
async function seed() {
  if (!db) {
    console.log("\u26A0\uFE0F Database connection not available, skipping seeding.");
    return;
  }
  console.log("\u{1F331} Seeding database...");
  const hashedPassword = await hash("admin", 10);
  const adminExists = await db.select().from(users).where(sql`${users.username} = 'admin'`);
  if (adminExists.length === 0) {
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      role: "admin",
      email: "admin@peterscreation.com"
    });
    console.log("Created admin user");
  } else {
    console.log("Admin user already exists");
  }
  const servicesCount = await db.select().from(services);
  if (servicesCount.length === 0) {
    await db.insert(services).values([
      {
        name: "Wedding Receptions",
        description: "Make your special day unforgettable with our complete wedding catering service. Includes formal setup, decorations, and premium menu options.",
        imageUrl: "https://images.unsplash.com/photo-1529636798458-92182e662485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80",
        basePrice: 15e4,
        // ₱1,500 per person
        featured: true
      },
      {
        name: "Corporate Events",
        description: "Impress your clients and colleagues with professional catering for meetings, conferences, and corporate gatherings. Includes setup and service staff.",
        imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80",
        basePrice: 1e5,
        // ₱1,000 per person
        featured: true
      },
      {
        name: "Birthday Celebrations",
        description: "Create lasting memories with custom birthday catering packages tailored to your theme and preferences. Perfect for milestone celebrations.",
        imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=936&q=80",
        basePrice: 8e4,
        // ₱800 per person
        featured: false
      },
      {
        name: "Graduation Parties",
        description: "Celebrate academic achievements with our graduation catering packages. From finger foods to full-course meals, we'll help make your grad party memorable.",
        imageUrl: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        basePrice: 75e3,
        // ₱750 per person
        featured: false
      },
      {
        name: "Holiday Gatherings",
        description: "Enjoy time with loved ones and let us handle the food. Special holiday menus available for Christmas, New Year, and other seasonal celebrations.",
        imageUrl: "https://images.unsplash.com/photo-1543353071-087092ec393a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        basePrice: 9e4,
        // ₱900 per person
        featured: true
      },
      {
        name: "Private Dinners",
        description: "Enjoy a restaurant-quality experience in your home with our personal chef service. Perfect for intimate gatherings and special occasions.",
        imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        basePrice: 12e4,
        // ₱1,200 per person
        featured: false
      }
    ]);
    console.log("Created initial services");
  } else {
    console.log(`Services already exist (${servicesCount.length} found)`);
  }
  const availabilityCount = await db.select().from(availability);
  if (availabilityCount.length === 0) {
    const today = /* @__PURE__ */ new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const unavailableDates = [
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20)
    ];
    for (const date2 of unavailableDates) {
      await db.insert(availability).values({
        date: date2.toISOString().split("T")[0],
        isAvailable: false,
        notes: "Booked for another event"
      });
    }
    console.log("Created initial availability settings");
  } else {
    console.log(`Availability settings already exist (${availabilityCount.length} found)`);
  }
  const recentEventsCount = await db.select().from(recentEvents);
  if (recentEventsCount.length === 0) {
    await db.insert(recentEvents).values([
      {
        title: "Martinez Wedding Reception",
        description: "A beautiful garden wedding reception for 150 guests featuring Filipino and Spanish fusion cuisine. The event included a full buffet setup with live cooking stations, elegant table settings, and custom floral arrangements.",
        eventType: "Wedding",
        eventDate: "2024-01-15",
        venue: "The Grand Venue Brgy. Atiplo",
        guestCount: 150,
        imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        highlights: ["Live cooking stations", "Custom floral arrangements", "Filipino-Spanish fusion menu", "Professional service staff"],
        featured: true
      },
      {
        title: "TechCorp Annual Conference",
        description: "Corporate catering for a 3-day technology conference with 200 attendees. Provided breakfast, lunch, and coffee breaks with modern presentation and networking-friendly menu options.",
        eventType: "Corporate",
        eventDate: "2024-02-22",
        venue: "Metro Manila Convention Center",
        guestCount: 200,
        imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        highlights: ["3-day conference catering", "Modern presentation", "Networking-friendly menu", "Coffee break stations"],
        featured: true
      },
      {
        title: "Golden Anniversary Celebration",
        description: "50th wedding anniversary celebration for the Santos family with traditional Filipino dishes and a nostalgic menu featuring classic recipes. The intimate gathering celebrated five decades of love.",
        eventType: "Anniversary",
        eventDate: "2024-03-10",
        venue: "Private Residence, Quezon City",
        guestCount: 80,
        imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        highlights: ["Traditional Filipino dishes", "Nostalgic classic recipes", "Intimate family gathering", "50th anniversary celebration"],
        featured: false
      },
      {
        title: "University Graduation Party",
        description: "Graduation celebration for batch 2024 Engineering students with 120 guests. Featured a modern buffet setup with international cuisine and interactive food stations for a memorable celebration.",
        eventType: "Graduation",
        eventDate: "2024-04-05",
        venue: "University of the Philippines Diliman",
        guestCount: 120,
        imageUrl: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        highlights: ["Modern buffet setup", "International cuisine", "Interactive food stations", "Graduation celebration"],
        featured: true
      },
      {
        title: "Christmas Holiday Gathering",
        description: "Corporate Christmas party for ABCD Company with 180 employees and their families. Featured traditional holiday menu with lechon, ham, and Christmas specialties in a festive atmosphere.",
        eventType: "Holiday",
        eventDate: "2023-12-20",
        venue: "ABCD Company Headquarters",
        guestCount: 180,
        imageUrl: "https://images.unsplash.com/photo-1543353071-087092ec393a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        highlights: ["Traditional holiday menu", "Lechon and ham centerpieces", "Christmas specialties", "Festive family atmosphere"],
        featured: false
      },
      {
        title: "Private Birthday Dinner",
        description: "Elegant 60th birthday celebration with a curated fine dining experience for 40 guests. Multi-course plated dinner with wine pairing and personalized service in an upscale home setting.",
        eventType: "Birthday",
        eventDate: "2024-05-18",
        venue: "Private Residence, Makati City",
        guestCount: 40,
        imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        highlights: ["Fine dining experience", "Multi-course plated dinner", "Wine pairing", "Personalized service"],
        featured: true
      }
    ]);
    console.log("Created sample recent events");
  } else {
    console.log(`Recent events already exist (${recentEventsCount.length} found)`);
  }
  const dishesCount = await db.select().from(dishes);
  let createdDishes = [];
  if (dishesCount.length === 0) {
    createdDishes = await db.insert(dishes).values([
      { name: "Crispy Pork Belly (Lechon Kawali)", description: "Deep-fried pork belly, crispy on the outside, tender on the inside.", category: "main", tags: ["pork", "filipino", "popular"], additionalCost: 0 },
      { name: "Beef Kare-Kare", description: "Oxtail and tripe peanut stew with vegetables.", category: "main", tags: ["beef", "filipino", "peanut"], additionalCost: 5e3 },
      { name: "Chicken Cordon Bleu", description: "Breaded chicken breast stuffed with ham and cheese.", category: "main", tags: ["chicken", "western"], additionalCost: 0 },
      { name: "Pancit Canton", description: "Stir-fried egg noodles with vegetables, pork, and shrimp.", category: "side", tags: ["noodles", "filipino"], additionalCost: 0 },
      { name: "Lumpia Shanghai", description: "Mini meat spring rolls served with sweet and sour sauce.", category: "appetizer", tags: ["pork", "popular", "finger-food"], additionalCost: 0 },
      { name: "Buko Pandan", description: "Young coconut and pandan jelly in sweetened cream.", category: "dessert", tags: ["sweet", "filipino", "popular"], additionalCost: 0 },
      { name: "Leche Flan", description: "Rich caramel custard dessert.", category: "dessert", tags: ["sweet", "filipino"], additionalCost: 0 },
      { name: "Bottomless Iced Tea", description: "House blend sweet iced tea.", category: "beverage", tags: ["cold", "refreshing"], additionalCost: 0 }
    ]).returning();
    console.log("Created sample dishes");
  } else {
    console.log(`Dishes already exist (${dishesCount.length} found)`);
    createdDishes = dishesCount;
  }
  const packagesCount = await db.select().from(servicePackages);
  if (packagesCount.length === 0) {
    const allServices = await db.select().from(services);
    const weddingService = allServices.find((s) => s.name === "Wedding Receptions");
    if (weddingService) {
      const createdPackages = await db.insert(servicePackages).values([
        {
          serviceId: weddingService.id,
          name: "Silver Wedding Package",
          description: "Essential catering package perfect for intimate weddings.",
          pricePerPerson: 85e3,
          // ₱850
          minGuests: 50,
          features: ["Choice of 2 main dishes", "1 appetizer", "1 dessert", "Bottomless Iced Tea", "Basic table setup"],
          hasThemedCake: false
        },
        {
          serviceId: weddingService.id,
          name: "Gold Wedding Package",
          description: "Our most popular package with premium dish selections and elegant setup.",
          pricePerPerson: 12e4,
          // ₱1,200
          minGuests: 100,
          features: ["Choice of 3 main dishes", "2 appetizers", "2 desserts", "Premium beverage station", "Elegant table setup", "Basic floral centerpiece"],
          hasThemedCake: true
        }
      ]).returning();
      console.log("Created sample packages");
      if (createdPackages.length > 0 && createdDishes.length > 0) {
        const pdRelations = [];
        for (const pkg of createdPackages) {
          for (let i = 0; i < Math.min(6, createdDishes.length); i++) {
            pdRelations.push({
              packageId: pkg.id,
              dishId: createdDishes[i].id,
              isRequired: false,
              maxSelections: 1
            });
          }
        }
        await db.insert(packageDishes).values(pdRelations);
        console.log("Assigned dishes to packages");
      }
    }
  } else {
    console.log(`Packages already exist (${packagesCount.length} found)`);
  }
  const addOnsCount = await db.select().from(addOns);
  if (addOnsCount.length === 0) {
    await db.insert(addOns).values([
      { name: "Chocolate Fountain", description: "3-tier chocolate fountain with fruits and marshmallows", category: "service", priceType: "fixed", price: 5e5 },
      { name: "Extra Waiter", description: "Additional serving staff for your event", category: "service", priceType: "fixed", price: 15e4 },
      { name: "Tiffany Chairs Upgrade", description: "Upgrade standard chairs to elegant Tiffany chairs", category: "equipment", priceType: "per_person", price: 1e4 }
    ]);
    console.log("Created sample add-ons");
  } else {
    console.log(`Add-ons already exist (${addOnsCount.length} found)`);
  }
  console.log("\u2705 Database seeded successfully");
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  seed().catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  }).finally(() => {
    process.exit(0);
  });
}

// server/index.prod.ts
import session from "express-session";
import createMemoryStore from "memorystore";
var MemoryStore = createMemoryStore(session);
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(async (req, res, next) => {
  try {
    await serverPromise;
    next();
  } catch (error) {
    next(error);
  }
});
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function startServer() {
  const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
  const { setupAuthentication: setupAuthentication2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
  const { registerRoutes: registerRoutes2 } = await Promise.resolve().then(() => (init_routes2(), routes_exports));
  let PostgresStore;
  const ConnectPg = (await import("connect-pg-simple")).default;
  PostgresStore = ConnectPg(session);
  try {
    console.log("Initializing database...");
    await initializeDatabase();
    await seed();
    console.log("Database initialization complete.");
  } catch (error) {
    console.error("Failed to initialize or seed database:", error);
  }
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "peters-catering-secret",
    resave: false,
    saveUninitialized: false,
    store: pool2 ? new PostgresStore({
      pool: pool2,
      tableName: "session",
      createTableIfMissing: true
    }) : new MemoryStore({
      checkPeriod: 864e5
    }),
    cookie: {
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  setupAuthentication2(app);
  const server = await registerRoutes2(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  const distPath = path3.resolve(process.cwd(), "dist");
  if (fs2.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path3.resolve(distPath, "index.html"));
    });
  } else {
    console.log("dist/ not found - static serving disabled");
  }
  return server;
}
var serverPromise = startServer();
var index_prod_default = app;
export {
  index_prod_default as default
};
