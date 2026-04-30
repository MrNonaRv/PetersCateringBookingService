import "dotenv/config";
import { isSMSConfigured } from "../server/sms";

console.log("Checking SMS Configuration...");
console.log("IPROGSMS_API_TOKEN set:", !!process.env.IPROGSMS_API_TOKEN);
console.log("isSMSConfigured() returns:", isSMSConfigured());

if (isSMSConfigured()) {
    console.log("✅ SMS is correctly configured.");
} else {
    console.log("❌ SMS is NOT configured.");
}
