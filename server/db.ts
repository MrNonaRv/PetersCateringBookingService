import "dotenv/config";
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.warn("Neither DATABASE_URL nor POSTGRES_URL is set. Running in in-memory mode.");
} else {
  console.log("Database connection string detected.");
}

// Use SSL for external databases (like Supabase, Neon)
const isExternalDb = connectionString?.includes('supabase.com') || 
                     connectionString?.includes('pooler.supabase.com') || 
                     connectionString?.includes('neon.tech');

let pool: any = null;
try {
  pool = connectionString ? new Pool({ 
    connectionString,
    ssl: isExternalDb ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000, // 10s timeout
  }) : null;

  if (pool) {
    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle client', err);
    });
  }
} catch (error) {
  console.error("Failed to create database pool:", error);
}

export { pool };
export const db = pool ? drizzle(pool, { schema }) : null;