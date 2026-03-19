const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  const executionId = 'a6ce2a8d-b950-480d-a033-c9eac35dec89';
  const status = 'failed_test';
  
  const query = 'UPDATE executions SET status = $1 WHERE id = $2';
  const params = [status, executionId];
  
  try {
    const res = await pool.query(query, params);
    console.log('Update success:', res.rowCount);
  } catch (err) {
    console.error('Update failed ERROR:', err);
  } finally {
    await pool.end();
  }
}

check();
