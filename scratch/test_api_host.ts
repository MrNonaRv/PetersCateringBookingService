import pg from 'pg';
const { Client } = pg;

const PASS = "tbLCbN1ebFONzlUo";
const PROJ = "vyacmzekznrhfhjsflen";

async function test() {
  console.log("Testing API host as DB host...");
  const client = new Client({
    user: "postgres",
    password: PASS,
    host: `${PROJ}.supabase.co`,
    port: 5432,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("SUCCESS!");
    await client.end();
  } catch (e) {
    console.log(`FAILED: ${e.message}`);
  }
}

test();
