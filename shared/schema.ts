import { pgTable, text, serial, integer, boolean, date, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Settings for date availability
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  isAvailable: boolean("is_available").default(true),
  notes: text("notes"),
});

// Customer bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingReference: text("booking_reference").notNull().unique(),
  serviceId: integer("service_id").notNull(),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customer information
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Combined booking with customer data
export type BookingWithCustomer = Booking & {
  customer: Customer;
  service: Service;
};
