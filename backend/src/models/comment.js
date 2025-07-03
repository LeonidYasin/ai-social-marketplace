// Пример модели комментария для PostgreSQL

const db = require('../utils/db');

const Comment = {
  async create({ postId, userId, content, parentId = null }) {
    const result = await db.query(
      `INSERT INTO comments (post_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [postId, userId, content, parentId]
    );
    return result.rows[0];
  },

  async findByPost(postId) {
    const result = await db.query(
      `SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC`,
      [postId]
    );
    return result.rows;
  },
};

module.exports = Comment; 