import { db } from "./db";
import { dishes } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function insertMoreMenu() {
    if (!db) {
        console.log("⚠️ Database connection not available.");
        return;
    }

    console.log("🌱 Inserting More Menu Items...");

    const menuItems = [
        // Pork Menu
        { name: "Pork Adobo", description: "Tender pork braised in soy sauce, vinegar, and garlic.", category: "Pork Menu" },
        { name: "Pork Menudo", description: "Pork and liver stew with potatoes, carrots, and raisins.", category: "Pork Menu" },
        { name: "Bicol Express", description: "Pork stewed in coconut milk with chilies and shrimp paste.", category: "Pork Menu" },
        { name: "Sweet and Sour Pork", description: "Crispy pork chunks in tangy sweet and sour sauce.", category: "Pork Menu" },

        // Chicken Menu
        { name: "Chicken Curry", description: "Filipino style chicken curry with coconut milk and potatoes.", category: "Chicken Menu" },
        { name: "Chicken Inasal", description: "Grilled chicken marinated in calamansi, ginger, and lemongrass.", category: "Chicken Menu" },
        { name: "Chicken Afritada", description: "Chicken stew in tomato sauce with bell peppers and potatoes.", category: "Chicken Menu" },
        { name: "Chicken Pastel", description: "Creamy chicken stew with sausages and mushrooms under a crust.", category: "Chicken Menu" },

        // Beef Menu
        { name: "Beef Caldereta", description: "Rich beef stew with tomato sauce, liver spread, and cheese.", category: "Beef Menu" },
        { name: "Beef Steak (Bistek)", description: "Beef slices braised in soy sauce and calamansi with onions.", category: "Beef Menu" },
        { name: "Roast Beef with Mushroom Sauce", description: "Tender roast beef slices with savory mushroom gravy.", category: "Beef Menu" },
        { name: "Beef Broccoli", description: "Stir-fried beef with fresh broccoli in oyster sauce.", category: "Beef Menu" },

        // Fish Menu
        { name: "Fish Fillet with Tartar Sauce", description: "Breaded cream dory fillet served with creamy tartar sauce.", category: "Fish Menu" },
        { name: "Sweet and Sour Fish Fillet", description: "Crispy fish fillet in tangy sweet and sour sauce.", category: "Fish Menu" },
        { name: "Fish Fillet with White Sauce", description: "Steamed or fried fish fillet in creamy white sauce.", category: "Fish Menu" },

        // Appetizers (Pasta/Vegetables)
        { name: "Baked Macaroni", description: "Macaroni baked with meat sauce and creamy white topping.", category: "Appetizers (Pasta/Vegetables)" },
        { name: "Carbonara", description: "Pasta in rich white cream sauce with bacon and mushrooms.", category: "Appetizers (Pasta/Vegetables)" },
        { name: "Pancit Guisado", description: "Mixed noodles stir-fried with vegetables and meat.", category: "Appetizers (Pasta/Vegetables)" },
        { name: "Chopsuey", description: "Stir-fried mixed vegetables in savory thick sauce.", category: "Appetizers (Pasta/Vegetables)" },
        { name: "Mixed Vegetables with Quail Eggs", description: "Sautéed vegetables topped with boiled quail eggs.", category: "Appetizers (Pasta/Vegetables)" },

        // Dessert
        { name: "Fruit Salad", description: "Mixed fruits in sweetened cream.", category: "Dessert" },
        { name: "Coffee Jelly", description: "Coffee-flavored gelatin cubes in sweetened cream.", category: "Dessert" },
        { name: "Mango Float", description: "Layers of graham crackers, cream, and fresh mangoes.", category: "Dessert" },
        { name: "Cathedral Window", description: "Multi-colored jelly cubes in milk-based gelatin.", category: "Dessert" },

        // Standard Inclusions
        { name: "Red Carpet Entrance", description: "A elegant red carpet welcome for the guests.", category: "Standard Inclusions" },
        { name: "Uniformed Waiters", description: "Professional serving staff in uniform.", category: "Standard Inclusions" },
        { name: "Complete Chinaware/Silverware", description: "High-quality dining utensils and plates.", category: "Standard Inclusions" },
        { name: "Elegant Buffet Set-up", description: "Beautifully decorated buffet table matching the theme.", category: "Standard Inclusions" },

        // Freebies (Amenities)
        { name: "Photobooth (3 Hours)", description: "Unlimited photo prints with props.", category: "Freebies (Amenities)" },
        { name: "Mobile Bar", description: "Free-flowing cocktails and drinks.", category: "Freebies (Amenities)" },
        { name: "Event Host", description: "Professional master of ceremonies.", category: "Freebies (Amenities)" },
        { name: "Projector and Screen", description: "For AVP presentations and photos.", category: "Freebies (Amenities)" },
        { name: "2-Layer Themed Cake", description: "Customized cake matching your event theme.", category: "Freebies (Amenities)" }
    ];

    for (const item of menuItems) {
        // Check if item exists
        const existing = await db.select().from(dishes).where(sql`${dishes.name} = ${item.name} AND ${dishes.category} = ${item.category}`);
        if (existing.length === 0) {
            await db.insert(dishes).values({
                ...item,
                tags: [],
                additionalCost: 0
            });
            console.log(`✅ Added: ${item.name}`);
        }
    }

    console.log("✨ Menu expansion complete!");
}

// Run the script
import { fileURLToPath } from "url";
import path from "path";

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    insertMoreMenu()
        .catch((error) => {
            console.error("Error inserting menu:", error);
            process.exit(1);
        })
        .finally(() => {
            process.exit(0);
        });
}
