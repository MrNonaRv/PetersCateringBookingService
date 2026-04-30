import { storage } from "./server/storage";
import { db } from "./server/db";
import { dishes } from "./shared/schema";
import { eq } from "drizzle-orm";

async function fixCategories() {
  try {
    const allDishes = await storage.getDishes();
    console.log("Updating dish categories...");
    
    for (const d of allDishes) {
      let newCat = d.category;
      if (d.name.toLowerCase().includes("pork") || d.name.toLowerCase().includes("kawali")) newCat = "pork";
      else if (d.name.toLowerCase().includes("beef") || d.name.toLowerCase().includes("kare")) newCat = "beef";
      else if (d.name.toLowerCase().includes("chicken")) newCat = "chicken";
      else if (d.name.toLowerCase().includes("pancit") || d.name.toLowerCase().includes("lumpia")) newCat = "appetizer";
      else if (d.category === "dessert") newCat = "dessert";
      else if (d.category === "beverage") newCat = "beverage";
      else if (d.category === "side") newCat = "appetizer";
      else if (d.category === "main") newCat = "pork"; // Fallback for main

      if (newCat !== d.category) {
        console.log(`Updating ${d.name}: ${d.category} -> ${newCat}`);
        await db.update(dishes).set({ category: newCat }).where(eq(dishes.id, d.id));
      }
    }
    
    console.log("Done!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixCategories();
