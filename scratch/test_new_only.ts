import pg from 'pg';
const { Client } = pg;

const NEW_DATABASE_URL = "postgresql://postgres.vyacmzekznrhfhjsflen:tbLCbN1ebFONzlUo@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function test() {
  console.log("Connecting to NEW database...");
  const newClient = new Client({ connectionString: NEW_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await newClient.connect();
    console.log("SUCCESS!");
    await newClient.end();
  } catch (error) {
    console.error("FAILED:", error.message);
  }
}

test();
