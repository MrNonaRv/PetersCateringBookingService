import { storage } from "./server/storage";

async function checkDishes() {
  try {
    const allDishes = await storage.getDishes();
    console.log("Dishes with categories:");
    allDishes.forEach(d => {
      console.log(`- ${d.name} [${d.category}]`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDishes();
