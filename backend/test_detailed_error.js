const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const id = 'a6ce2a8d-b950-480d-a033-c9eac35dec89';
    const log = JSON.stringify({ test: "data" });
    const query = 'UPDATE executions SET status = $1, logs = logs || ARRAY[$2::jsonb], updated_at = CURRENT_TIMESTAMP WHERE id = $3';
    await pool.query(query, ['failed', log, id]);
    console.log('Success');
  } catch (err) {
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    console.error('Detail:', err.detail);
    console.error('Hint:', err.hint);
    console.error('Position:', err.position);
    console.error('Where:', err.where);
    console.error('Schema:', err.schema);
    console.error('Table:', err.table);
    console.error('Column:', err.column);
    console.error('DataType:', err.dataType);
    console.error('Constraint:', err.constraint);
    console.error('File:', err.file);
    console.error('Line:', err.line);
    console.error('Routine:', err.routine);
  } finally {
    await pool.end();
  }
}

test();
