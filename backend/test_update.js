const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  const executionId = 'a6ce2a8d-b950-480d-a033-c9eac35dec89'; // Using the one from logs
  const status = 'failed';
  const errorJson = JSON.stringify({ error: "Test error", timestamp: new Date().toISOString() });
  
  const query = 'UPDATE executions SET logs = logs || $2::jsonb WHERE id = $3';
  const params = [status, errorJson, executionId];
  
  try {
    const res = await pool.query(query, params);
    console.log('Update success:', res.rowCount);
  } catch (err) {
    console.error('Update failed ERROR:', err);
    console.error('Error detail:', JSON.stringify(err));
  } finally {
    await pool.end();
  }
}

check();
