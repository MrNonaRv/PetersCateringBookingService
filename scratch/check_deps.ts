
import { db } from "../server/db";
import { services, servicePackages, bookings } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function checkDependencies() {
  try {
    console.log("Checking for services and their bookings...");
    const servicesList = await db.select().from(services);
    for (const service of servicesList) {
      const bookingsCount = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.serviceId, service.id));
      const packagesCount = await db.select({ count: sql<number>`count(*)` }).from(servicePackages).where(eq(servicePackages.serviceId, service.id));
      console.log(`Service: ${service.name} (ID: ${service.id}) - Bookings: ${bookingsCount[0].count}, Packages: ${packagesCount[0].count}`);
    }

    console.log("\nChecking for packages and their bookings...");
    const packagesList = await db.select().from(servicePackages);
    for (const pkg of packagesList) {
      const bookingsCount = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.packageId, pkg.id));
      console.log(`Package: ${pkg.name} (ID: ${pkg.id}) - Bookings: ${bookingsCount[0].count}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

checkDependencies();
