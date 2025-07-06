const { Pool } = require('pg');
const pool = require('../utils/db');

class Message {
  // Создать или найти чат между двумя пользователями
  static async getOrCreateChat(user1Id, user2Id) {
    // Сначала ищем существующий чат между этими пользователями
    const existingChatQuery = `
      SELECT c.id 
      FROM chats c
      JOIN chat_participants cp1 ON c.id = cp1.chat_id
      JOIN chat_participants cp2 ON c.id = cp2.chat_id
      WHERE cp1.user_id = $1 AND cp2.user_id = $2
      AND c.is_group = false
      LIMIT 1
    `;
    
    let existingChat = await pool.query(existingChatQuery, [user1Id, user2Id]);
    
    if (existingChat.rows.length > 0) {
      return existingChat.rows[0].id;
    }
    
    // Создаем новый чат
    const createChatQuery = `
      INSERT INTO chats (name, is_group, created_at)
      VALUES ($1, false, NOW())
      RETURNING id
    `;
    
    const chatName = `Chat between ${user1Id} and ${user2Id}`;
    const newChat = await pool.query(createChatQuery, [chatName]);
    const chatId = newChat.rows[0].id;
    
    // Добавляем участников в чат
    await pool.query(
      'INSERT INTO chat_participants (chat_id, user_id, role, joined_at) VALUES ($1, $2, $3, NOW())',
      [chatId, user1Id, 'member']
    );
    
    await pool.query(
      'INSERT INTO chat_participants (chat_id, user_id, role, joined_at) VALUES ($1, $2, $3, NOW())',
      [chatId, user2Id, 'member']
    );
    
    return chatId;
  }

  // Создать сообщение (используя chat_id)
  static async create(senderId, receiverId, content) {
    try {
      // Получаем или создаем чат между пользователями
      const chatId = await this.getOrCreateChat(senderId, receiverId);
      
      const query = `
        INSERT INTO messages (chat_id, sender_id, content, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
      const values = [chatId, senderId, content];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  // Получить беседу между двумя пользователями
  static async getConversation(user1Id, user2Id) {
    try {
      // Получаем или создаем чат между пользователями
      const chatId = await this.getOrCreateChat(user1Id, user2Id);
      
      const query = `
        SELECT m.*, 
               u.username as sender_username,
               u.first_name as sender_first_name,
               u.last_name as sender_last_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = $1
        ORDER BY m.created_at ASC
      `;
      const values = [chatId];
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Получить список всех диалогов пользователя
  static async getUserConversations(userId) {
    try {
      const query = `
        SELECT DISTINCT 
          c.id as chat_id,
          c.name as chat_name,
          c.is_group,
          other_user.id as other_user_id,
          other_user.username as other_username,
          other_user.first_name as other_first_name,
          other_user.last_name as other_last_name,
          other_user.avatar_url as other_avatar_url,
          last_message.content as last_message,
          last_message.created_at as last_message_time
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        JOIN chat_participants cp2 ON c.id = cp2.chat_id
        JOIN users other_user ON cp2.user_id = other_user.id
        LEFT JOIN LATERAL (
          SELECT content, created_at
          FROM messages 
          WHERE chat_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) last_message ON true
        WHERE cp.user_id = $1 
        AND cp2.user_id != $1
        ORDER BY last_message.created_at DESC NULLS LAST
      `;
      const values = [userId];
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }
}

module.exports = Message; 