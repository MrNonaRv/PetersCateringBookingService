import { 
  users, services, servicePackages, availability, bookings, 
  bookingDishes, bookingAddOns, customers, recentEvents, 
  galleryImages, capacityCalendar, dishes, addOns, venues, 
  customQuotes, paymentSettings,
  type User, type InsertUser,
  type Service, type InsertService,
  type ServicePackage, type InsertServicePackage,
  type Availability, type InsertAvailability,
  type Booking, type InsertBooking,
  type Customer, type InsertCustomer,
  type RecentEvent, type InsertRecentEvent,
  type GalleryImage, type InsertGalleryImage,
  type CapacityCalendar, type InsertCapacityCalendar,
  type Dish, type InsertDish,
  type AddOn, type InsertAddOn,
  type Venue, type InsertVenue,
  type CustomQuote, type InsertCustomQuote,
  type PaymentSetting, type InsertPaymentSetting,
  type BookingWithCustomer,
  type CustomQuoteWithCustomer
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { IStorage } from "./index";

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
    const existingAvailability = await this.getAvailability(insertAvailability.date);

    if (existingAvailability) {
      const [updated] = await db
        .update(availability)
        .set(insertAvailability)
        .where(eq(availability.id, existingAvailability.id))
        .returning();
      return updated;
    } else {
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
    const bookingsData = await db
      .select({
        booking: bookings,
        customer: customers,
        service: services,
        package: servicePackages,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(servicePackages, eq(bookings.packageId, servicePackages.id))
      .orderBy(desc(bookings.createdAt));

    if (bookingsData.length === 0) return [];

    const bookingIds = bookingsData.map((b) => b.booking.id);

    // Bulk fetch all dishes for these bookings
    const allDishes = await db
      .select({
        bookingId: bookingDishes.bookingId,
        dish: dishes,
        quantity: bookingDishes.quantity,
      })
      .from(bookingDishes)
      .innerJoin(dishes, eq(bookingDishes.dishId, dishes.id))
      .where(inArray(bookingDishes.bookingId, bookingIds));

    const dishesMap = allDishes.reduce((acc, curr) => {
      if (!acc[curr.bookingId]) acc[curr.bookingId] = [];
      acc[curr.bookingId].push({ ...curr.dish, quantity: curr.quantity || 1 });
      return acc;
    }, {} as Record<number, any[]>);

    return bookingsData.map((b) => ({
      ...b.booking,
      customer: b.customer,
      service: b.service,
      package: b.package,
      selectedDishes: dishesMap[b.booking.id] || [],
    }));
  }

  async getBooking(id: number): Promise<BookingWithCustomer | undefined> {
    const [data] = await db
      .select({
        booking: bookings,
        customer: customers,
        service: services,
        package: servicePackages,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(servicePackages, eq(bookings.packageId, servicePackages.id))
      .where(eq(bookings.id, id));

    if (!data) return undefined;

    const dishesResult = await db
      .select({
        dish: dishes,
        quantity: bookingDishes.quantity,
      })
      .from(bookingDishes)
      .innerJoin(dishes, eq(bookingDishes.dishId, dishes.id))
      .where(eq(bookingDishes.bookingId, id));

    const selectedDishes = dishesResult.map((d) => ({
      ...d.dish,
      quantity: d.quantity || 1,
    }));

    return {
      ...data.booking,
      customer: data.customer,
      service: data.service,
      package: data.package,
      selectedDishes,
    };
  }

  async getBookingByReference(reference: string): Promise<BookingWithCustomer | undefined> {
    const [data] = await db
      .select({
        booking: bookings,
        customer: customers,
        service: services,
        package: servicePackages,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(servicePackages, eq(bookings.packageId, servicePackages.id))
      .where(eq(bookings.bookingReference, reference));

    if (!data) return undefined;

    const dishesResult = await db
      .select({
        dish: dishes,
        quantity: bookingDishes.quantity,
      })
      .from(bookingDishes)
      .innerJoin(dishes, eq(bookingDishes.dishId, dishes.id))
      .where(eq(bookingDishes.bookingId, data.booking.id));

    const selectedDishes = dishesResult.map((d) => ({
      ...d.dish,
      quantity: d.quantity || 1,
    }));

    return {
      ...data.booking,
      customer: data.customer,
      service: data.service,
      package: data.package,
      selectedDishes,
    };
  }

  async createBooking(insertBooking: InsertBooking, insertCustomer: InsertCustomer, selectedDishes?: number[]): Promise<BookingWithCustomer> {
    let customer: Customer;
    const [existingCustomer] = await db.select().from(customers).where(eq(customers.email, insertCustomer.email));
    if (existingCustomer) {
      const [updatedCustomer] = await db.update(customers).set(insertCustomer).where(eq(customers.id, existingCustomer.id)).returning();
      customer = updatedCustomer;
    } else {
      const [newCustomer] = await db.insert(customers).values(insertCustomer).returning();
      customer = newCustomer;
    }
    const [booking] = await db.insert(bookings).values({ ...insertBooking, customerId: customer.id }).returning();
    if (selectedDishes && selectedDishes.length > 0) {
      const dishInserts = selectedDishes.map(dishId => ({ bookingId: booking.id, dishId: dishId, quantity: 1 }));
      await db.insert(bookingDishes).values(dishInserts);
    }
    const [service] = await db.select().from(services).where(eq(services.id, booking.serviceId));
    return { ...booking, customer, service };
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [updatedBooking] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return updatedBooking || undefined;
  }

  async updateBookingPayment(id: number, paymentData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db.update(bookings).set(paymentData).where(eq(bookings.id, id)).returning();
    return updatedBooking || undefined;
  }

  async updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db.update(bookings).set(data).where(eq(bookings.id, id)).returning();
    return updatedBooking || undefined;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async getRecentEvents(): Promise<RecentEvent[]> {
    return db.select().from(recentEvents).orderBy(desc(recentEvents.eventDate));
  }

  async getRecentEvent(id: number): Promise<RecentEvent | undefined> {
    const [event] = await db.select().from(recentEvents).where(eq(recentEvents.id, id));
    return event || undefined;
  }

  async createRecentEvent(insertEvent: InsertRecentEvent): Promise<RecentEvent> {
    const [event] = await db.insert(recentEvents).values(insertEvent).returning();
    return event;
  }

  async updateRecentEvent(id: number, eventUpdate: Partial<InsertRecentEvent>): Promise<RecentEvent | undefined> {
    const [updatedEvent] = await db.update(recentEvents).set(eventUpdate).where(eq(recentEvents.id, id)).returning();
    return updatedEvent || undefined;
  }

  async deleteRecentEvent(id: number): Promise<boolean> {
    const result = await db.delete(recentEvents).where(eq(recentEvents.id, id)).returning({ deletedId: recentEvents.id });
    return result.length > 0;
  }

  async getServicePackages(): Promise<ServicePackage[]> {
    return db.select().from(servicePackages);
  }

  async getServicePackagesByService(serviceId: number): Promise<ServicePackage[]> {
    return db.select().from(servicePackages).where(eq(servicePackages.serviceId, serviceId)).orderBy(servicePackages.sortOrder, servicePackages.pricePerPerson);
  }

  async getServicePackage(id: number): Promise<ServicePackage | undefined> {
    const [servicePackage] = await db.select().from(servicePackages).where(eq(servicePackages.id, id));
    return servicePackage || undefined;
  }

  async createServicePackage(insertServicePackage: InsertServicePackage): Promise<ServicePackage> {
    const [servicePackage] = await db.insert(servicePackages).values(insertServicePackage).returning();
    return servicePackage;
  }

  async updateServicePackage(id: number, servicePackageUpdate: Partial<InsertServicePackage>): Promise<ServicePackage | undefined> {
    const [updatedServicePackage] = await db.update(servicePackages).set(servicePackageUpdate).where(eq(servicePackages.id, id)).returning();
    return updatedServicePackage || undefined;
  }

  async deleteServicePackage(id: number): Promise<boolean> {
    const result = await db.delete(servicePackages).where(eq(servicePackages.id, id)).returning({ deletedId: servicePackages.id });
    return result.length > 0;
  }

  async getGalleryImages(): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).orderBy(galleryImages.createdAt);
  }

  async getGalleryImagesByCategory(category: string): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).where(eq(galleryImages.category, category)).orderBy(galleryImages.createdAt);
  }

  async getGalleryImage(id: number): Promise<GalleryImage | undefined> {
    const [image] = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    return image || undefined;
  }

  async createGalleryImage(insertGalleryImage: InsertGalleryImage): Promise<GalleryImage> {
    const [image] = await db.insert(galleryImages).values(insertGalleryImage).returning();
    return image;
  }

  async updateGalleryImage(id: number, imageUpdate: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    const [updatedImage] = await db.update(galleryImages).set(imageUpdate).where(eq(galleryImages.id, id)).returning();
    return updatedImage || undefined;
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    const result = await db.delete(galleryImages).where(eq(galleryImages.id, id)).returning({ deletedId: galleryImages.id });
    return result.length > 0;
  }

  async getCapacityCalendar(): Promise<CapacityCalendar[]> {
    return db.select().from(capacityCalendar).orderBy(capacityCalendar.date);
  }

  async getCapacityByDate(dateStr: string): Promise<CapacityCalendar | undefined> {
    const [capacity] = await db.select().from(capacityCalendar).where(eq(capacityCalendar.date, dateStr));
    return capacity || undefined;
  }

  async setCapacity(insertCapacity: InsertCapacityCalendar): Promise<CapacityCalendar> {
    const existing = await this.getCapacityByDate(insertCapacity.date);
    if (existing) {
      const [updated] = await db.update(capacityCalendar).set(insertCapacity).where(eq(capacityCalendar.id, existing.id)).returning();
      return updated;
    } else {
      const [newCapacity] = await db.insert(capacityCalendar).values(insertCapacity).returning();
      return newCapacity;
    }
  }

  async updateCapacity(id: number, capacityUpdate: Partial<InsertCapacityCalendar>): Promise<CapacityCalendar | undefined> {
    const [updated] = await db.update(capacityCalendar).set(capacityUpdate).where(eq(capacityCalendar.id, id)).returning();
    return updated || undefined;
  }

  async getDishes(): Promise<Dish[]> {
    return db.select().from(dishes).orderBy(dishes.sortOrder);
  }

  async getDishesByCategory(category: string): Promise<Dish[]> {
    return db.select().from(dishes).where(eq(dishes.category, category)).orderBy(dishes.sortOrder);
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
    const [updated] = await db.update(dishes).set(dishUpdate).where(eq(dishes.id, id)).returning();
    return updated || undefined;
  }

  async deleteDish(id: number): Promise<boolean> {
    const result = await db.delete(dishes).where(eq(dishes.id, id)).returning({ deletedId: dishes.id });
    return result.length > 0;
  }

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
    const [updated] = await db.update(addOns).set(addOnUpdate).where(eq(addOns.id, id)).returning();
    return updated || undefined;
  }

  async deleteAddOn(id: number): Promise<boolean> {
    const result = await db.delete(addOns).where(eq(addOns.id, id)).returning({ deletedId: addOns.id });
    return result.length > 0;
  }

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
    const [updated] = await db.update(venues).set(venueUpdate).where(eq(venues.id, id)).returning();
    return updated || undefined;
  }

  async deleteVenue(id: number): Promise<boolean> {
    const result = await db.delete(venues).where(eq(venues.id, id)).returning({ deletedId: venues.id });
    return result.length > 0;
  }

  async getCustomQuotes(): Promise<CustomQuoteWithCustomer[]> {
    const quotesData = await db
      .select({
        quote: customQuotes,
        customer: customers,
      })
      .from(customQuotes)
      .innerJoin(customers, eq(customQuotes.customerId, customers.id))
      .orderBy(desc(customQuotes.createdAt));

    return quotesData.map((q) => ({
      ...q.quote,
      customer: q.customer,
    }));
  }

  async getCustomQuote(id: number): Promise<CustomQuoteWithCustomer | undefined> {
    const [data] = await db
      .select({
        quote: customQuotes,
        customer: customers,
      })
      .from(customQuotes)
      .innerJoin(customers, eq(customQuotes.customerId, customers.id))
      .where(eq(customQuotes.id, id));

    if (!data) return undefined;
    return { ...data.quote, customer: data.customer };
  }

  async getCustomQuoteByReference(reference: string): Promise<CustomQuoteWithCustomer | undefined> {
    const [data] = await db
      .select({
        quote: customQuotes,
        customer: customers,
      })
      .from(customQuotes)
      .innerJoin(customers, eq(customQuotes.customerId, customers.id))
      .where(eq(customQuotes.quoteReference, reference));

    if (!data) return undefined;
    return { ...data.quote, customer: data.customer };
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
    const [quote] = await db.insert(customQuotes).values({ ...insertQuote, customerId: customer.id, quoteReference }).returning();
    return { ...quote, customer };
  }

  async updateCustomQuoteStatus(id: number, status: string, updates?: Partial<InsertCustomQuote>): Promise<CustomQuote | undefined> {
    const [updated] = await db.update(customQuotes).set({ ...updates, status, updatedAt: new Date() }).where(eq(customQuotes.id, id)).returning();
    return updated || undefined;
  }

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
      const [updated] = await db.update(paymentSettings).set({ ...setting, updatedAt: new Date() }).where(eq(paymentSettings.paymentMethod, setting.paymentMethod)).returning();
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
}
