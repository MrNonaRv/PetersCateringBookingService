import { 
  User, InsertUser,
  Service, InsertService,
  ServicePackage, InsertServicePackage,
  Availability, InsertAvailability,
  Booking, InsertBooking,
  Customer, InsertCustomer,
  RecentEvent, InsertRecentEvent,
  GalleryImage, InsertGalleryImage,
  CapacityCalendar, InsertCapacityCalendar,
  Dish, InsertDish,
  AddOn, InsertAddOn,
  Venue, InsertVenue,
  CustomQuote, InsertCustomQuote,
  PaymentSetting, InsertPaymentSetting,
  BookingWithCustomer,
  CustomQuoteWithCustomer
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

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
  updateBooking(id: number, data: Partial<InsertBooking>): Promise<Booking | undefined>;

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
}

import { db } from "../db";
import { DatabaseStorage } from "./database";
import { MemStorage } from "./memory";

export const storage: IStorage = db ? new DatabaseStorage() : new MemStorage();
