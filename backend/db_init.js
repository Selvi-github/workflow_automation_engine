const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use the environment variable or paste your connection string here
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ ERROR: No DATABASE_URL found in .env');
    console.log('Please add: DATABASE_URL=your_render_external_url_here to backend/.env');
    process.exit(1);
}

const pool = new Pool({ connectionString });

async function initialize() {
    console.log('🚀 Connecting to production database...');
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'init_prod.sql'), 'utf8');
        await pool.query(sql);
        console.log('✅ SUCCESS: All tables created perfectly!');
        process.exit(0);
    } catch (err) {
        console.error('❌ FAILED:', err.message);
        process.exit(1);
    }
}

initialize();
