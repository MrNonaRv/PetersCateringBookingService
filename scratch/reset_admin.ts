import "dotenv/config";
import bcrypt from "bcrypt";
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const password = await bcrypt.hash("admin123", 10);
const result = await pool.query(
  "UPDATE users SET password = $1 WHERE username = $2 RETURNING username, role",
  [password, "admin"]
);
console.log("✅ Admin password reset to 'admin123':", result.rows);
await pool.end();
