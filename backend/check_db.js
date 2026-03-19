const db = require('./src/models/db');

async function check() {
    try {
        const res = await db.query('SELECT * FROM executions ORDER BY started_at DESC LIMIT 5');
        console.log('Recent Executions:');
        res.rows.forEach(row => {
            console.log(`ID: ${row.id} | Status: ${row.status} | Step: ${row.current_step_id}`);
            console.log(`Logs: ${JSON.stringify(row.logs)}`);
            console.log('---');
        });
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        process.exit();
    }
}

check();
