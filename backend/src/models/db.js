const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to PostgreSQL database');
  release();
});

module.exports = {
  query: (text, params) => {
    console.log('SQL QUERY:', text);
    console.log('SQL PARAMS:', JSON.stringify(params));
    return pool.query(text, params);
  },
};
