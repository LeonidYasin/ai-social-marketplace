const { query } = require('../utils/db');

class Notification {
  // Создать новое уведомление
  static async create(userId, type, message, title = null, data = null) {
    try {
      const result = await query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userId, type, title, message, data ? JSON.stringify(data) : null]
      );
      
      console.log(`Notification created for user ${userId}:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Получить все уведомления пользователя
  static async getByUserId(userId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting notifications by user ID:', error);
      throw error;
    }
  }

  // Получить непрочитанные уведомления пользователя
  static async getUnreadByUserId(userId) {
    try {
      const result = await query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 AND is_read = FALSE 
         ORDER BY created_at DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      throw error;
    }
  }

  // Получить недоставленные уведомления пользователя
  static async getUndeliveredByUserId(userId) {
    try {
      const result = await query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 AND is_delivered = FALSE 
         ORDER BY created_at ASC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting undelivered notifications:', error);
      throw error;
    }
  }

  // Пометить уведомление как доставленное
  static async markAsDelivered(notificationId) {
    try {
      const result = await query(
        `UPDATE notifications 
         SET is_delivered = TRUE, delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [notificationId]
      );
      
      if (result.rows.length > 0) {
        console.log(`Notification ${notificationId} marked as delivered`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      console.error('Error marking notification as delivered:', error);
      throw error;
    }
  }

  // Пометить уведомление как прочитанное
  static async markAsRead(notificationId) {
    try {
      const result = await query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [notificationId]
      );
      
      if (result.rows.length > 0) {
        console.log(`Notification ${notificationId} marked as read`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Пометить все уведомления пользователя как прочитанные
  static async markAllAsRead(userId) {
    try {
      const result = await query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND is_read = FALSE 
         RETURNING id`,
        [userId]
      );
      
      console.log(`Marked ${result.rows.length} notifications as read for user ${userId}`);
      return result.rows.length;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Получить количество непрочитанных уведомлений
  static async getUnreadCount(userId) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM notifications 
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Удалить старые уведомления (старше 30 дней)
  static async deleteOld(userId, daysOld = 30) {
    try {
      const result = await query(
        `DELETE FROM notifications 
         WHERE user_id = $1 AND created_at < NOW() - INTERVAL '${daysOld} days' 
         RETURNING id`,
        [userId]
      );
      
      console.log(`Deleted ${result.rows.length} old notifications for user ${userId}`);
      return result.rows.length;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
}

module.exports = Notification; 