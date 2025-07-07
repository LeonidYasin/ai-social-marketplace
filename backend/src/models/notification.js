/**
 * Модель Notification
 * -------------------
 * Отвечает за работу с таблицей notifications:
 *  - создание уведомлений (create)
 *  - получение всех уведомлений пользователя (getByUserId)
 *  - получение непрочитанных/недоставленных (getUnreadByUserId, getUndeliveredByUserId)
 *  - подтверждение доставки/прочтения (markAsDelivered, markAsRead, markAllAsRead)
 *  - удаление старых уведомлений (deleteOld)
 *
 * ВАЖНО:
 * - Уведомления создаются всегда, даже если пользователь офлайн
 * - Доставка и прочтение подтверждаются отдельно
 * - Все методы логируют свои действия для отладки
 *
 * Если возникают проблемы с уведомлениями:
 * 1. Проверьте, создаётся ли запись в notifications при отправке сообщения
 * 2. Проверьте, возвращает ли getByUserId уведомления для пользователя
 * 3. Проверьте, вызываются ли методы markAsDelivered/markAsRead
 * 4. Смотрите логи по ключевым словам: Notification, notifications, delivered, read
 */

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
      console.log(`[Notification.create] Создано уведомление для user ${userId}:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('[Notification.create] Ошибка:', error);
      throw error;
    }
  }

  // Получить все уведомления пользователя
  static async getByUserId(userId, limit = 50, offset = 0) {
    try {
      console.log(`[Notification.getByUserId] userId=${userId}, limit=${limit}, offset=${offset}`);
      const result = await query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      console.log(`[Notification.getByUserId] Найдено: ${result.rows.length}`);
      return result.rows;
    } catch (error) {
      console.error('[Notification.getByUserId] Ошибка:', error);
      throw error;
    }
  }

  // Получить непрочитанные уведомления пользователя
  static async getUnreadByUserId(userId) {
    try {
      console.log(`[Notification.getUnreadByUserId] userId=${userId}`);
      const result = await query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 AND is_read = FALSE 
         ORDER BY created_at DESC`,
        [userId]
      );
      console.log(`[Notification.getUnreadByUserId] Найдено: ${result.rows.length}`);
      return result.rows;
    } catch (error) {
      console.error('[Notification.getUnreadByUserId] Ошибка:', error);
      throw error;
    }
  }

  // Получить недоставленные уведомления пользователя
  static async getUndeliveredByUserId(userId) {
    try {
      console.log(`[Notification.getUndeliveredByUserId] userId=${userId}`);
      const result = await query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 AND is_delivered = FALSE 
         ORDER BY created_at ASC`,
        [userId]
      );
      console.log(`[Notification.getUndeliveredByUserId] Найдено: ${result.rows.length}`);
      return result.rows;
    } catch (error) {
      console.error('[Notification.getUndeliveredByUserId] Ошибка:', error);
      throw error;
    }
  }

  // Пометить уведомление как доставленное
  static async markAsDelivered(notificationId) {
    try {
      console.log(`[Notification.markAsDelivered] notificationId=${notificationId}`);
      const result = await query(
        `UPDATE notifications 
         SET is_delivered = TRUE, delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [notificationId]
      );
      if (result.rows.length > 0) {
        console.log(`[Notification.markAsDelivered] OK`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      console.error('[Notification.markAsDelivered] Ошибка:', error);
      throw error;
    }
  }

  // Пометить уведомление как прочитанное
  static async markAsRead(notificationId) {
    try {
      console.log(`[Notification.markAsRead] notificationId=${notificationId}`);
      const result = await query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [notificationId]
      );
      if (result.rows.length > 0) {
        console.log(`[Notification.markAsRead] OK`);
        return result.rows[0];
      }
      return null;
    } catch (error) {
      console.error('[Notification.markAsRead] Ошибка:', error);
      throw error;
    }
  }

  // Пометить все уведомления пользователя как прочитанные
  static async markAllAsRead(userId) {
    try {
      console.log(`[Notification.markAllAsRead] userId=${userId}`);
      const result = await query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND is_read = FALSE 
         RETURNING id`,
        [userId]
      );
      console.log(`[Notification.markAllAsRead] OK, count=${result.rows.length}`);
      return result.rows.length;
    } catch (error) {
      console.error('[Notification.markAllAsRead] Ошибка:', error);
      throw error;
    }
  }

  // Получить количество непрочитанных уведомлений
  static async getUnreadCount(userId) {
    try {
      console.log(`[Notification.getUnreadCount] userId=${userId}`);
      const result = await query(
        `SELECT COUNT(*) as count FROM notifications 
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );
      console.log(`[Notification.getUnreadCount] count=${result.rows[0].count}`);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('[Notification.getUnreadCount] Ошибка:', error);
      throw error;
    }
  }

  // Удалить старые уведомления (старше 30 дней)
  static async deleteOld(userId, daysOld = 30) {
    try {
      console.log(`[Notification.deleteOld] userId=${userId}, daysOld=${daysOld}`);
      const result = await query(
        `DELETE FROM notifications 
         WHERE user_id = $1 AND created_at < NOW() - INTERVAL '${daysOld} days' 
         RETURNING id`,
        [userId]
      );
      console.log(`[Notification.deleteOld] OK, count=${result.rows.length}`);
      return result.rows.length;
    } catch (error) {
      console.error('[Notification.deleteOld] Ошибка:', error);
      throw error;
    }
  }
}

module.exports = Notification; 