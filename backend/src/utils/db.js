const { Pool } = require('pg');

const pool = new Pool({
  user: 'marketplace_user',
  host: 'localhost',
  database: 'marketplace_db',
  password: '1',
  port: 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
}; 