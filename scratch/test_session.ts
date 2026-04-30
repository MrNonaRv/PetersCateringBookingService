import pg from 'pg';
const { Client } = pg;

const URL = "postgresql://postgres.vyacmzekznrhfhjsflen:tbLCbN1ebFONzlUo@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function test() {
  console.log("Testing Session Mode Pooler (5432)...");
  const client = new Client({ connectionString: URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("SUCCESS!");
    await client.end();
  } catch (e) {
    console.log(`FAILED: ${e.message}`);
  }
}

test();
