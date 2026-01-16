import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use SSL only for external databases (like Supabase)
const isExternalDb = connectionString.includes('supabase.co') || connectionString.includes('neon.tech');

export const pool = new Pool({ 
  connectionString,
  ...(isExternalDb ? { ssl: { rejectUnauthorized: false } } : {})
});
export const db = drizzle(pool, { schema });