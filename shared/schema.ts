import { pgTable, text, serial, integer, boolean, date, timestamp, json, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for admin and staff access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("staff"), // 'admin' or 'staff'
  email: text("email").notNull(),
  phone: text("phone"),
});

// Capacity calendar for daily booking limits
export const capacityCalendar = pgTable("capacity_calendar", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  dayType: text("day_type").notNull().default("normal"), // 'normal', 'peak', 'closed'
  maxSlots: integer("max_slots").notNull().default(7), // 7 normal, 10 peak, 0 closed
  bookedSlots: integer("booked_slots").notNull().default(0),
  notes: text("notes"),
});

// Dishes/Menu items for package selection
export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'appetizer', 'main', 'dessert', 'beverage', 'side'
  tags: text("tags").array(), // e.g., ['vegetarian', 'spicy', 'popular']
  imageUrl: text("image_url"),
  additionalCost: integer("additional_cost").default(0), // in cents, for premium items
  isAvailable: boolean("is_available").default(true),
  sortOrder: integer("sort_order").default(0),
});

// Add-ons/Extra services
export const addOns = pgTable("add_ons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'equipment', 'service', 'decoration', 'entertainment'
  priceType: text("price_type").notNull().default("fixed"), // 'fixed', 'per_person', 'per_hour'
  price: integer("price").notNull(), // in cents
  minQuantity: integer("min_quantity").default(1),
  maxQuantity: integer("max_quantity"),
  isAvailable: boolean("is_available").default(true),
});

// Venues table
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  capacityMin: integer("capacity_min").default(0),
  capacityMax: integer("capacity_max"),
  price: integer("price").notNull(), // in cents
  type: text("type").notNull().default("venue"), // 'venue', 'room', etc.
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true),
});

// Custom quote requests
export const customQuotes = pgTable("custom_quotes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  quoteReference: text("quote_reference").notNull().unique(),
  eventDate: date("event_date").notNull(),
  eventTime: text("event_time").notNull(),
  eventType: text("event_type").notNull(),
  guestCount: integer("guest_count").notNull(),
  venueAddress: text("venue_address").notNull(),
  budget: integer("budget"), // in cents, customer's budget range
  theme: text("theme"),
  description: text("description"), // Client's description of the event
  preferences: text("preferences"), // dietary preferences, cuisine style
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("new"), // 'new', 'quote_sent', 'accepted', 'revision_requested', 'rejected', 'approved', 'deposit_paid'
  proposedPackage: text("proposed_package"), // JSON string of proposed menu/package
  proposedPrice: integer("proposed_price"), // in cents
  depositAmount: integer("deposit_amount"), // in cents
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Package dishes junction table
export const packageDishes = pgTable("package_dishes", {
  packageId: integer("package_id").notNull().references(() => servicePackages.id, { onDelete: 'cascade' }),
  dishId: integer("dish_id").notNull().references(() => dishes.id, { onDelete: 'cascade' }),
  isRequired: boolean("is_required").default(false),
  maxSelections: integer("max_selections").default(1),
}, (t) => ({
  pk: primaryKey({ columns: [t.packageId, t.dishId] })
}));

// Booking dishes (selected dishes for a booking)
export const bookingDishes = pgTable("booking_dishes", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  dishId: integer("dish_id").notNull().references(() => dishes.id),
  quantity: integer("quantity").default(1),
});

// Booking add-ons (selected add-ons for a booking)
export const bookingAddOns = pgTable("booking_add_ons", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  addOnId: integer("add_on_id").notNull().references(() => addOns.id),
  quantity: integer("quantity").default(1),
  totalPrice: integer("total_price").notNull(), // calculated price for this add-on
});

// Catering services offered
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  basePrice: integer("base_price").notNull(), // price per person in cents
  featured: boolean("featured").default(false),
  isActive: boolean("is_active").default(true),
});

// Service packages for each service
export const servicePackages = pgTable("service_packages", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  name: text("name").notNull(), // e.g., "Basic Package", "Premium Package"
  description: text("description").notNull(),
  pricePerPerson: integer("price_per_person").notNull(), // in cents
  minGuests: integer("min_guests").notNull().default(10),
  maxGuests: integer("max_guests"), // null = no limit
  features: text("features").array(), // array of features included
  hasThemedCake: boolean("has_themed_cake").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // for ordering packages
});

// Settings for date availability
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  isAvailable: boolean("is_available").default(true),
  notes: text("notes"),
});

// Customer information
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
});

// Customer bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  bookingReference: text("booking_reference").notNull().unique(),
  serviceId: integer("service_id").notNull().references(() => services.id),
  packageId: integer("package_id").references(() => servicePackages.id),
  eventDate: date("event_date").notNull(),
  eventType: text("event_type").notNull(),
  eventTime: text("event_time").notNull(),
  eventDuration: integer("event_duration").default(4), // in hours
  guestCount: integer("guest_count").notNull(),
  venueAddress: text("venue_address").notNull(),
  menuPreference: text("menu_preference").notNull(),
  serviceStyle: text("service_style").notNull(),
  additionalServices: text("additional_services"),
  theme: text("theme"), // Theme for the cake or event if applicable
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("pending_approval"), // pending_approval, approved, deposit_paid, fully_paid, confirmed, completed, cancelled
  totalPrice: integer("total_price").notNull(), // in cents
  depositAmount: integer("deposit_amount").default(0), // in cents (typically 50% of total)
  depositPaid: boolean("deposit_paid").default(false),
  depositPaymentMethod: text("deposit_payment_method"), // gcash, paymaya, bank_transfer
  depositPaymentReference: text("deposit_payment_reference"),
  depositPaidAt: timestamp("deposit_paid_at"),
  balanceAmount: integer("balance_amount").default(0), // remaining balance in cents
  balancePaid: boolean("balance_paid").default(false),
  balancePaymentMethod: text("balance_payment_method"),
  balancePaymentReference: text("balance_payment_reference"),
  balancePaidAt: timestamp("balance_paid_at"),
  paymentMethod: text("payment_method"), // gcash, paymaya, bank_transfer, cash (legacy)
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, deposit_paid, fully_paid, failed
  paymentReference: text("payment_reference"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Recent events showcase
export const recentEvents = pgTable("recent_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: date("event_date").notNull(),
  venue: text("venue").notNull(),
  guestCount: integer("guest_count").notNull(),
  imageUrl: text("image_url").notNull(),
  highlights: text("highlights").array(), // array of highlight features
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment account settings
export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  paymentMethod: text("payment_method").notNull().unique(), // gcash, paymaya, bank_bdo, bank_bpi, etc.
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  isActive: boolean("is_active").default(true),
  instructions: text("instructions"), // Additional payment instructions
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Gallery images for Peter's creations
export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  category: text("category").default("general").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  email: true,
  phone: true,
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  description: true,
  imageUrl: true,
  basePrice: true,
  featured: true,
  isActive: true,
});

export const insertServicePackageSchema = createInsertSchema(servicePackages).omit({
  id: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).pick({
  date: true,
  isAvailable: true,
  notes: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
});

export const insertRecentEventSchema = createInsertSchema(recentEvents).omit({
  id: true,
  createdAt: true,
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
});

export const insertCapacityCalendarSchema = createInsertSchema(capacityCalendar).omit({
  id: true,
});

export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
});

export const insertAddOnSchema = createInsertSchema(addOns).omit({
  id: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
});

export const insertCustomQuoteSchema = createInsertSchema(customQuotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPackageDishSchema = createInsertSchema(packageDishes);

export const insertBookingDishSchema = createInsertSchema(bookingDishes).omit({
  id: true,
});

export const insertBookingAddOnSchema = createInsertSchema(bookingAddOns).omit({
  id: true,
});

export const insertPaymentSettingSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertServicePackage = z.infer<typeof insertServicePackageSchema>;
export type ServicePackage = typeof servicePackages.$inferSelect;

export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertRecentEvent = z.infer<typeof insertRecentEventSchema>;
export type RecentEvent = typeof recentEvents.$inferSelect;

export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;

export type InsertCapacityCalendar = z.infer<typeof insertCapacityCalendarSchema>;
export type CapacityCalendar = typeof capacityCalendar.$inferSelect;

export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishes.$inferSelect;

export type InsertAddOn = z.infer<typeof insertAddOnSchema>;
export type AddOn = typeof addOns.$inferSelect;

export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venues.$inferSelect;

export type InsertCustomQuote = z.infer<typeof insertCustomQuoteSchema>;
export type CustomQuote = typeof customQuotes.$inferSelect;

export type InsertPackageDish = z.infer<typeof insertPackageDishSchema>;
export type PackageDish = typeof packageDishes.$inferSelect;

export type InsertBookingDish = z.infer<typeof insertBookingDishSchema>;
export type BookingDish = typeof bookingDishes.$inferSelect;

export type InsertBookingAddOn = z.infer<typeof insertBookingAddOnSchema>;
export type BookingAddOn = typeof bookingAddOns.$inferSelect;

export type InsertPaymentSetting = z.infer<typeof insertPaymentSettingSchema>;
export type PaymentSetting = typeof paymentSettings.$inferSelect;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  bookings: many(bookings),
  packages: many(servicePackages),
}));

export const servicePackagesRelations = relations(servicePackages, ({ one }) => ({
  service: one(services, {
    fields: [servicePackages.serviceId],
    references: [services.id],
  }),
}));

export const recentEventsRelations = relations(recentEvents, ({ }) => ({}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  bookings: many(bookings),
  customQuotes: many(customQuotes),
}));

export const dishesRelations = relations(dishes, ({ many }) => ({
  packageDishes: many(packageDishes),
  bookingDishes: many(bookingDishes),
}));

export const addOnsRelations = relations(addOns, ({ many }) => ({
  bookingAddOns: many(bookingAddOns),
}));

export const customQuotesRelations = relations(customQuotes, ({ one }) => ({
  customer: one(customers, {
    fields: [customQuotes.customerId],
    references: [customers.id],
  }),
}));

export const packageDishesRelations = relations(packageDishes, ({ one }) => ({
  package: one(servicePackages, {
    fields: [packageDishes.packageId],
    references: [servicePackages.id],
  }),
  dish: one(dishes, {
    fields: [packageDishes.dishId],
    references: [dishes.id],
  }),
}));

export const bookingDishesRelations = relations(bookingDishes, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingDishes.bookingId],
    references: [bookings.id],
  }),
  dish: one(dishes, {
    fields: [bookingDishes.dishId],
    references: [dishes.id],
  }),
}));

export const bookingAddOnsRelations = relations(bookingAddOns, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingAddOns.bookingId],
    references: [bookings.id],
  }),
  addOn: one(addOns, {
    fields: [bookingAddOns.addOnId],
    references: [addOns.id],
  }),
}));

// Combined booking with customer data
export type BookingWithCustomer = Booking & {
  customer: Customer;
  service: Service | null;
  package?: ServicePackage | null;
  venue?: Venue | null;
  selectedDishes?: (Dish & { quantity: number })[];
};

// Combined quote with customer data
export type CustomQuoteWithCustomer = CustomQuote & {
  customer: Customer;
};
