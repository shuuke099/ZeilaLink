import dotenv from "dotenv";
import path from "path";

// Correct path: current backend folder
const envPath = path.join(process.cwd(), ".env");

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("[ENV] ❌ Failed to load .env from:", envPath);
} else {
  console.log("[ENV] ✅ Loaded .env from:", envPath);
}

// Debug
console.log("[ENV] EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");
console.log("[ENV] EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");
