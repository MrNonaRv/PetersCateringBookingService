import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = "postgresql://postgres.vyacmzekznrhfhjsflen:tbLCbN1ebFONzlUo@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function wipe() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Connected to database for WIPE");

    // Dropping the public schema and recreating it is the fastest way to wipe a Supabase DB
    await client.query(`DROP SCHEMA public CASCADE;`);
    await client.query(`CREATE SCHEMA public;`);
    await client.query(`GRANT ALL ON SCHEMA public TO postgres;`);
    await client.query(`GRANT ALL ON SCHEMA public TO public;`);

    console.log("SUCCESS: Database has been wiped clean.");
    await client.end();
  } catch (e) {
    console.error("Wipe failed:", e.message);
  }
}

wipe();
