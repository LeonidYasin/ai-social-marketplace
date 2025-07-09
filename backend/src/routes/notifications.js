const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/checkAdmin');

// Все маршруты требуют аутентификации
router.use(requireAuth);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Получить все уведомления пользователя
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список уведомлений
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Получить непрочитанные уведомления
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список непрочитанных уведомлений
 */
router.get('/unread', notificationController.getUnreadNotifications);

/**
 * @swagger
 * /api/notifications/unread/count:
 *   get:
 *     summary: Получить количество непрочитанных уведомлений
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество непрочитанных уведомлений
 */
router.get('/unread/count', notificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Пометить уведомление как прочитанное
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID уведомления
 *     responses:
 *       200:
 *         description: Уведомление помечено как прочитанное
 */
router.put('/:notificationId/read', notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/read/all:
 *   put:
 *     summary: Пометить все уведомления как прочитанные
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Все уведомления помечены как прочитанные
 */
router.put('/read/all', notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{notificationId}/delivered:
 *   put:
 *     summary: Подтвердить доставку уведомления
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID уведомления
 *     responses:
 *       200:
 *         description: Уведомление помечено как доставленное
 */
router.put('/:notificationId/delivered', notificationController.markAsDelivered);

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Удалить уведомление
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID уведомления
 *     responses:
 *       200:
 *         description: Уведомление удалено
 */
router.delete('/:notificationId', notificationController.deleteNotification);

/**
 * @swagger
 * /api/notifications/clear/old:
 *   delete:
 *     summary: Очистить старые уведомления
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Старые уведомления удалены
 */
router.delete('/clear/old', notificationController.clearOldNotifications);

module.exports = router; 