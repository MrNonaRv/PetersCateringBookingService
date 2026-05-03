import { pool } from "../server/db";

async function checkTables() {
  if (!pool) {
    console.log("No pool");
    return;
  }
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables in database:", res.rows.map(r => r.table_name));
  } catch (err) {
    console.error("Error checking tables:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkTables();
