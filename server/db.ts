import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Running in in-memory mode.");
}

// Use SSL for external databases (like Supabase, Neon)
const isExternalDb = connectionString?.includes('supabase.com') || 
                     connectionString?.includes('pooler.supabase.com') || 
                     connectionString?.includes('neon.tech');

export const pool = connectionString ? new Pool({ 
  connectionString,
  ssl: isExternalDb ? { rejectUnauthorized: false } : false
}) : null;

export const db = pool ? drizzle(pool, { schema }) : null;