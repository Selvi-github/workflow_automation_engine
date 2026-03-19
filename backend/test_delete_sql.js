const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDeleteSql() {
  try {
    const res = await pool.query('SELECT id FROM workflows LIMIT 1');
    if (res.rows.length === 0) return console.log("No workflows.");
    const id = res.rows[0].id;
    console.log("Testing delete for workflow:", id);
    
    await pool.query('BEGIN');
    
    try {
        console.log("1. Deleting rules...");
        await pool.query('DELETE FROM rules WHERE step_id IN (SELECT id FROM steps WHERE workflow_id = $1)', [id]);
        
        console.log("2. Deleting executions...");
        await pool.query('DELETE FROM executions WHERE workflow_id = $1', [id]);
        
        console.log("3. Deleting steps...");
        await pool.query('DELETE FROM steps WHERE workflow_id = $1', [id]);
        
        console.log("4. Deleting workflow...");
        await pool.query('DELETE FROM workflows WHERE id = $1', [id]);
        
        await pool.query('ROLLBACK');
        console.log("All queries executed successfully.");
    } catch (e) {
        console.error("SQL Error during transaction:", e.message);
        console.error("Details:", e.detail);
        await pool.query('ROLLBACK');
    }
  } finally {
    await pool.end();
  }
}

testDeleteSql();
