import pg from 'pg';
const { Client } = pg;

// Trying Direct Connection instead of Pooler
const NEW_DATABASE_URL = "postgresql://postgres:Olanoko_1529@db.vyacmzekznrhfhjsflen.supabase.co:5432/postgres";

async function test() {
  console.log("Testing DIRECT connection...");
  const client = new Client({ connectionString: NEW_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Successfully connected to the NEW database via DIRECT connection!");
    await client.end();
  } catch (error) {
    console.error("Connection failed:", error.message);
  }
}

test();
