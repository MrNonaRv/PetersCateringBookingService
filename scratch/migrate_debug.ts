import pg from 'pg';
const { Client } = pg;

const OLD_DATABASE_URL = "postgresql://postgres.ovbjvahgjqcjurqgebbt:Olanoko_1529@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";
const NEW_DATABASE_URL = "postgresql://postgres.vyacmzekznrhfhjsflen:tbLCbN1ebFONzlUo@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

async function migrate() {
  const oldClient = new Client({ connectionString: OLD_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const newClient = new Client({ connectionString: NEW_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    console.log("Connecting to OLD database...");
    await oldClient.connect();
    console.log("SUCCESS: Connected to OLD database");

    console.log("Connecting to NEW database...");
    await newClient.connect();
    console.log("SUCCESS: Connected to NEW database");

    // ... migration logic ...
  } catch (error) {
    console.error("Migration failed at connection stage:");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
  } finally {
    await oldClient.end().catch(() => {});
    await newClient.end().catch(() => {});
  }
}

migrate();
