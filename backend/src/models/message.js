const { Pool } = require('pg');
const pool = require('../utils/db');

class Message {
  static async create(senderId, receiverId, content) {
    const query = `
      INSERT INTO messages (sender_id, receiver_id, content, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const values = [senderId, receiverId, content];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getConversation(user1Id, user2Id) {
    const query = `
      SELECT m.*, 
             u1.username as sender_username,
             u2.username as receiver_username
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.receiver_id = u2.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `;
    const values = [user1Id, user2Id];
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getUserConversations(userId) {
    const query = `
      SELECT DISTINCT 
        CASE 
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END as other_user_id,
        CASE 
          WHEN m.sender_id = $1 THEN u2.username
          ELSE u1.username
        END as other_username,
        CASE 
          WHEN m.sender_id = $1 THEN u2.avatar_url
          ELSE u1.avatar_url
        END as other_avatar_url,
        m.content as last_message,
        m.created_at as last_message_time
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.receiver_id = u2.id
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      AND m.created_at = (
        SELECT MAX(created_at)
        FROM messages
        WHERE (sender_id = $1 AND receiver_id = CASE 
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END)
        OR (receiver_id = $1 AND sender_id = CASE 
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END)
      )
      ORDER BY m.created_at DESC
    `;
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = Message; 