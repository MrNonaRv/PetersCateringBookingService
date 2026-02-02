import { 
  users, type User, type InsertUser,
  services, type Service, type InsertService,
  servicePackages, type ServicePackage, type InsertServicePackage,
  availability, type Availability, type InsertAvailability,
  bookings, type Booking, type InsertBooking,
  bookingDishes,
  customers, type Customer, type InsertCustomer,
  recentEvents, type RecentEvent, type InsertRecentEvent,
  galleryImages, type GalleryImage, type InsertGalleryImage,
  capacityCalendar, type CapacityCalendar, type InsertCapacityCalendar,
  dishes, type Dish, type InsertDish,
  addOns, type AddOn, type InsertAddOn,
  venues, type Venue, type InsertVenue,
  customQuotes, type CustomQuote, type InsertCustomQuote,
  paymentSettings, type PaymentSetting, type InsertPaymentSetting,
  type BookingWithCustomer,
  type CustomQuoteWithCustomer
} from "@shared/schema";

// Storage interface with CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
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
  createBooking(booking: InsertBooking, customer: InsertCustomer, selectedDishes?: number[]): Promise<BookingWithCustomer>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  updateBookingPayment(id: number, paymentData: Partial<InsertBooking>): Promise<Booking | undefined>;

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

  // Venue operations
  getVenues(): Promise<Venue[]>;
  getVenue(id: number): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue | undefined>;
  deleteVenue(id: number): Promise<boolean>;

  // Custom quote operations
  getCustomQuotes(): Promise<CustomQuoteWithCustomer[]>;
  getCustomQuote(id: number): Promise<CustomQuoteWithCustomer | undefined>;
  getCustomQuoteByReference(reference: string): Promise<CustomQuoteWithCustomer | undefined>;
  createCustomQuote(quote: InsertCustomQuote, customer: InsertCustomer): Promise<CustomQuoteWithCustomer>;
  updateCustomQuoteStatus(id: number, status: string, updates?: Partial<InsertCustomQuote>): Promise<CustomQuote | undefined>;

  // Payment settings operations
  getPaymentSettings(): Promise<PaymentSetting[]>;
  getPaymentSetting(paymentMethod: string): Promise<PaymentSetting | undefined>;
  upsertPaymentSetting(setting: InsertPaymentSetting): Promise<PaymentSetting>;
  deletePaymentSetting(id: number): Promise<boolean>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
}

// Import the database and drizzle operators
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Database implementation of IStorage
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
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

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
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

        // Get service data (handle null serviceId for custom quotes)
        let service = null;
        if (booking.serviceId) {
          const [serviceData] = await db
            .select()
            .from(services)
            .where(eq(services.id, booking.serviceId));
          service = serviceData;
        }

        // Get package data
        let packageData = null;
        if (booking.packageId) {
          const [pkg] = await db
            .select()
            .from(servicePackages)
            .where(eq(servicePackages.id, booking.packageId));
          packageData = pkg;
        }

        // Get selected dishes
        const dishesResult = await db
          .select()
          .from(bookingDishes)
          .innerJoin(dishes, eq(bookingDishes.dishId, dishes.id))
          .where(eq(bookingDishes.bookingId, booking.id));

        const selectedDishes = dishesResult.map(({ dishes: dish, booking_dishes: bd }) => ({
          ...dish,
          quantity: bd.quantity || 1
        }));

        // Combine the data
        return {
          ...booking,
          customer,
          service,
          package: packageData,
          selectedDishes
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

    // Get service data (handle null serviceId for custom quotes)
    let service = null;
    if (booking.serviceId) {
      const [serviceData] = await db
        .select()
        .from(services)
        .where(eq(services.id, booking.serviceId));
      service = serviceData;
    }

    // Get package data
    let packageData = null;
    if (booking.packageId) {
      const [pkg] = await db
        .select()
        .from(servicePackages)
        .where(eq(servicePackages.id, booking.packageId));
      packageData = pkg;
    }

    // Get selected dishes
    const dishesResult = await db
      .select()
      .from(bookingDishes)
      .innerJoin(dishes, eq(bookingDishes.dishId, dishes.id))
      .where(eq(bookingDishes.bookingId, booking.id));

    const selectedDishes = dishesResult.map(({ dishes: dish, booking_dishes: bd }) => ({
      ...dish,
      quantity: bd.quantity || 1
    }));

    return {
      ...booking,
      customer,
      service,
      package: packageData,
      selectedDishes
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

    // Get service data (handle null serviceId for custom quotes)
    let service = null;
    if (booking.serviceId) {
      const [serviceData] = await db
        .select()
        .from(services)
        .where(eq(services.id, booking.serviceId));
      service = serviceData;
    }

    // Get package data
    let packageData = null;
    if (booking.packageId) {
      const [pkg] = await db
        .select()
        .from(servicePackages)
        .where(eq(servicePackages.id, booking.packageId));
      packageData = pkg;
    }

    // Get selected dishes
    const dishesResult = await db
      .select()
      .from(bookingDishes)
      .innerJoin(dishes, eq(bookingDishes.dishId, dishes.id))
      .where(eq(bookingDishes.bookingId, booking.id));

    const selectedDishes = dishesResult.map(({ dishes: dish, booking_dishes: bd }) => ({
      ...dish,
      quantity: bd.quantity || 1
    }));

    return {
      ...booking,
      customer,
      service,
      package: packageData,
      selectedDishes
    };
  }

  async createBooking(insertBooking: InsertBooking, insertCustomer: InsertCustomer, selectedDishes?: number[]): Promise<BookingWithCustomer> {
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

    // Save selected dishes if provided
    if (selectedDishes && selectedDishes.length > 0) {
      const dishInserts = selectedDishes.map(dishId => ({
        bookingId: booking.id,
        dishId: dishId,
        quantity: 1
      }));
      await db.insert(bookingDishes).values(dishInserts);
    }

    // Capacity reservation happens after deposit payment via webhook

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

  async updateBookingPayment(id: number, paymentData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(paymentData)
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

  async reserveCapacityForDate(dateStr: string): Promise<CapacityCalendar> {
    const existing = await this.getCapacityByDate(dateStr);
    if (existing) {
      const [updated] = await db
        .update(capacityCalendar)
        .set({ bookedSlots: (existing.bookedSlots || 0) + 1 })
        .where(eq(capacityCalendar.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(capacityCalendar)
        .values({
          date: dateStr,
          dayType: 'normal',
          maxSlots: 7,
          bookedSlots: 1
        })
        .returning();
      return created;
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

  // Venue operations
  async getVenues(): Promise<Venue[]> {
    return db.select().from(venues).orderBy(venues.name);
  }

  async getVenue(id: number): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue || undefined;
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const [venue] = await db.insert(venues).values(insertVenue).returning();
    return venue;
  }

  async updateVenue(id: number, venueUpdate: Partial<InsertVenue>): Promise<Venue | undefined> {
    const [updated] = await db
      .update(venues)
      .set(venueUpdate)
      .where(eq(venues.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVenue(id: number): Promise<boolean> {
    const result = await db.delete(venues).where(eq(venues.id, id)).returning({ deletedId: venues.id });
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

  // Payment settings operations
  async getPaymentSettings(): Promise<PaymentSetting[]> {
    return db.select().from(paymentSettings).orderBy(paymentSettings.paymentMethod);
  }

  async getPaymentSetting(paymentMethod: string): Promise<PaymentSetting | undefined> {
    const [setting] = await db.select().from(paymentSettings).where(eq(paymentSettings.paymentMethod, paymentMethod));
    return setting || undefined;
  }

  async upsertPaymentSetting(setting: InsertPaymentSetting): Promise<PaymentSetting> {
    const existing = await this.getPaymentSetting(setting.paymentMethod);
    if (existing) {
      const [updated] = await db
        .update(paymentSettings)
        .set({ ...setting, updatedAt: new Date() })
        .where(eq(paymentSettings.paymentMethod, setting.paymentMethod))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(paymentSettings).values(setting).returning();
      return created;
    }
  }

  async deletePaymentSetting(id: number): Promise<boolean> {
    const result = await db.delete(paymentSettings).where(eq(paymentSettings.id, id)).returning({ deletedId: paymentSettings.id });
    return result.length > 0;
  }

  async clearBookings(): Promise<boolean> {
    await db.delete(bookingDishes);
    await db.delete(bookingAddOns);
    await db.delete(bookings);
    await db.update(capacityCalendar).set({ bookedSlots: 0 });
    return true;
  }
}

// Use DatabaseStorage with Supabase connection
export const storage = new DatabaseStorage();
