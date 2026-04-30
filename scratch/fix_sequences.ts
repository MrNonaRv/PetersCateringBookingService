import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fixSequences() {
    if (!db) return;
    console.log("Fixing database sequences...");
    
    const tables = [
        "users", "capacity_calendar", "dishes", "add_ons", "venues", 
        "custom_quotes", "booking_dishes", "booking_add_ons", 
        "services", "service_packages", "availability", 
        "customers", "bookings", "recent_events", "payment_settings",
        "gallery_images"
    ];

    for (const table of tables) {
        try {
            const seqName = `${table}_id_seq`;
            console.log(`Resetting sequence for ${table}...`);
            // This SQL resets the sequence to the current max ID + 1
            await db.execute(sql.raw(`SELECT setval('${seqName}', (SELECT MAX(id) FROM ${table}));`));
        } catch (error: any) {
            console.log(`Could not reset sequence for ${table}: ${error.message}`);
        }
    }
    
    console.log("✅ Sequences fixed!");
}

fixSequences().catch(console.error);
