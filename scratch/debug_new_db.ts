import pg from 'pg';
const { Client } = pg;

const NEW_DATABASE_URL = "postgresql://postgres.vyacmzekznrhfhjsflen:tbLCbN1ebFONzlUo@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function debug() {
  const client = new Client({ connectionString: NEW_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Connected to NEW database");

    console.log("--- Users ---");
    const users = await client.query(`SELECT id, username, name, role FROM users`);
    console.table(users.rows);

    console.log("--- Service Packages ---");
    const packages = await client.query(`SELECT id, name, "service_id" FROM service_packages`);
    console.table(packages.rows);

    await client.end();
  } catch (e) {
    console.error("Debug failed:", e.message);
  }
}

debug();
