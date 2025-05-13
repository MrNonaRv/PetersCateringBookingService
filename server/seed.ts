import { db } from "./db";
import { users, services, availability, customers, bookings } from "@shared/schema";
import { hash } from "bcrypt";

async function seed() {
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
  
  console.log("✅ Database seeded successfully");
}

// Import for SQL template literals
import { sql } from "drizzle-orm";

// Run the seed function
seed()
  .catch(error => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    // Close the database connection
    process.exit(0);
  });