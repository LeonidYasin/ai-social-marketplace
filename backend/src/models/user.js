// Пример модели пользователя для PostgreSQL

const db = require('../utils/db');

const User = {
  async create({ name, email, avatar, provider, providerId }) {
    const result = await db.query(
      `INSERT INTO users (name, email, avatar, provider, provider_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, avatar, provider, providerId]
    );
    return result.rows[0];
  },

  async findByProvider(provider, providerId) {
    const result = await db.query(
      `SELECT * FROM users WHERE provider = $1 AND provider_id = $2`,
      [provider, providerId]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },
};

module.exports = User; 