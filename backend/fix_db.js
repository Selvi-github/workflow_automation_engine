const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fix() {
  try {
    console.log('--- Fixing Database ---');
    
    // 1. Add pending_approval to ENUM if not exists
    // ALTER TYPE cannot be run inside a transaction in some PG versions/drivers easily
    try {
      await pool.query("ALTER TYPE execution_status ADD VALUE IF NOT EXISTS 'pending_approval'");
      console.log('Added pending_approval to execution_status');
    } catch (e) {
      if (e.code === '42710') { // duplicate_object
        console.log('pending_approval already exists');
      } else {
        throw e;
      }
    }

    // 2. Fix corrupted start_step_id
    const workflows = await pool.query('SELECT id, name FROM workflows');
    for (const wf of workflows.rows) {
      const steps = await pool.query('SELECT id FROM steps WHERE workflow_id = $1 ORDER BY step_order LIMIT 1', [wf.id]);
      if (steps.rows.length > 0) {
        const firstStepId = steps.rows[0].id;
        await pool.query('UPDATE workflows SET start_step_id = $1 WHERE id = $2', [firstStepId, wf.id]);
        console.log(`Updated workflow ${wf.name} start_step_id to ${firstStepId}`);
      }
    }

    console.log('--- Fix Complete ---');
  } catch (err) {
    console.error('Fix failed:', err);
  } finally {
    await pool.end();
  }
}

fix();
