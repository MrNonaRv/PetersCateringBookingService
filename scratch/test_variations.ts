import pg from 'pg';
const { Client } = pg;

const PASS = "tbLCbN1ebFONzlUo";
const PROJ = "vyacmzekznrhfhjsflen";
const HOST = "aws-1-us-east-1.pooler.supabase.com";

async function testVariations() {
  const variations = [
    { name: "Standard Pooler", user: `postgres.${PROJ}`, db: "postgres", port: 6543 },
    { name: "Direct Port 5432", user: `postgres`, db: "postgres", host: `db.${PROJ}.supabase.co`, port: 5432 },
    { name: "Alternative Pooler", user: `postgres`, db: PROJ, port: 6543 }
  ];

  for (const v of variations) {
    console.log(`Testing: ${v.name}...`);
    const client = new Client({
      user: v.user,
      password: PASS,
      host: v.host || HOST,
      port: v.port,
      database: v.db,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`SUCCESS: ${v.name} worked!`);
      await client.end();
      return;
    } catch (e) {
      console.log(`FAILED: ${v.name} - ${e.message}`);
    }
  }
}

testVariations();
