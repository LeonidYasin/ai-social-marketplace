const db = require('../utils/db');

const Reaction = {
  async create({ userId, postId = null, commentId = null, type }) {
    const result = await db.query(
      `INSERT INTO reactions (user_id, post_id, comment_id, reaction_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, postId, commentId, type]
    );
    return result.rows[0];
  },

  async getForPost(postId) {
    const result = await db.query(
      `SELECT reaction_type, COUNT(*) as count FROM reactions WHERE post_id = $1 GROUP BY reaction_type`,
      [postId]
    );
    return result.rows;
  },

  async getForComment(commentId) {
    const result = await db.query(
      `SELECT reaction_type, COUNT(*) as count FROM reactions WHERE comment_id = $1 GROUP BY reaction_type`,
      [commentId]
    );
    return result.rows;
  },
};

module.exports = Reaction; 