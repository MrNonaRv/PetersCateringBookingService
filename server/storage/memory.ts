import { 
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
  type CustomQuoteWithCustomer,
  type BookingDish
} from "@shared/schema";
import { IStorage } from "./index";

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private services: Map<number, Service> = new Map();
  private servicePackages: Map<number, ServicePackage> = new Map();
  private availability: Map<string, Availability> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private bookingDishes: Map<number, BookingDish[]> = new Map();
  private customers: Map<number, Customer> = new Map();
  private recentEvents: Map<number, RecentEvent> = new Map();
  private galleryImages: Map<number, GalleryImage> = new Map();
  private capacityCalendar: Map<string, CapacityCalendar> = new Map();
  private dishes: Map<number, Dish> = new Map();
  private addOns: Map<number, AddOn> = new Map();
  private venues: Map<number, Venue> = new Map();
  private customQuotes: Map<number, CustomQuote> = new Map();
  private paymentSettings: Map<string, PaymentSetting> = new Map();
  private currentId: number = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    // Admin user
    this.users.set(1, {
      id: 1,
      username: "admin",
      password: "$2b$10$W2HgvkUYMxJ5fHYKpdhB4eeTcgsK5ZvA.0hhic6Sp/85YnGOK90EO", // "admin"
      name: "Admin User",
      role: "admin",
      email: "admin@peterscreation.com",
      phone: null
    });

    // Basic seed data for the demo
    const weddingService: Service = { id: 2, name: "Wedding Receptions", description: "Complete wedding catering", imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed", basePrice: 150000, featured: true, isActive: true };
    this.services.set(2, weddingService);
    this.servicePackages.set(1, { id: 1, serviceId: 2, name: "Gold Package", description: "Premium wedding package", pricePerPerson: 1500, minGuests: 50, maxGuests: 500, features: ["Full decor", "5 Main dishes"], hasThemedCake: true, isActive: true, sortOrder: 1 });
    
    this.dishes.set(1, { id: 1, name: "Lechon", description: "Roasted pig", category: "main", tags: ["popular"], imageUrl: "", additionalCost: 0, isAvailable: true, sortOrder: 1 });
    this.currentId = 3;
  }

  async getUser(id: number): Promise<User | undefined> { return this.users.get(id); }
  async getUsers(): Promise<User[]> { return Array.from(this.users.values()); }
  async getUserByUsername(username: string): Promise<User | undefined> { 
    return Array.from(this.users.values()).find(u => u.username === username); 
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id, phone: insertUser.phone || null, role: insertUser.role || "customer" };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...userUpdate, role: userUpdate.role || user.role };
    this.users.set(id, updated);
    return updated;
  }

  async getServices(): Promise<Service[]> { return Array.from(this.services.values()); }
  async getService(id: number): Promise<Service | undefined> { return this.services.get(id); }
  async createService(s: InsertService): Promise<Service> {
    const id = this.currentId++;
    const service = { ...s, id, featured: s.featured ?? false, isActive: s.isActive ?? true };
    this.services.set(id, service);
    return service;
  }
  async updateService(id: number, s: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    const updated = { ...service, ...s, featured: s.featured ?? service.featured, isActive: s.isActive ?? service.isActive };
    this.services.set(id, updated);
    return updated;
  }
  async deleteService(id: number): Promise<boolean> { return this.services.delete(id); }

  async getServicePackages(): Promise<ServicePackage[]> { return Array.from(this.servicePackages.values()); }
  async getServicePackagesByService(serviceId: number): Promise<ServicePackage[]> {
    return Array.from(this.servicePackages.values()).filter(p => p.serviceId === serviceId);
  }
  async getServicePackage(id: number): Promise<ServicePackage | undefined> { return this.servicePackages.get(id); }
  async createServicePackage(p: InsertServicePackage): Promise<ServicePackage> {
    const id = this.currentId++;
    const pkg = { 
      ...p, 
      id, 
      minGuests: p.minGuests ?? 0,
      maxGuests: p.maxGuests || null, 
      features: p.features || null, 
      sortOrder: p.sortOrder || 0, 
      hasThemedCake: p.hasThemedCake || false, 
      isActive: p.isActive ?? true 
    };
    this.servicePackages.set(id, pkg);
    return pkg;
  }
  async updateServicePackage(id: number, p: Partial<InsertServicePackage>): Promise<ServicePackage | undefined> {
    const pkg = this.servicePackages.get(id);
    if (!pkg) return undefined;
    const updated = { ...pkg, ...p, minGuests: p.minGuests ?? pkg.minGuests };
    this.servicePackages.set(id, updated);
    return updated;
  }
  async deleteServicePackage(id: number): Promise<boolean> { return this.servicePackages.delete(id); }

  async getAvailabilities(): Promise<Availability[]> { return Array.from(this.availability.values()); }
  async getAvailability(date: string): Promise<Availability | undefined> { return this.availability.get(date); }
  async setAvailability(a: InsertAvailability): Promise<Availability> {
    const id = this.currentId++;
    const avail = { ...a, id, notes: a.notes || null, isAvailable: a.isAvailable ?? true };
    this.availability.set(a.date, avail);
    return avail;
  }
  async updateAvailability(id: number, a: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const avail = Array.from(this.availability.values()).find(v => v.id === id);
    if (!avail) return undefined;
    const updated = { ...avail, ...a };
    this.availability.set(updated.date, updated);
    return updated;
  }

  async getBookings(): Promise<BookingWithCustomer[]> {
    return Promise.all(Array.from(this.bookings.values()).map(b => this.getBooking(b.id) as Promise<BookingWithCustomer>));
  }
  async getBooking(id: number): Promise<BookingWithCustomer | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    const customer = this.customers.get(booking.customerId)!;
    const service = this.services.get(booking.serviceId) || null;
    return { ...booking, customer, service };
  }
  async getBookingByReference(ref: string): Promise<BookingWithCustomer | undefined> {
    const booking = Array.from(this.bookings.values()).find(b => b.bookingReference === ref);
    return booking ? this.getBooking(booking.id) : undefined;
  }
  async createBooking(b: InsertBooking, c: InsertCustomer, selectedDishes?: number[]): Promise<BookingWithCustomer> {
    let customer = Array.from(this.customers.values()).find(cust => cust.email === c.email);
    if (!customer) {
      const cid = this.currentId++;
      customer = { ...c, id: cid, company: c.company || null };
      this.customers.set(cid, customer);
    }
    const bid = this.currentId++;
    const booking: Booking = { 
      ...b, id: bid, customerId: customer.id, 
      createdAt: new Date(), 
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
    return this.getBooking(bid) as Promise<BookingWithCustomer>;
  }
  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const b = this.bookings.get(id);
    if (!b) return undefined;
    b.status = status;
    return b;
  }
  async updateBookingPayment(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const b = this.bookings.get(id);
    if (!b) return undefined;
    Object.assign(b, data);
    return b;
  }
  async updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const b = this.bookings.get(id);
    if (!b) return undefined;
    Object.assign(b, data);
    return b;
  }

  async getCustomer(id: number): Promise<Customer | undefined> { return this.customers.get(id); }
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => c.email === email);
  }

  async getRecentEvents(): Promise<RecentEvent[]> { return Array.from(this.recentEvents.values()); }
  async getRecentEvent(id: number): Promise<RecentEvent | undefined> { return this.recentEvents.get(id); }
  async createRecentEvent(e: InsertRecentEvent): Promise<RecentEvent> {
    const id = this.currentId++;
    const event = { 
      ...e, 
      id, 
      createdAt: new Date(), 
      highlights: e.highlights || [], 
      featured: e.featured ?? false 
    };
    this.recentEvents.set(id, event);
    return event;
  }
  async updateRecentEvent(id: number, e: Partial<InsertRecentEvent>): Promise<RecentEvent | undefined> {
    const event = this.recentEvents.get(id);
    if (!event) return undefined;
    const updated = { 
      ...event, 
      ...e, 
      highlights: e.highlights || event.highlights, 
      featured: e.featured ?? event.featured 
    };
    this.recentEvents.set(id, updated);
    return updated;
  }
  async deleteRecentEvent(id: number): Promise<boolean> { return this.recentEvents.delete(id); }

  async getGalleryImages(): Promise<GalleryImage[]> { return Array.from(this.galleryImages.values()); }
  async getGalleryImagesByCategory(cat: string): Promise<GalleryImage[]> {
    return Array.from(this.galleryImages.values()).filter(i => i.category === cat);
  }
  async getGalleryImage(id: number): Promise<GalleryImage | undefined> { return this.galleryImages.get(id); }
  async createGalleryImage(i: InsertGalleryImage): Promise<GalleryImage> {
    const id = this.currentId++;
    const img = { 
      ...i, 
      id, 
      createdAt: new Date(), 
      description: i.description || null, 
      category: i.category || "general", 
      isActive: i.isActive ?? true 
    };
    this.galleryImages.set(id, img);
    return img;
  }
  async updateGalleryImage(id: number, i: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    const img = this.galleryImages.get(id);
    if (!img) return undefined;
    const updated = { ...img, ...i };
    this.galleryImages.set(id, updated);
    return updated;
  }
  async deleteGalleryImage(id: number): Promise<boolean> { return this.galleryImages.delete(id); }

  async getCapacityCalendar(): Promise<CapacityCalendar[]> { return Array.from(this.capacityCalendar.values()); }
  async getCapacityByDate(date: string): Promise<CapacityCalendar | undefined> { return this.capacityCalendar.get(date); }
  async setCapacity(c: InsertCapacityCalendar): Promise<CapacityCalendar> {
    const id = this.currentId++;
    const cap = { ...c, id, notes: c.notes || null, dayType: c.dayType || 'normal', maxSlots: c.maxSlots || 7, bookedSlots: c.bookedSlots || 0 };
    this.capacityCalendar.set(c.date, cap);
    return cap;
  }
  async updateCapacity(id: number, c: Partial<InsertCapacityCalendar>): Promise<CapacityCalendar | undefined> {
    const cap = Array.from(this.capacityCalendar.values()).find(v => v.id === id);
    if (!cap) return undefined;
    const updated = { ...cap, ...c };
    this.capacityCalendar.set(updated.date, updated);
    return updated;
  }

  async getDishes(): Promise<Dish[]> { return Array.from(this.dishes.values()); }
  async getDishesByCategory(cat: string): Promise<Dish[]> {
    return Array.from(this.dishes.values()).filter(d => d.category === cat);
  }
  async getDish(id: number): Promise<Dish | undefined> { return this.dishes.get(id); }
  async createDish(d: InsertDish): Promise<Dish> {
    const id = this.currentId++;
    const dish = { 
      ...d, 
      id, 
      description: d.description || null, 
      tags: d.tags || [], 
      imageUrl: d.imageUrl || null, 
      additionalCost: d.additionalCost ?? 0, 
      isAvailable: d.isAvailable ?? true, 
      sortOrder: d.sortOrder ?? 0 
    };
    this.dishes.set(id, dish);
    return dish;
  }
  async updateDish(id: number, d: Partial<InsertDish>): Promise<Dish | undefined> {
    const dish = this.dishes.get(id);
    if (!dish) return undefined;
    const updated = { ...dish, ...d };
    this.dishes.set(id, updated);
    return updated;
  }
  async deleteDish(id: number): Promise<boolean> { return this.dishes.delete(id); }

  async getAddOns(): Promise<AddOn[]> { return Array.from(this.addOns.values()); }
  async getAddOnsByCategory(cat: string): Promise<AddOn[]> {
    return Array.from(this.addOns.values()).filter(a => a.category === cat);
  }
  async getAddOn(id: number): Promise<AddOn | undefined> { return this.addOns.get(id); }
  async createAddOn(a: InsertAddOn): Promise<AddOn> {
    const id = this.currentId++;
    const addOn = { 
      ...a, 
      id, 
      description: a.description || null, 
      minQuantity: a.minQuantity ?? 1, 
      maxQuantity: a.maxQuantity || null, 
      isAvailable: a.isAvailable ?? true, 
      priceType: a.priceType || 'fixed' 
    };
    this.addOns.set(id, addOn);
    return addOn;
  }
  async updateAddOn(id: number, a: Partial<InsertAddOn>): Promise<AddOn | undefined> {
    const addOn = this.addOns.get(id);
    if (!addOn) return undefined;
    const updated = { ...addOn, ...a };
    this.addOns.set(id, updated);
    return updated;
  }
  async deleteAddOn(id: number): Promise<boolean> { return this.addOns.delete(id); }

  async getVenues(): Promise<Venue[]> { return Array.from(this.venues.values()); }
  async getVenue(id: number): Promise<Venue | undefined> { return this.venues.get(id); }
  async createVenue(v: InsertVenue): Promise<Venue> {
    const id = this.currentId++;
    const venue = { 
      ...v, 
      id, 
      description: v.description || null, 
      capacityMin: v.capacityMin ?? 0, 
      capacityMax: v.capacityMax || null, 
      imageUrl: v.imageUrl || null, 
      isAvailable: v.isAvailable ?? true, 
      type: v.type || 'venue' 
    };
    this.venues.set(id, venue);
    return venue;
  }
  async updateVenue(id: number, v: Partial<InsertVenue>): Promise<Venue | undefined> {
    const venue = this.venues.get(id);
    if (!venue) return undefined;
    const updated = { ...venue, ...v };
    this.venues.set(id, updated);
    return updated;
  }
  async deleteVenue(id: number): Promise<boolean> { return this.venues.delete(id); }

  async getCustomQuotes(): Promise<CustomQuoteWithCustomer[]> {
    return Promise.all(Array.from(this.customQuotes.values()).map(q => this.getCustomQuote(q.id) as Promise<CustomQuoteWithCustomer>));
  }
  async getCustomQuote(id: number): Promise<CustomQuoteWithCustomer | undefined> {
    const quote = this.customQuotes.get(id);
    if (!quote) return undefined;
    const customer = this.customers.get(quote.customerId)!;
    return { ...quote, customer };
  }
  async getCustomQuoteByReference(ref: string): Promise<CustomQuoteWithCustomer | undefined> {
    const quote = Array.from(this.customQuotes.values()).find(q => q.quoteReference === ref);
    return quote ? this.getCustomQuote(quote.id) : undefined;
  }
  async createCustomQuote(q: InsertCustomQuote, c: InsertCustomer): Promise<CustomQuoteWithCustomer> {
    let customer = Array.from(this.customers.values()).find(cust => cust.email === c.email);
    if (!customer) {
      const cid = this.currentId++;
      customer = { ...c, id: cid, company: c.company || null };
      this.customers.set(cid, customer);
    }
    const qid = this.currentId++;
    const quote: CustomQuote = { 
      ...q, id: qid, customerId: customer.id, 
      createdAt: new Date(), updatedAt: new Date(),
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
    return this.getCustomQuote(qid) as Promise<CustomQuoteWithCustomer>;
  }
  async updateCustomQuoteStatus(id: number, status: string, updates?: Partial<InsertCustomQuote>): Promise<CustomQuote | undefined> {
    const q = this.customQuotes.get(id);
    if (!q) return undefined;
    q.status = status;
    if (updates) Object.assign(q, updates);
    q.updatedAt = new Date();
    return q;
  }

  async getPaymentSettings(): Promise<PaymentSetting[]> { return Array.from(this.paymentSettings.values()); }
  async getPaymentSetting(method: string): Promise<PaymentSetting | undefined> { return this.paymentSettings.get(method); }
  async upsertPaymentSetting(s: InsertPaymentSetting): Promise<PaymentSetting> {
    const id = this.currentId++;
    const setting = { ...s, id, isActive: s.isActive ?? true, instructions: s.instructions || null, updatedAt: new Date() };
    this.paymentSettings.set(s.paymentMethod, setting);
    return setting;
  }
  async deletePaymentSetting(id: number): Promise<boolean> {
    const setting = Array.from(this.paymentSettings.values()).find(s => s.id === id);
    if (setting) return this.paymentSettings.delete(setting.paymentMethod);
    return false;
  }
}
