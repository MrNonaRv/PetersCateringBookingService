import { db } from "./db";
import { services, servicePackages, venues } from "@shared/schema";
import { sql } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";

export async function insertPackages() {
  if (!db) {
    console.log("⚠️ Database connection not available.");
    return;
  }

  console.log("🌱 Inserting Packages...");

  // 1. Ensure Services Exist
  let allServices = await db.select().from(services);

  let weddingService = allServices.find((s) => s.name === "Wedding Receptions");
  if (!weddingService) {
    [weddingService] = await db
      .insert(services)
      .values({
        name: "Wedding Receptions",
        description: "Make your special day unforgettable with our complete wedding catering service.",
        imageUrl: "https://images.unsplash.com/photo-1529636798458-92182e662485",
        basePrice: 150000,
        featured: true,
      })
      .returning();
  }

  let birthdayService = allServices.find((s) => s.name === "Birthday Celebrations");
  if (!birthdayService) {
    [birthdayService] = await db
      .insert(services)
      .values({
        name: "Birthday Celebrations",
        description: "Create lasting memories with custom birthday catering packages tailored to your theme and preferences.",
        imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3",
        basePrice: 80000,
        featured: false,
      })
      .returning();
  }

  let debutService = allServices.find((s) => s.name === "Debut Events" || s.name === "Debut (18th Birthday)");
  if (!debutService) {
    [debutService] = await db
      .insert(services)
      .values({
        name: "Debut (18th Birthday)",
        description: "Celebrate a magical 18th birthday with our comprehensive debut packages.",
        imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed",
        basePrice: 80000,
        featured: true,
      })
      .returning();
  }

  // 2. Deactivate old dummy packages under Wedding Receptions instead of deleting to prevent foreign key issues
  await db
    .update(servicePackages)
    .set({ isActive: false })
    .where(
      sql`${servicePackages.serviceId} = ${weddingService.id} AND ${servicePackages.name} IN ('Silver Wedding Package', 'Gold Wedding Package')`
    );
  
  // Also deactivate other old ones
  await db.update(servicePackages).set({ isActive: false }).where(sql`${servicePackages.name} LIKE '%Wedding Package%' AND ${servicePackages.name} NOT IN ('Diamond Wedding Package', 'Premium Wedding Package', 'Elegant Wedding Package')`);
  await db.update(servicePackages).set({ isActive: false }).where(sql`${servicePackages.name} = 'Debut Package'`);
  await db.update(servicePackages).set({ isActive: false }).where(sql`${servicePackages.name} = 'Birthday & Baptism Package'`);

  // 3. Insert Wedding Packages
  const weddingPackagesData = [
    {
      serviceId: weddingService.id,
      name: "Diamond Wedding Package",
      description: "₱235,000", // using description to show price explicitly
      pricePerPerson: 23500000,
      minGuests: 100, // No max specified, assuming standard min
      features: [
        "Entourage Flowers: Bridal bouquet, 2 mothers, 1 maid of honor, 4 bridesmaids, groom boutonniere, best man, 4 groomsmen, sponsors (male/female), 4 flower girls, 3 bearers",
        "Preparation/Coordination: Full coordination, prenup/supplier/timeline guides, budget allocation, on-the-day coordinators",
        "Premium Styling for Church: Aisle, arch, and candle-holder floral arrangements",
        "Reception Styling: Elegant stage design, Medium LED wall, Tunnel designs, Trusses for ceiling, Full lights and sounds, Smoke machine",
        "Elegant couch, table/chair setup for VIP/guests, elegant buffet and cake/souvenir setup, chandeliers",
        "Event host and Uniformed waiters",
        "Photo & Video Coverage: 2 photographers, 2 videographers, SDE video, prenup shoot, aerial shots",
        "Freebies: 5-layer cake, Wine for toasting",
      ],
      hasThemedCake: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      serviceId: weddingService.id,
      name: "Gold Wedding Package",
      description: "₱180,000 (Up to 300 pax)",
      pricePerPerson: 18000000,
      minGuests: 300,
      features: [
        "Entourage Flowers: Full set (Bridal, mothers, maid of honor, bridesmaids, groom, best man, groomsmen, sponsors, flower girls, bearers)",
        "Preparation/Coordination: Full coordination, prenup/supplier/timeline guides, on-the-day coordinators",
        "Premium Styling for Church: Aisle, arch, and candle-holder floral arrangements",
        "Reception Styling: Elegant stage design, Medium LED wall, Tunnel designs, Trusses for ceiling, Full lights and sounds, Smoke machine",
        "Elegant couch, complete table/chair setup, elegant buffet/cake tables, chandeliers",
        "Event host and Uniformed waiters",
      ],
      hasThemedCake: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      serviceId: weddingService.id,
      name: "Premium Wedding Package",
      description: "₱165,000 (Food & Catering 200 guests)",
      pricePerPerson: 16500000,
      minGuests: 200,
      features: [
        "Food & Catering: 4 main courses, Rice, Appetizer, 1 dessert, Soda and bottled water",
        "Church Aisle Décor: Fresh/artificial flowers, beautifully designed entrance arch",
        "Entourage Flowers: Bride/maid of honor, bridesmaids/flower girls, sponsors, boutonnieres",
        "Reception Styling: Elegant backdrop/couch, presidential/guest tables with centerpieces, ceiling decor with chandelier, red carpet/tunnel",
        "Pair of doves, Wine for toasting, Uniformed waiters, Photo and video documentation (Coverage & prenup)",
        "Freebies: 30 pcs invitations, 2-layer cake, on-the-day coordination, projector/screen, HMUA (bride on the day), bridal car with décor",
      ],
      hasThemedCake: true,
      isActive: true,
      sortOrder: 3,
    },
    {
      serviceId: weddingService.id,
      name: "Elegant Wedding Package",
      description: "₱125,000 (Food & Catering 100 guests)",
      pricePerPerson: 12500000,
      minGuests: 100,
      features: [
        "Food & Catering: 4 main courses, Rice, Appetizer, 1 dessert, Soda and bottled water",
        "Church Aisle Décor: Fresh/artificial flowers, entrance arch",
        "Entourage Flowers: Full basic set for bride, maid of honor, bridesmaids, flower girls, sponsors, male entourage",
        "Reception Styling: Elegant backdrop/couch, presidential/guest tables, ceiling decor/chandelier, red carpet/tunnel",
        "Pair of doves, Wine for toasting, Uniformed waiters, Projector and screen for prenup slide shows",
        "Freebies: Photobooth, 2-layer cake, 1 coordinator on the day, Bridal car bouquet, Welcome guest standee, Couple picture standee, Decorated mirror",
      ],
      hasThemedCake: true,
      isActive: true,
      sortOrder: 4,
    },
    {
      serviceId: weddingService.id,
      name: "Silver Wedding Package",
      description: "₱95,000 (Food Inclusion 100 pax)",
      pricePerPerson: 9500000,
      minGuests: 100,
      features: [
        "Food Inclusion: 4 main dishes, 1 vegetable dish, Rice, 1 dessert, Water/drinks (1 round)",
        "Venue Set-Up: Elegant stage, decorated tables/chairs, buffet table with lighting, cake/souvenir table, stage ceiling, tunnel entrance",
        "Church Decoration: Aisle decoration, entrance arch, candle stands",
        "Entourage Flowers: Full basic set",
        "Freebies: 2-layer cake, 1 bottle of wine, Use of mannequin, On-the-day coordination, Projector/screen, Pairs of doves",
      ],
      hasThemedCake: true,
      isActive: true,
      sortOrder: 5,
    },
  ];

  await db.insert(servicePackages).values(weddingPackagesData);
  console.log("Inserted standard Wedding Packages");

  // 4. Insert Wedding Complete Packages (Dynamic matrix)
  const completePackagesMatrix = [
    { guests: 100, prices: [120000, 135000, 145000] },
    { guests: 150, prices: [140000, 155000, 165000] },
    { guests: 200, prices: [160000, 175000, 185000] },
    { guests: 250, prices: [180000, 195000, 205000] },
    { guests: 300, prices: [200000, 215000, 225000] },
    { guests: 350, prices: [220000, 235000, 245000] },
  ];

  const completePackagesData = [];
  let sortOrderComplete = 6;

  for (const tier of completePackagesMatrix) {
    for (let i = 0; i < 3; i++) {
      const mains = i + 3;
      const price = tier.prices[i];
      completePackagesData.push({
        serviceId: weddingService.id,
        name: `Wedding Complete Package - ${tier.guests} Guests (${mains} Main Courses)`,
        description: `₱${(price).toLocaleString()} - Catering, Styling, Photo/Video`,
        pricePerPerson: price * 100,
        minGuests: tier.guests,
        features: [
          `Food & Catering: ${mains} main courses`,
          "Standard Inclusions: Complete catering setup with color motif, elegant backdrop/couch, presidential/guest tables, cake/gift table",
          "3-tier wedding cake, Projector/screen, Pair of doves and wine, Bridal car with flower décor, Church aisle decoration",
          "Basic documentary photo/video coverage, coverage with prenup pictorial, 100 4R digital prints, 1 framed 12×16 photo",
          "Entourage Flowers: Bride/groom, 6 pairs bridesmaids/groomsmen, 3 pairs secondary sponsors, 5 flower girl baskets, 40 principal sponsor corsages",
          "Freebies: Photobooth souvenir (3 hours), 50 pcs 3-page invitations, Choice of pica-pica station or dessert station",
        ],
        hasThemedCake: true,
        isActive: true,
        sortOrder: sortOrderComplete++,
      });
    }
  }

  await db.insert(servicePackages).values(completePackagesData);
  console.log("Inserted Wedding Complete Packages (Dynamic matrix)");

  // 5. Insert Debut Package
  await db.insert(servicePackages).values({
    serviceId: debutService.id,
    name: "Debut Package",
    description: "₱80,000 (Up to 100 pax)",
    pricePerPerson: 8000000,
    minGuests: 100,
    features: [
      "Food & Catering: 3 main courses, 1 appetizer, 1 dessert, steamed rice, 1 bottled water & Coke Sakto",
      "Venue Styling: Stage backdrop decoration, venue styling according to theme, use of elegant couch, complete table/chair set-up with cloth covers",
      "Service: Waiter to assist",
      "Program Inclusions: 18 roses, 18 candles, 18 shots",
      "Freebie: 2-layer themed cake",
    ],
    hasThemedCake: true,
    isActive: true,
    sortOrder: 1,
  });
  console.log("Inserted Debut Package");

  // 6. Insert Birthday & Baptism Package
  await db.insert(servicePackages).values({
    serviceId: birthdayService.id,
    name: "Birthday & Baptism Package",
    description: "₱35,000 (50–70 pax)",
    pricePerPerson: 3500000,
    minGuests: 50,
    maxGuests: 70,
    features: [
      "Food & Catering: 4 main courses, 1 appetizer, 1 dessert salad, steamed rice, 1 bottled water, 1 Coke Sakto",
      "Decoration: Stage/backdrop decoration, table/chair set-up with cloth covers, buffet table with complete chinaware and condiments",
      "Service: Waiter to assist",
      "Freebie: Themed cake",
    ],
    hasThemedCake: true,
    isActive: true,
    sortOrder: 1,
  });
  console.log("Inserted Birthday & Baptism Package");

  // 7. Insert Casa Amparo Rooms into Venues
  // First delete them if they already exist
  await db.delete(venues).where(sql`${venues.name} LIKE '%Casa Amparo%' AND ${venues.type} = 'room'`);
  
  await db.insert(venues).values([
    {
      name: "Casa Amparo Bridal Suite",
      description: "1 queen bed and 1 double bed. Good for 2 persons (max 4). Includes dining and living area, private bathroom.",
      address: "Casa Amparo Events Place",
      capacityMin: 1,
      capacityMax: 4,
      price: 280000, // 2800 * 100
      type: "room",
      imageUrl: "https://images.unsplash.com/photo-1611892440504-42a792e24d32",
      isAvailable: true,
    },
    {
      name: "Casa Amparo Premiere Deluxe Room",
      description: "1 double bed and 1 single bed. Good for 2 persons (max 4). Private bathroom.",
      address: "Casa Amparo Events Place",
      capacityMin: 1,
      capacityMax: 4,
      price: 200000, // 2000 * 100
      type: "room",
      imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427",
      isAvailable: true,
    },
    {
      name: "Casa Amparo Standard Deluxe Room",
      description: "2 single beds. Good for 2 persons (max 4). Private bathroom.",
      address: "Casa Amparo Events Place",
      capacityMin: 1,
      capacityMax: 4,
      price: 150000, // 1500 * 100
      type: "room",
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
      isAvailable: true,
    },
    {
      name: "Casa Amparo Family Room",
      description: "2 single beds and 1 double bed. Good for 4 persons (max 6). Private bathroom.",
      address: "Casa Amparo Events Place",
      capacityMin: 1,
      capacityMax: 6,
      price: 250000, // 2500 * 100
      type: "room",
      imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
      isAvailable: true,
    },
  ]);
  console.log("Inserted Casa Amparo Rooms");

  console.log("✅ Packages and venues successfully updated!");
}

// Run the script if executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  insertPackages()
    .catch((error) => {
      console.error("Error inserting packages:", error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}
