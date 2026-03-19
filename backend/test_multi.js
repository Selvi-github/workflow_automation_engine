const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const id = 'a6ce2a8d-b950-480d-a033-c9eac35dec89';
    const log = JSON.stringify({ test: "multi-column" });
    const status = 'in_progress';
    
    console.log('Testing multi-column update with array_append ...');
    try {
        const query = 'UPDATE executions SET status = $1, logs = array_append(logs, $2::jsonb), updated_at = CURRENT_TIMESTAMP WHERE id = $3';
        const params = [status, log, id];
        await pool.query(query, params);
        console.log('array_append multi-column worked');
    } catch (e) {
        console.error('array_append multi-column failed:', e.message);
    }

  } finally {
    await pool.end();
  }
}

test();
