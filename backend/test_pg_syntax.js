const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const id = 'a6ce2a8d-b950-480d-a033-c9eac35dec89';
    const log = JSON.stringify({ test: "data" });
    
    console.log('Testing array_append...');
    try {
        await pool.query('UPDATE executions SET logs = array_append(logs, $1::jsonb) WHERE id = $2', [log, id]);
        console.log('array_append worked');
    } catch (e) {
        console.error('array_append failed:', e.message);
    }

    console.log('Testing concatenation || ...');
    try {
        await pool.query('UPDATE executions SET logs = logs || ARRAY[$1::jsonb] WHERE id = $2', [log, id]);
        console.log('concatenation worked');
    } catch (e) {
        console.error('concatenation failed:', e.message);
    }

    console.log('Testing concatenation with casted logs ...');
    try {
        await pool.query('UPDATE executions SET logs = (logs::jsonb[] || $1::jsonb) WHERE id = $2', [log, id]);
        console.log('casted concatenation worked');
    } catch (e) {
        console.error('casted concatenation failed:', e.message);
    }

  } finally {
    await pool.end();
  }
}

test();
