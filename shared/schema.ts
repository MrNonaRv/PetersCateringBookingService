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

// Catering services offered
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  basePrice: integer("base_price").notNull(), // price per person in cents
  featured: boolean("featured").default(false),
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
  eventDate: date("event_date").notNull(),
  eventType: text("event_type").notNull(),
  eventTime: text("event_time").notNull(),
  guestCount: integer("guest_count").notNull(),
  venueAddress: text("venue_address").notNull(),
  menuPreference: text("menu_preference").notNull(),
  serviceStyle: text("service_style").notNull(),
  additionalServices: text("additional_services"),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  totalPrice: integer("total_price").notNull(), // in cents
  paymentMethod: text("payment_method"), // gcash, paymaya, bank_transfer, cash
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  paymentReference: text("payment_reference"), // transaction reference from payment provider
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
}));

// Combined booking with customer data
export type BookingWithCustomer = Booking & {
  customer: Customer;
  service: Service;
};
