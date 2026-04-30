import pg from 'pg';
const { Client } = pg;

const NEW_DATABASE_URL = "postgresql://postgres.vyacmzekznrhfhjsflen:tbLCbN1ebFONzlUo@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function verify() {
  const client = new Client({ connectionString: NEW_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Connected to NEW database");

    const tables = ["users", "customers", "bookings", "services"];
    for (const table of tables) {
      const res = await client.query(`SELECT count(*) FROM "${table}"`);
      console.log(`Table '${table}' has ${res.rows[0].count} rows.`);
    }

    await client.end();
  } catch (e) {
    console.error("Verification failed:", e.message);
  }
}

verify();
