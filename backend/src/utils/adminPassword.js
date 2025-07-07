const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const ADMIN_PASSWORD_KEY = 'admin_password';

async function getAdminPassword() {
  const result = await pool.query('SELECT value FROM settings WHERE key = $1', [ADMIN_PASSWORD_KEY]);
  if (result.rows.length > 0) return result.rows[0].value;
  // Если нет в базе — инициализируем из ENV
  if (process.env.ADMIN_PASSWORD) {
    await setAdminPassword(process.env.ADMIN_PASSWORD);
    return process.env.ADMIN_PASSWORD;
  }
  return null;
}

async function setAdminPassword(newPassword) {
  await pool.query(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
    [ADMIN_PASSWORD_KEY, newPassword]
  );
}

async function checkAdminPassword(password) {
  const current = await getAdminPassword();
  return password === current;
}

module.exports = {
  getAdminPassword,
  setAdminPassword,
  checkAdminPassword
}; 