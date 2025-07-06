const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/checkAdmin');

// Все маршруты требуют аутентификации
router.use(requireAuth);

// GET /api/notifications - получить все уведомления пользователя
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread - получить непрочитанные уведомления
router.get('/unread', notificationController.getUnreadNotifications);

// GET /api/notifications/unread/count - получить количество непрочитанных
router.get('/unread/count', notificationController.getUnreadCount);

// PUT /api/notifications/:notificationId/read - пометить уведомление как прочитанное
router.put('/:notificationId/read', notificationController.markAsRead);

// PUT /api/notifications/read/all - пометить все уведомления как прочитанные
router.put('/read/all', notificationController.markAllAsRead);

// PUT /api/notifications/:notificationId/delivered - подтвердить доставку уведомления
router.put('/:notificationId/delivered', notificationController.markAsDelivered);

// DELETE /api/notifications/:notificationId - удалить уведомление
router.delete('/:notificationId', notificationController.deleteNotification);

// DELETE /api/notifications/clear/old - очистить старые уведомления
router.delete('/clear/old', notificationController.clearOldNotifications);

module.exports = router; 