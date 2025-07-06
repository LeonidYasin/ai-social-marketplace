const Notification = require('../models/notification');

const notificationController = {
  // Получить все уведомления пользователя
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      
      const notifications = await Notification.getByUserId(userId, parseInt(limit), parseInt(offset));
      
      res.json({
        notifications,
        total: notifications.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  },

  // Получить непрочитанные уведомления
  async getUnreadNotifications(req, res) {
    try {
      const userId = req.user.id;
      
      console.log(`Getting unread notifications for user ${userId}`);
      
      const notifications = await Notification.getUnreadByUserId(userId);
      
      res.json({
        notifications,
        count: notifications.length
      });
    } catch (error) {
      console.error('Error getting unread notifications:', error);
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
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  },

  // Пометить уведомление как прочитанное
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      console.log(`Marking notification ${notificationId} as read for user ${userId}`);
      
      const notification = await Notification.markAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  // Пометить все уведомления как прочитанные
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      
      console.log(`Marking all notifications as read for user ${userId}`);
      
      const count = await Notification.markAllAsRead(userId);
      
      res.json({ success: true, count });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  },

  // Подтвердить доставку уведомления
  async markAsDelivered(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      console.log(`Marking notification ${notificationId} as delivered for user ${userId}`);
      
      const notification = await Notification.markAsDelivered(notificationId);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error marking notification as delivered:', error);
      res.status(500).json({ error: 'Failed to mark notification as delivered' });
    }
  },

  // Удалить уведомление
  async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      console.log(`Deleting notification ${notificationId} for user ${userId}`);
      
      // Проверяем, что уведомление принадлежит пользователю
      const result = await require('../utils/db').query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
        [notificationId, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  },

  // Очистить старые уведомления
  async clearOldNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { daysOld = 30 } = req.body;
      
      console.log(`Clearing notifications older than ${daysOld} days for user ${userId}`);
      
      const count = await Notification.deleteOld(userId, daysOld);
      
      res.json({ success: true, deletedCount: count });
    } catch (error) {
      console.error('Error clearing old notifications:', error);
      res.status(500).json({ error: 'Failed to clear old notifications' });
    }
  }
};

module.exports = notificationController; 