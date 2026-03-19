const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    const res = await pool.query("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'executions'");
    console.log('Triggers:', JSON.stringify(res.rows));
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await pool.end();
  }
}

check();
