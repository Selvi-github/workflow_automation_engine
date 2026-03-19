const db = require('./src/models/db');

async function check() {
    try {
        const res = await db.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'executions'
        `);
        console.log('Executions table schema:');
        res.rows.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type} (${col.udt_name})`);
        });
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        process.exit();
    }
}

check();
