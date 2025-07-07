/**
 * Контроллер уведомлений
 * ----------------------
 * Обрабатывает HTTP-запросы для работы с уведомлениями:
 *  - GET /api/notifications - получить все уведомления пользователя
 *  - GET /api/notifications/unread - получить непрочитанные
 *  - PUT /api/notifications/:id/read - пометить как прочитанное
 *  - PUT /api/notifications/:id/delivered - подтвердить доставку
 *
 * ВАЖНО:
 * - Все методы требуют аутентификации (requireAuth middleware)
 * - Логируются только критические ошибки и важные операции
 * - Детальное логирование происходит в модели Notification
 */

const Notification = require('../models/notification');

const notificationController = {
  // Получить все уведомления пользователя
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      
      console.log(`[NotificationController.getNotifications] userId=${userId}, limit=${limit}, offset=${offset}`);
      
      const notifications = await Notification.getByUserId(userId, parseInt(limit), parseInt(offset));
      
      console.log(`[NotificationController.getNotifications] OK, count=${notifications.length}`);
      
      res.json({
        notifications,
        total: notifications.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('[NotificationController.getNotifications] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  },

  // Получить непрочитанные уведомления
  async getUnreadNotifications(req, res) {
    try {
      const userId = req.user.id;
      
      console.log(`[NotificationController.getUnreadNotifications] userId=${userId}`);
      
      const notifications = await Notification.getUnreadByUserId(userId);
      
      console.log(`[NotificationController.getUnreadNotifications] OK, count=${notifications.length}`);
      
      res.json({
        notifications,
        count: notifications.length
      });
    } catch (error) {
      console.error('[NotificationController.getUnreadNotifications] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to get unread notifications' });
    }
  },

  // Получить количество непрочитанных уведомлений
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      
      const count = await Notification.getUnreadCount(userId);
      
      res.json({ count });
    } catch (error) {
      console.error('[NotificationController.getUnreadCount] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  },

  // Пометить уведомление как прочитанное
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      console.log(`[NotificationController.markAsRead] userId=${userId}, notificationId=${notificationId}`);
      
      const notification = await Notification.markAsRead(notificationId);
      
      if (!notification) {
        console.log(`[NotificationController.markAsRead] NOT_FOUND: notificationId=${notificationId}`);
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      console.log(`[NotificationController.markAsRead] OK`);
      res.json({ success: true, notification });
    } catch (error) {
      console.error('[NotificationController.markAsRead] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  // Пометить все уведомления как прочитанные
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      
      console.log(`[NotificationController.markAllAsRead] userId=${userId}`);
      
      const count = await Notification.markAllAsRead(userId);
      
      console.log(`[NotificationController.markAllAsRead] OK, count=${count}`);
      
      res.json({ success: true, count });
    } catch (error) {
      console.error('[NotificationController.markAllAsRead] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  },

  // Подтвердить доставку уведомления
  async markAsDelivered(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      console.log(`[NotificationController.markAsDelivered] userId=${userId}, notificationId=${notificationId}`);
      
      const notification = await Notification.markAsDelivered(notificationId);
      
      if (!notification) {
        console.log(`[NotificationController.markAsDelivered] NOT_FOUND: notificationId=${notificationId}`);
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      console.log(`[NotificationController.markAsDelivered] OK`);
      res.json({ success: true, notification });
    } catch (error) {
      console.error('[NotificationController.markAsDelivered] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to mark notification as delivered' });
    }
  },

  // Удалить уведомление
  async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      console.log(`[NotificationController.deleteNotification] userId=${userId}, notificationId=${notificationId}`);
      
      // Проверяем, что уведомление принадлежит пользователю
      const result = await require('../utils/db').query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
        [notificationId, userId]
      );
      
      if (result.rows.length === 0) {
        console.log(`[NotificationController.deleteNotification] NOT_FOUND: notificationId=${notificationId}`);
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      console.log(`[NotificationController.deleteNotification] OK`);
      res.json({ success: true });
    } catch (error) {
      console.error('[NotificationController.deleteNotification] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  },

  // Очистить старые уведомления
  async clearOldNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { daysOld = 30 } = req.body;
      
      console.log(`[NotificationController.clearOldNotifications] userId=${userId}, daysOld=${daysOld}`);
      
      const count = await Notification.deleteOld(userId, daysOld);
      
      console.log(`[NotificationController.clearOldNotifications] OK, deletedCount=${count}`);
      
      res.json({ success: true, deletedCount: count });
    } catch (error) {
      console.error('[NotificationController.clearOldNotifications] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to clear old notifications' });
    }
  }
};

module.exports = notificationController; 