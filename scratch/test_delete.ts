
import { db } from "../server/db";
import { services } from "../shared/schema";
import { eq } from "drizzle-orm";

async function testDelete() {
  try {
    const idToDelete = 2; // Corporate Events
    console.log(`Testing deletion of Service ID: ${idToDelete}...`);
    const result = await db.delete(services).where(eq(services.id, idToDelete)).returning({ deletedId: services.id });
    console.log("Delete result:", result);
  } catch (error) {
    console.error("Delete failed:", error);
  } finally {
    process.exit();
  }
}

testDelete();
