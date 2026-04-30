import pg from 'pg';
const { Client } = pg;

const NEW_DATABASE_URL = "postgresql://postgres.vyacmzekznrhfhjsflen:Olanoko_1529@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function test() {
  const client = new Client({ connectionString: NEW_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Successfully connected to the NEW database!");
    await client.end();
  } catch (error) {
    console.error("Connection failed:", error.message);
    if (error.code === '28P01') {
      console.log("ERROR: The password 'Olanoko_1529' is incorrect for this database.");
    }
  }
}

test();
