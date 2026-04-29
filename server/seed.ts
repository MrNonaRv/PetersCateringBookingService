import { db } from "./db";
import { users, services, availability, customers, bookings, recentEvents, dishes, servicePackages, packageDishes, addOns, venues } from "@shared/schema";
import { hash } from "bcrypt";
import { sql } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from 'url';

export async function seed() {
  if (!db) {
    console.log("⚠️ Database connection not available, skipping seeding.");
    return;
  }

  console.log("🌱 Seeding database...");
  
  // Create admin user
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
  
  // Create initial services
  const servicesCount = await db.select().from(services);
  
  if (servicesCount.length === 0) {
    await db.insert(services).values([
      {
        name: "Wedding Receptions",
        description: "Make your special day unforgettable with our complete wedding catering service. Includes formal setup, decorations, and premium menu options.",
        imageUrl: "https://images.unsplash.com/photo-1529636798458-92182e662485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80",
        basePrice: 150000, // ₱1,500 per person
        featured: true
      },
      {
        name: "Corporate Events",
        description: "Impress your clients and colleagues with professional catering for meetings, conferences, and corporate gatherings. Includes setup and service staff.",
        imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80",
        basePrice: 100000, // ₱1,000 per person
        featured: true
      },
      {
        name: "Birthday Celebrations",
        description: "Create lasting memories with custom birthday catering packages tailored to your theme and preferences. Perfect for milestone celebrations.",
        imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=936&q=80",
        basePrice: 80000, // ₱800 per person
        featured: false
      },
      {
        name: "Graduation Parties",
        description: "Celebrate academic achievements with our graduation catering packages. From finger foods to full-course meals, we'll help make your grad party memorable.",
        imageUrl: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        basePrice: 75000, // ₱750 per person
        featured: false
      },
      {
        name: "Holiday Gatherings",
        description: "Enjoy time with loved ones and let us handle the food. Special holiday menus available for Christmas, New Year, and other seasonal celebrations.",
        imageUrl: "https://images.unsplash.com/photo-1543353071-087092ec393a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        basePrice: 90000, // ₱900 per person
        featured: true
      },
      {
        name: "Private Dinners",
        description: "Enjoy a restaurant-quality experience in your home with our personal chef service. Perfect for intimate gatherings and special occasions.",
        imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        basePrice: 120000, // ₱1,200 per person
        featured: false
      }
    ]);
    console.log("Created initial services");
  } else {
    console.log(`Services already exist (${servicesCount.length} found)`);
  }
  
  // Create initial availability dates
  const availabilityCount = await db.select().from(availability);
  
  if (availabilityCount.length === 0) {
    // Set some dates as unavailable for the next month
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    // Mark some random dates as unavailable
    const unavailableDates = [
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20),
    ];
    
    for (const date of unavailableDates) {
      await db.insert(availability).values({
        date: date.toISOString().split('T')[0],
        isAvailable: false,
        notes: "Booked for another event"
      });
    }
    
    console.log("Created initial availability settings");
  } else {
    console.log(`Availability settings already exist (${availabilityCount.length} found)`);
  }
  
  // Create sample recent events
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

  // Create sample dishes (menus)
  const dishesCount = await db.select().from(dishes);
  let createdDishes: any[] = [];
  
  if (dishesCount.length === 0) {
    createdDishes = await db.insert(dishes).values([
      { name: "Crispy Pork Belly (Lechon Kawali)", description: "Deep-fried pork belly, crispy on the outside, tender on the inside.", category: "main", tags: ["pork", "filipino", "popular"], additionalCost: 0 },
      { name: "Beef Kare-Kare", description: "Oxtail and tripe peanut stew with vegetables.", category: "main", tags: ["beef", "filipino", "peanut"], additionalCost: 5000 },
      { name: "Chicken Cordon Bleu", description: "Breaded chicken breast stuffed with ham and cheese.", category: "main", tags: ["chicken", "western"], additionalCost: 0 },
      { name: "Pancit Canton", description: "Stir-fried egg noodles with vegetables, pork, and shrimp.", category: "side", tags: ["noodles", "filipino"], additionalCost: 0 },
      { name: "Lumpia Shanghai", description: "Mini meat spring rolls served with sweet and sour sauce.", category: "appetizer", tags: ["pork", "popular", "finger-food"], additionalCost: 0 },
      { name: "Buko Pandan", description: "Young coconut and pandan jelly in sweetened cream.", category: "dessert", tags: ["sweet", "filipino", "popular"], additionalCost: 0 },
      { name: "Leche Flan", description: "Rich caramel custard dessert.", category: "dessert", tags: ["sweet", "filipino"], additionalCost: 0 },
      { name: "Bottomless Iced Tea", description: "House blend sweet iced tea.", category: "beverage", tags: ["cold", "refreshing"], additionalCost: 0 },
    ]).returning();
    console.log("Created sample dishes");
  } else {
    console.log(`Dishes already exist (${dishesCount.length} found)`);
    createdDishes = dishesCount;
  }

  // Create sample packages
  const packagesCount = await db.select().from(servicePackages);
  
  if (packagesCount.length === 0) {
    const allServices = await db.select().from(services);
    const weddingService = allServices.find(s => s.name === "Wedding Receptions");
    
    if (weddingService) {
      const createdPackages = await db.insert(servicePackages).values([
        {
          serviceId: weddingService.id,
          name: "Silver Wedding Package",
          description: "Essential catering package perfect for intimate weddings.",
          pricePerPerson: 85000, // ₱850
          minGuests: 50,
          features: ["Choice of 2 main dishes", "1 appetizer", "1 dessert", "Bottomless Iced Tea", "Basic table setup"],
          hasThemedCake: false
        },
        {
          serviceId: weddingService.id,
          name: "Gold Wedding Package",
          description: "Our most popular package with premium dish selections and elegant setup.",
          pricePerPerson: 120000, // ₱1,200
          minGuests: 100,
          features: ["Choice of 3 main dishes", "2 appetizers", "2 desserts", "Premium beverage station", "Elegant table setup", "Basic floral centerpiece"],
          hasThemedCake: true
        }
      ]).returning();
      console.log("Created sample packages");

      // Assign dishes to packages if both exist
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

  // Create sample add-ons
  const addOnsCount = await db.select().from(addOns);
  if (addOnsCount.length === 0) {
    await db.insert(addOns).values([
      { name: "Chocolate Fountain", description: "3-tier chocolate fountain with fruits and marshmallows", category: "service", priceType: "fixed", price: 500000 },
      { name: "Extra Waiter", description: "Additional serving staff for your event", category: "service", priceType: "fixed", price: 150000 },
      { name: "Tiffany Chairs Upgrade", description: "Upgrade standard chairs to elegant Tiffany chairs", category: "equipment", priceType: "per_person", price: 10000 },
    ]);
    console.log("Created sample add-ons");
  } else {
    console.log(`Add-ons already exist (${addOnsCount.length} found)`);
  }
  
  console.log("✅ Database seeded successfully");
}

// Run the seed function if this script is executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  seed()
    .catch(error => {
      console.error("Error seeding database:", error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}