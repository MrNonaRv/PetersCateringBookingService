import { 
  users, type User, type InsertUser,
  services, type Service, type InsertService,
  availability, type Availability, type InsertAvailability,
  bookings, type Booking, type InsertBooking,
  customers, type Customer, type InsertCustomer,
  type BookingWithCustomer
} from "@shared/schema";

// Storage interface with CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Service operations
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Availability operations
  getAvailabilities(): Promise<Availability[]>;
  getAvailability(date: string): Promise<Availability | undefined>;
  setAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: number, availability: Partial<InsertAvailability>): Promise<Availability | undefined>;
  
  // Booking operations
  getBookings(): Promise<BookingWithCustomer[]>;
  getBooking(id: number): Promise<BookingWithCustomer | undefined>;
  getBookingByReference(reference: string): Promise<BookingWithCustomer | undefined>;
  createBooking(booking: InsertBooking, customer: InsertCustomer): Promise<BookingWithCustomer>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  
  // Customer operations
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private availabilities: Map<number, Availability>;
  private bookings: Map<number, Booking>;
  private customers: Map<number, Customer>;
  private currentIds: {
    user: number;
    service: number;
    availability: number;
    booking: number;
    customer: number;
  };

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.availabilities = new Map();
    this.bookings = new Map();
    this.customers = new Map();
    this.currentIds = {
      user: 1,
      service: 1,
      availability: 1,
      booking: 1,
      customer: 1
    };

    // Initialize with an admin user
    this.createUser({
      username: "admin",
      password: "password123", // In a real app, this would be hashed
      name: "Admin User",
      role: "admin",
      email: "admin@peterscreation.com",
      phone: "555-123-4567"
    });

    // Initialize with sample catering services
    this.initializeServices();
    
    // Initialize with availability for the next 60 days
    this.initializeAvailability();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentIds.service++;
    const service: Service = { ...insertService, id };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: number, serviceUpdate: Partial<InsertService>): Promise<Service | undefined> {
    const existingService = this.services.get(id);
    if (!existingService) return undefined;

    const updatedService = { ...existingService, ...serviceUpdate };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Availability operations
  async getAvailabilities(): Promise<Availability[]> {
    return Array.from(this.availabilities.values());
  }

  async getAvailability(dateStr: string): Promise<Availability | undefined> {
    return Array.from(this.availabilities.values()).find(
      (avail) => avail.date.toString() === dateStr
    );
  }

  async setAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    // Check if availability for this date already exists
    const existingAvail = await this.getAvailability(insertAvailability.date.toString());
    
    if (existingAvail) {
      // Update existing
      existingAvail.isAvailable = insertAvailability.isAvailable;
      existingAvail.notes = insertAvailability.notes;
      this.availabilities.set(existingAvail.id, existingAvail);
      return existingAvail;
    } else {
      // Create new
      const id = this.currentIds.availability++;
      const availability: Availability = { ...insertAvailability, id };
      this.availabilities.set(id, availability);
      return availability;
    }
  }

  async updateAvailability(id: number, availabilityUpdate: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const existingAvailability = this.availabilities.get(id);
    if (!existingAvailability) return undefined;

    const updatedAvailability = { ...existingAvailability, ...availabilityUpdate };
    this.availabilities.set(id, updatedAvailability);
    return updatedAvailability;
  }

  // Booking operations
  async getBookings(): Promise<BookingWithCustomer[]> {
    return Array.from(this.bookings.values()).map(booking => {
      const customer = this.getCustomerByBookingId(booking.id);
      const service = this.services.get(booking.serviceId);
      return { 
        ...booking, 
        customer: customer as Customer,
        service: service as Service 
      };
    });
  }

  async getBooking(id: number): Promise<BookingWithCustomer | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const customer = this.getCustomerByBookingId(id);
    const service = this.services.get(booking.serviceId);
    
    return { 
      ...booking, 
      customer: customer as Customer,
      service: service as Service 
    };
  }

  async getBookingByReference(reference: string): Promise<BookingWithCustomer | undefined> {
    const booking = Array.from(this.bookings.values()).find(
      (b) => b.bookingReference === reference
    );
    if (!booking) return undefined;

    const customer = this.getCustomerByBookingId(booking.id);
    const service = this.services.get(booking.serviceId);
    
    return { 
      ...booking, 
      customer: customer as Customer,
      service: service as Service 
    };
  }

  async createBooking(insertBooking: InsertBooking, insertCustomer: InsertCustomer): Promise<BookingWithCustomer> {
    // Create booking
    const bookingId = this.currentIds.booking++;
    const bookingReference = `PCC-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const booking: Booking = { 
      ...insertBooking, 
      id: bookingId,
      bookingReference,
      createdAt: new Date()
    };
    
    this.bookings.set(bookingId, booking);
    
    // Create customer
    const customerId = this.currentIds.customer++;
    const customer: Customer = { 
      ...insertCustomer, 
      id: customerId,
      bookingId
    };
    
    this.customers.set(customerId, customer);
    
    const service = this.services.get(booking.serviceId) as Service;
    
    return { 
      ...booking, 
      customer,
      service
    };
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    booking.status = status;
    this.bookings.set(id, booking);
    return booking;
  }

  // Customer operations
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.email === email
    );
  }

  // Helper methods
  private getCustomerByBookingId(bookingId: number): Customer | undefined {
    return Array.from(this.customers.values()).find(
      (customer) => customer.bookingId === bookingId
    );
  }

  private initializeServices(): void {
    // Wedding Receptions
    this.createService({
      name: "Wedding Receptions",
      description: "Make your special day unforgettable with our premium wedding catering services.",
      imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      basePrice: 4500, // $45 per person
      featured: true
    });

    // Corporate Events
    this.createService({
      name: "Corporate Events",
      description: "Professional catering solutions for meetings, conferences, and company celebrations.",
      imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      basePrice: 3500, // $35 per person
      featured: true
    });

    // Private Parties
    this.createService({
      name: "Private Parties",
      description: "From birthdays to anniversaries, we cater to all your private celebration needs.",
      imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      basePrice: 3000, // $30 per person
      featured: true
    });

    // Holiday Events
    this.createService({
      name: "Holiday Events",
      description: "Seasonal catering services with festive menus for your holiday gatherings.",
      imageUrl: "https://images.unsplash.com/photo-1516815231560-8f41ec531527?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      basePrice: 4000, // $40 per person
      featured: true
    });

    // Formal Dinners
    this.createService({
      name: "Formal Dinners",
      description: "Elegant plated service with gourmet cuisine for sophisticated gatherings.",
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      basePrice: 5500, // $55 per person
      featured: true
    });

    // Buffet Service
    this.createService({
      name: "Buffet Service",
      description: "Versatile buffet options perfect for casual events and family gatherings.",
      imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      basePrice: 2500, // $25 per person
      featured: true
    });
  }

  private initializeAvailability(): void {
    // Create availability for the next 60 days
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Make some random dates unavailable (for demo purposes)
      // In a real app, this would be based on actual bookings
      const isAvailable = Math.random() > 0.15; // 15% chance of being unavailable
      
      this.setAvailability({
        date: date.toISOString().split('T')[0] as any,
        isAvailable,
        notes: isAvailable ? "" : "Fully booked"
      });
    }
  }
}

// End of MemStorage class

// Import the database and drizzle operators
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Database implementation of IStorage
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getServices(): Promise<Service[]> {
    return db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }

  async updateService(id: number, serviceUpdate: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(serviceUpdate)
      .where(eq(services.id, id))
      .returning();
    return updatedService || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning({ deletedId: services.id });
    return result.length > 0;
  }

  async getAvailabilities(): Promise<Availability[]> {
    return db.select().from(availability);
  }

  async getAvailability(dateStr: string): Promise<Availability | undefined> {
    const [availabilityRecord] = await db
      .select()
      .from(availability)
      .where(eq(availability.date, dateStr));
    return availabilityRecord || undefined;
  }

  async setAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    // Check if availability for the date already exists
    const existingAvailability = await this.getAvailability(insertAvailability.date);
    
    if (existingAvailability) {
      // Update existing record
      const [updated] = await db
        .update(availability)
        .set(insertAvailability)
        .where(eq(availability.id, existingAvailability.id))
        .returning();
      return updated;
    } else {
      // Insert new record
      const [newAvailability] = await db
        .insert(availability)
        .values(insertAvailability)
        .returning();
      return newAvailability;
    }
  }

  async updateAvailability(id: number, availabilityUpdate: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const [updatedAvailability] = await db
      .update(availability)
      .set(availabilityUpdate)
      .where(eq(availability.id, id))
      .returning();
    return updatedAvailability || undefined;
  }

  async getBookings(): Promise<BookingWithCustomer[]> {
    // Get all bookings
    const bookingsData = await db.select().from(bookings);
    
    // Fetch the related data for each booking
    const result: BookingWithCustomer[] = await Promise.all(
      bookingsData.map(async (booking) => {
        // Get customer data
        const [customer] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, booking.customerId));
        
        // Get service data
        const [service] = await db
          .select()
          .from(services)
          .where(eq(services.id, booking.serviceId));
        
        // Combine the data
        return {
          ...booking,
          customer,
          service
        };
      })
    );
    
    return result;
  }

  async getBooking(id: number): Promise<BookingWithCustomer | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    
    if (!booking) return undefined;
    
    // Get customer data
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, booking.customerId));
    
    // Get service data
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, booking.serviceId));
    
    return {
      ...booking,
      customer,
      service
    };
  }

  async getBookingByReference(reference: string): Promise<BookingWithCustomer | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.reference, reference));
    
    if (!booking) return undefined;
    
    // Get customer data
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, booking.customerId));
    
    // Get service data
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, booking.serviceId));
    
    return {
      ...booking,
      customer,
      service
    };
  }

  async createBooking(insertBooking: InsertBooking, insertCustomer: InsertCustomer): Promise<BookingWithCustomer> {
    // First check if a customer with this email already exists
    let customer: Customer;
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, insertCustomer.email));
    
    if (existingCustomer) {
      // Update existing customer information
      const [updatedCustomer] = await db
        .update(customers)
        .set(insertCustomer)
        .where(eq(customers.id, existingCustomer.id))
        .returning();
      customer = updatedCustomer;
    } else {
      // Create new customer
      const [newCustomer] = await db
        .insert(customers)
        .values(insertCustomer)
        .returning();
      customer = newCustomer;
    }
    
    // Create booking with the customer ID
    const bookingWithCustomerId = {
      ...insertBooking,
      customerId: customer.id
    };
    
    const [booking] = await db
      .insert(bookings)
      .values(bookingWithCustomerId)
      .returning();
    
    // Get service data
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, booking.serviceId));
    
    return {
      ...booking,
      customer,
      service
    };
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking || undefined;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email));
    return customer || undefined;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
