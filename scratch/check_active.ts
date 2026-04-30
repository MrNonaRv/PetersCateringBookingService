import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = "postgresql://postgres.vyacmzekznrhfhjsflen:tbLCbN1ebFONzlUo@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function check() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Connected to database");

    const res = await client.query(`SELECT name, is_active FROM service_packages LIMIT 5`);
    console.table(res.rows);

    const res2 = await client.query(`SELECT name, featured FROM services LIMIT 5`);
    console.table(res2.rows);

    await client.end();
  } catch (e) {
    console.error("Check failed:", e.message);
  }
}

check();
