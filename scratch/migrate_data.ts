import pg from 'pg';
const { Client } = pg;

const OLD_DATABASE_URL = "postgresql://postgres.ovbjvahgjqcjurqgebbt:Olanoko_1529@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";
const NEW_DATABASE_URL = "postgresql://postgres.vyacmzekznrhfhjsflen:tbLCbN1ebFONzlUo@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function migrate() {
  const oldClient = new Client({ connectionString: OLD_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const newClient = new Client({ connectionString: NEW_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await oldClient.connect();
    console.log("Connected to old database");
    await newClient.connect();
    console.log("Connected to new database");

    // List of tables in dependency order
    const tables = [
      "users",
      "customers",
      "services",
      "service_packages",
      "dishes",
      "add_ons",
      "venues",
      "availability",
      "capacity_calendar",
      "recent_events",
      "gallery_images",
      "payment_settings",
      "bookings",
      "package_dishes",
      "booking_dishes",
      "booking_add_ons",
      "custom_quotes",
      "session"
    ];

    for (const table of tables) {
      console.log(`Migrating table: ${table}...`);
      
      // Check if table exists in old db
      const tableCheck = await oldClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);

      if (!tableCheck.rows[0].exists) {
        console.log(`Table ${table} does not exist in old database, skipping.`);
        continue;
      }

      // Fetch data from old db
      const result = await oldClient.query(`SELECT * FROM "${table}"`);
      if (result.rows.length === 0) {
        console.log(`Table ${table} is empty, skipping.`);
        continue;
      }

      console.log(`Found ${result.rows.length} rows in ${table}`);

      // Clear existing data in new db (optional but safer for clean migration)
      // await newClient.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);

      const columns = Object.keys(result.rows[0]);
      const columnNames = columns.map(c => `"${c}"`).join(', ');
      
      for (const row of result.rows) {
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        await newClient.query({
          text: `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values: values
        });
      }
      
      console.log(`Successfully migrated ${table}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

migrate();
