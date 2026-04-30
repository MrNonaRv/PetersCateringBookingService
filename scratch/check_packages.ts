import "dotenv/config";
import { storage } from "../server/storage";

async function checkPackages() {
    console.log("Fetching packages...");
    const packages = await storage.getServicePackages();
    console.log("Found packages:", JSON.stringify(packages, null, 2));
}

checkPackages().catch(console.error);
