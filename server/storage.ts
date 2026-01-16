import { 
  users, type User, type InsertUser,
  services, type Service, type InsertService,
  servicePackages, type ServicePackage, type InsertServicePackage,
  availability, type Availability, type InsertAvailability,
  bookings, type Booking, type InsertBooking,
  customers, type Customer, type InsertCustomer,
  recentEvents, type RecentEvent, type InsertRecentEvent,
  galleryImages, type GalleryImage, type InsertGalleryImage,
  capacityCalendar, type CapacityCalendar, type InsertCapacityCalendar,
  dishes, type Dish, type InsertDish,
  addOns, type AddOn, type InsertAddOn,
  customQuotes, type CustomQuote, type InsertCustomQuote,
  type BookingWithCustomer,
  type CustomQuoteWithCustomer
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
  
  // Service package operations
  getServicePackages(): Promise<ServicePackage[]>;
  getServicePackagesByService(serviceId: number): Promise<ServicePackage[]>;
  getServicePackage(id: number): Promise<ServicePackage | undefined>;
  createServicePackage(servicePackage: InsertServicePackage): Promise<ServicePackage>;
  updateServicePackage(id: number, servicePackage: Partial<InsertServicePackage>): Promise<ServicePackage | undefined>;
  deleteServicePackage(id: number): Promise<boolean>;
  
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
  
  // Recent events operations
  getRecentEvents(): Promise<RecentEvent[]>;
  getRecentEvent(id: number): Promise<RecentEvent | undefined>;
  createRecentEvent(event: InsertRecentEvent): Promise<RecentEvent>;
  updateRecentEvent(id: number, event: Partial<InsertRecentEvent>): Promise<RecentEvent | undefined>;
  deleteRecentEvent(id: number): Promise<boolean>;
  
  // Gallery image operations
  getGalleryImages(): Promise<GalleryImage[]>;
  getGalleryImagesByCategory(category: string): Promise<GalleryImage[]>;
  getGalleryImage(id: number): Promise<GalleryImage | undefined>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: number, image: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined>;
  deleteGalleryImage(id: number): Promise<boolean>;

  // Capacity calendar operations
  getCapacityCalendar(): Promise<CapacityCalendar[]>;
  getCapacityByDate(date: string): Promise<CapacityCalendar | undefined>;
  setCapacity(capacity: InsertCapacityCalendar): Promise<CapacityCalendar>;
  updateCapacity(id: number, capacity: Partial<InsertCapacityCalendar>): Promise<CapacityCalendar | undefined>;

  // Dish operations
  getDishes(): Promise<Dish[]>;
  getDishesByCategory(category: string): Promise<Dish[]>;
  getDish(id: number): Promise<Dish | undefined>;
  createDish(dish: InsertDish): Promise<Dish>;
  updateDish(id: number, dish: Partial<InsertDish>): Promise<Dish | undefined>;
  deleteDish(id: number): Promise<boolean>;

  // Add-on operations
  getAddOns(): Promise<AddOn[]>;
  getAddOnsByCategory(category: string): Promise<AddOn[]>;
  getAddOn(id: number): Promise<AddOn | undefined>;
  createAddOn(addOn: InsertAddOn): Promise<AddOn>;
  updateAddOn(id: number, addOn: Partial<InsertAddOn>): Promise<AddOn | undefined>;
  deleteAddOn(id: number): Promise<boolean>;

  // Custom quote operations
  getCustomQuotes(): Promise<CustomQuoteWithCustomer[]>;
  getCustomQuote(id: number): Promise<CustomQuoteWithCustomer | undefined>;
  getCustomQuoteByReference(reference: string): Promise<CustomQuoteWithCustomer | undefined>;
  createCustomQuote(quote: InsertCustomQuote, customer: InsertCustomer): Promise<CustomQuoteWithCustomer>;
  updateCustomQuoteStatus(id: number, status: string, updates?: Partial<InsertCustomQuote>): Promise<CustomQuote | undefined>;
}

// Using MemStorage temporarily until database connection is fixed
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private availabilities: Map<number, Availability>;
  private bookings: Map<number, Booking>;
  private customers: Map<number, Customer>;
  private recentEvents: Map<number, RecentEvent>;
  private currentIds: {
    user: number;
    service: number;
    availability: number;
    booking: number;
    customer: number;
    recentEvent: number;
  };

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.availabilities = new Map();
    this.bookings = new Map();
    this.customers = new Map();
    this.recentEvents = new Map();
    this.currentIds = {
      user: 1,
      service: 1,
      availability: 1,
      booking: 1,
      customer: 1,
      recentEvent: 1
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
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "staff",
      phone: insertUser.phone || null
    };
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
    const service: Service = { 
      ...insertService, 
      id,
      featured: insertService.featured ?? false
    };
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
      existingAvail.isAvailable = insertAvailability.isAvailable ?? null;
      existingAvail.notes = insertAvailability.notes ?? null;
      this.availabilities.set(existingAvail.id, existingAvail);
      return existingAvail;
    } else {
      // Create new
      const id = this.currentIds.availability++;
      const availability: Availability = { 
        ...insertAvailability, 
        id,
        isAvailable: insertAvailability.isAvailable ?? null,
        notes: insertAvailability.notes ?? null
      };
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
    // Create customer first
    const customerId = this.currentIds.customer++;
    const customer: Customer = { 
      ...insertCustomer, 
      id: customerId,
      company: insertCustomer.company ?? null
    };
    
    this.customers.set(customerId, customer);
    
    // Create booking with customer ID
    const bookingId = this.currentIds.booking++;
    const bookingReference = `PCC-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const booking: Booking = { 
      ...insertBooking, 
      id: bookingId,
      customerId,
      bookingReference,
      packageId: insertBooking.packageId ?? null,
      eventDuration: insertBooking.eventDuration ?? 4,
      status: insertBooking.status || "pending_approval",
      paymentStatus: insertBooking.paymentStatus || "pending",
      depositAmount: insertBooking.depositAmount ?? 0,
      depositPaid: insertBooking.depositPaid ?? false,
      depositPaymentMethod: insertBooking.depositPaymentMethod ?? null,
      depositPaymentReference: insertBooking.depositPaymentReference ?? null,
      depositPaidAt: insertBooking.depositPaidAt ?? null,
      balanceAmount: insertBooking.balanceAmount ?? 0,
      balancePaid: insertBooking.balancePaid ?? false,
      balancePaymentMethod: insertBooking.balancePaymentMethod ?? null,
      balancePaymentReference: insertBooking.balancePaymentReference ?? null,
      balancePaidAt: insertBooking.balancePaidAt ?? null,
      additionalServices: insertBooking.additionalServices ?? null,
      specialRequests: insertBooking.specialRequests ?? null,
      paymentMethod: insertBooking.paymentMethod ?? null,
      paymentReference: insertBooking.paymentReference ?? null,
      adminNotes: insertBooking.adminNotes ?? null,
      createdAt: new Date()
    };
    
    this.bookings.set(bookingId, booking);
    
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

  // Recent events operations
  async getRecentEvents(): Promise<RecentEvent[]> {
    return Array.from(this.recentEvents.values())
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }

  async getRecentEvent(id: number): Promise<RecentEvent | undefined> {
    return this.recentEvents.get(id);
  }

  async createRecentEvent(insertEvent: InsertRecentEvent): Promise<RecentEvent> {
    const id = this.currentIds.recentEvent++;
    const event: RecentEvent = {
      ...insertEvent,
      id,
      highlights: insertEvent.highlights ?? null,
      featured: insertEvent.featured ?? false,
      createdAt: new Date()
    };
    this.recentEvents.set(id, event);
    return event;
  }

  async updateRecentEvent(id: number, eventUpdate: Partial<InsertRecentEvent>): Promise<RecentEvent | undefined> {
    const existingEvent = this.recentEvents.get(id);
    if (!existingEvent) return undefined;

    const updatedEvent = { ...existingEvent, ...eventUpdate };
    this.recentEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteRecentEvent(id: number): Promise<boolean> {
    return this.recentEvents.delete(id);
  }

  // Helper methods
  private getCustomerByBookingId(bookingId: number): Customer | undefined {
    const booking = this.bookings.get(bookingId);
    if (!booking) return undefined;
    return this.customers.get(booking.customerId);
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

  // Service package operations (stub implementations)
  async getServicePackages(): Promise<ServicePackage[]> {
    return [];
  }

  async getServicePackagesByService(serviceId: number): Promise<ServicePackage[]> {
    return [];
  }

  async getServicePackage(id: number): Promise<ServicePackage | undefined> {
    return undefined;
  }

  async createServicePackage(servicePackage: InsertServicePackage): Promise<ServicePackage> {
    throw new Error("Service packages not implemented in MemStorage");
  }

  async updateServicePackage(id: number, servicePackage: Partial<InsertServicePackage>): Promise<ServicePackage | undefined> {
    return undefined;
  }

  async deleteServicePackage(id: number): Promise<boolean> {
    return false;
  }

  // Gallery image operations (stub implementations)
  async getGalleryImages(): Promise<GalleryImage[]> {
    return [];
  }

  async getGalleryImagesByCategory(category: string): Promise<GalleryImage[]> {
    return [];
  }

  async getGalleryImage(id: number): Promise<GalleryImage | undefined> {
    return undefined;
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    throw new Error("Gallery images not implemented in MemStorage");
  }

  async updateGalleryImage(id: number, image: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    return undefined;
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    return false;
  }

  // Capacity calendar operations (stub implementations)
  async getCapacityCalendar(): Promise<CapacityCalendar[]> {
    return [];
  }

  async getCapacityByDate(date: string): Promise<CapacityCalendar | undefined> {
    return undefined;
  }

  async setCapacity(capacity: InsertCapacityCalendar): Promise<CapacityCalendar> {
    throw new Error("Capacity calendar not implemented in MemStorage");
  }

  async updateCapacity(id: number, capacity: Partial<InsertCapacityCalendar>): Promise<CapacityCalendar | undefined> {
    return undefined;
  }

  // Dish operations (stub implementations)
  async getDishes(): Promise<Dish[]> {
    return [];
  }

  async getDishesByCategory(category: string): Promise<Dish[]> {
    return [];
  }

  async getDish(id: number): Promise<Dish | undefined> {
    return undefined;
  }

  async createDish(dish: InsertDish): Promise<Dish> {
    throw new Error("Dishes not implemented in MemStorage");
  }

  async updateDish(id: number, dish: Partial<InsertDish>): Promise<Dish | undefined> {
    return undefined;
  }

  async deleteDish(id: number): Promise<boolean> {
    return false;
  }

  // Add-on operations (stub implementations)
  async getAddOns(): Promise<AddOn[]> {
    return [];
  }

  async getAddOnsByCategory(category: string): Promise<AddOn[]> {
    return [];
  }

  async getAddOn(id: number): Promise<AddOn | undefined> {
    return undefined;
  }

  async createAddOn(addOn: InsertAddOn): Promise<AddOn> {
    throw new Error("Add-ons not implemented in MemStorage");
  }

  async updateAddOn(id: number, addOn: Partial<InsertAddOn>): Promise<AddOn | undefined> {
    return undefined;
  }

  async deleteAddOn(id: number): Promise<boolean> {
    return false;
  }

  // Custom quote operations (stub implementations)
  async getCustomQuotes(): Promise<CustomQuoteWithCustomer[]> {
    return [];
  }

  async getCustomQuote(id: number): Promise<CustomQuoteWithCustomer | undefined> {
    return undefined;
  }

  async getCustomQuoteByReference(reference: string): Promise<CustomQuoteWithCustomer | undefined> {
    return undefined;
  }

  async createCustomQuote(quote: InsertCustomQuote, customer: InsertCustomer): Promise<CustomQuoteWithCustomer> {
    throw new Error("Custom quotes not implemented in MemStorage");
  }

  async updateCustomQuoteStatus(id: number, status: string, updates?: Partial<InsertCustomQuote>): Promise<CustomQuote | undefined> {
    return undefined;
  }
}

// End of MemStorage class

// Import the database and drizzle operators
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

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
      .where(eq(bookings.bookingReference, reference));
    
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

  // Recent events operations
  async getRecentEvents(): Promise<RecentEvent[]> {
    return db.select().from(recentEvents).orderBy(desc(recentEvents.eventDate));
  }

  async getRecentEvent(id: number): Promise<RecentEvent | undefined> {
    const [event] = await db
      .select()
      .from(recentEvents)
      .where(eq(recentEvents.id, id));
    return event || undefined;
  }

  async createRecentEvent(insertEvent: InsertRecentEvent): Promise<RecentEvent> {
    const [event] = await db
      .insert(recentEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateRecentEvent(id: number, eventUpdate: Partial<InsertRecentEvent>): Promise<RecentEvent | undefined> {
    const [updatedEvent] = await db
      .update(recentEvents)
      .set(eventUpdate)
      .where(eq(recentEvents.id, id))
      .returning();
    return updatedEvent || undefined;
  }

  async deleteRecentEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(recentEvents)
      .where(eq(recentEvents.id, id))
      .returning({ deletedId: recentEvents.id });
    return result.length > 0;
  }

  // Service package operations
  async getServicePackages(): Promise<ServicePackage[]> {
    return db.select().from(servicePackages);
  }

  async getServicePackagesByService(serviceId: number): Promise<ServicePackage[]> {
    return db.select().from(servicePackages)
      .where(eq(servicePackages.serviceId, serviceId))
      .orderBy(servicePackages.sortOrder, servicePackages.pricePerPerson);
  }

  async getServicePackage(id: number): Promise<ServicePackage | undefined> {
    const [servicePackage] = await db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.id, id));
    return servicePackage || undefined;
  }

  async createServicePackage(insertServicePackage: InsertServicePackage): Promise<ServicePackage> {
    const [servicePackage] = await db
      .insert(servicePackages)
      .values(insertServicePackage)
      .returning();
    return servicePackage;
  }

  async updateServicePackage(id: number, servicePackageUpdate: Partial<InsertServicePackage>): Promise<ServicePackage | undefined> {
    const [updatedServicePackage] = await db
      .update(servicePackages)
      .set(servicePackageUpdate)
      .where(eq(servicePackages.id, id))
      .returning();
    return updatedServicePackage || undefined;
  }

  async deleteServicePackage(id: number): Promise<boolean> {
    const result = await db
      .delete(servicePackages)
      .where(eq(servicePackages.id, id))
      .returning({ deletedId: servicePackages.id });
    return result.length > 0;
  }

  // Gallery image operations
  async getGalleryImages(): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).orderBy(galleryImages.createdAt);
  }

  async getGalleryImagesByCategory(category: string): Promise<GalleryImage[]> {
    return db.select().from(galleryImages)
      .where(eq(galleryImages.category, category))
      .orderBy(galleryImages.createdAt);
  }

  async getGalleryImage(id: number): Promise<GalleryImage | undefined> {
    const [image] = await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.id, id));
    return image || undefined;
  }

  async createGalleryImage(insertGalleryImage: InsertGalleryImage): Promise<GalleryImage> {
    const [image] = await db
      .insert(galleryImages)
      .values(insertGalleryImage)
      .returning();
    return image;
  }

  async updateGalleryImage(id: number, imageUpdate: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    const [updatedImage] = await db
      .update(galleryImages)
      .set(imageUpdate)
      .where(eq(galleryImages.id, id))
      .returning();
    return updatedImage || undefined;
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    const result = await db
      .delete(galleryImages)
      .where(eq(galleryImages.id, id))
      .returning({ deletedId: galleryImages.id });
    return result.length > 0;
  }

  // Capacity calendar operations
  async getCapacityCalendar(): Promise<CapacityCalendar[]> {
    return db.select().from(capacityCalendar).orderBy(capacityCalendar.date);
  }

  async getCapacityByDate(dateStr: string): Promise<CapacityCalendar | undefined> {
    const [capacity] = await db
      .select()
      .from(capacityCalendar)
      .where(eq(capacityCalendar.date, dateStr));
    return capacity || undefined;
  }

  async setCapacity(insertCapacity: InsertCapacityCalendar): Promise<CapacityCalendar> {
    const existing = await this.getCapacityByDate(insertCapacity.date);
    if (existing) {
      const [updated] = await db
        .update(capacityCalendar)
        .set(insertCapacity)
        .where(eq(capacityCalendar.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newCapacity] = await db
        .insert(capacityCalendar)
        .values(insertCapacity)
        .returning();
      return newCapacity;
    }
  }

  async updateCapacity(id: number, capacityUpdate: Partial<InsertCapacityCalendar>): Promise<CapacityCalendar | undefined> {
    const [updated] = await db
      .update(capacityCalendar)
      .set(capacityUpdate)
      .where(eq(capacityCalendar.id, id))
      .returning();
    return updated || undefined;
  }

  // Dish operations
  async getDishes(): Promise<Dish[]> {
    return db.select().from(dishes).orderBy(dishes.sortOrder);
  }

  async getDishesByCategory(category: string): Promise<Dish[]> {
    return db.select().from(dishes)
      .where(eq(dishes.category, category))
      .orderBy(dishes.sortOrder);
  }

  async getDish(id: number): Promise<Dish | undefined> {
    const [dish] = await db.select().from(dishes).where(eq(dishes.id, id));
    return dish || undefined;
  }

  async createDish(insertDish: InsertDish): Promise<Dish> {
    const [dish] = await db.insert(dishes).values(insertDish).returning();
    return dish;
  }

  async updateDish(id: number, dishUpdate: Partial<InsertDish>): Promise<Dish | undefined> {
    const [updated] = await db
      .update(dishes)
      .set(dishUpdate)
      .where(eq(dishes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDish(id: number): Promise<boolean> {
    const result = await db.delete(dishes).where(eq(dishes.id, id)).returning({ deletedId: dishes.id });
    return result.length > 0;
  }

  // Add-on operations
  async getAddOns(): Promise<AddOn[]> {
    return db.select().from(addOns);
  }

  async getAddOnsByCategory(category: string): Promise<AddOn[]> {
    return db.select().from(addOns).where(eq(addOns.category, category));
  }

  async getAddOn(id: number): Promise<AddOn | undefined> {
    const [addOn] = await db.select().from(addOns).where(eq(addOns.id, id));
    return addOn || undefined;
  }

  async createAddOn(insertAddOn: InsertAddOn): Promise<AddOn> {
    const [addOn] = await db.insert(addOns).values(insertAddOn).returning();
    return addOn;
  }

  async updateAddOn(id: number, addOnUpdate: Partial<InsertAddOn>): Promise<AddOn | undefined> {
    const [updated] = await db
      .update(addOns)
      .set(addOnUpdate)
      .where(eq(addOns.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAddOn(id: number): Promise<boolean> {
    const result = await db.delete(addOns).where(eq(addOns.id, id)).returning({ deletedId: addOns.id });
    return result.length > 0;
  }

  // Custom quote operations
  async getCustomQuotes(): Promise<CustomQuoteWithCustomer[]> {
    const quotesData = await db.select().from(customQuotes).orderBy(desc(customQuotes.createdAt));
    const result: CustomQuoteWithCustomer[] = await Promise.all(
      quotesData.map(async (quote) => {
        const [customer] = await db.select().from(customers).where(eq(customers.id, quote.customerId));
        return { ...quote, customer };
      })
    );
    return result;
  }

  async getCustomQuote(id: number): Promise<CustomQuoteWithCustomer | undefined> {
    const [quote] = await db.select().from(customQuotes).where(eq(customQuotes.id, id));
    if (!quote) return undefined;
    const [customer] = await db.select().from(customers).where(eq(customers.id, quote.customerId));
    return { ...quote, customer };
  }

  async getCustomQuoteByReference(reference: string): Promise<CustomQuoteWithCustomer | undefined> {
    const [quote] = await db.select().from(customQuotes).where(eq(customQuotes.quoteReference, reference));
    if (!quote) return undefined;
    const [customer] = await db.select().from(customers).where(eq(customers.id, quote.customerId));
    return { ...quote, customer };
  }

  async createCustomQuote(insertQuote: InsertCustomQuote, insertCustomer: InsertCustomer): Promise<CustomQuoteWithCustomer> {
    let customer: Customer;
    const [existingCustomer] = await db.select().from(customers).where(eq(customers.email, insertCustomer.email));
    if (existingCustomer) {
      customer = existingCustomer;
    } else {
      const [newCustomer] = await db.insert(customers).values(insertCustomer).returning();
      customer = newCustomer;
    }
    
    const quoteReference = `PCQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const [quote] = await db
      .insert(customQuotes)
      .values({ ...insertQuote, customerId: customer.id, quoteReference })
      .returning();
    
    return { ...quote, customer };
  }

  async updateCustomQuoteStatus(id: number, status: string, updates?: Partial<InsertCustomQuote>): Promise<CustomQuote | undefined> {
    const [updated] = await db
      .update(customQuotes)
      .set({ ...updates, status, updatedAt: new Date() })
      .where(eq(customQuotes.id, id))
      .returning();
    return updated || undefined;
  }
}

// Use DatabaseStorage with Supabase connection
export const storage = new DatabaseStorage();
