const db = require('../utils/db');

const Post = {
  async create({ userId, content, mediaUrl, category, privacy }) {
    const result = await db.query(
      `INSERT INTO posts (user_id, content, media_url, category, privacy)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, content, mediaUrl, category, privacy]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query(
      `SELECT * FROM posts WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async getFeed(limit = 20, offset = 0) {
    const result = await db.query(
      `SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },
};

module.exports = Post; 