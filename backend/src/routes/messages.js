const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/checkAdmin');

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Отправить сообщение
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               toUserId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Сообщение отправлено
 */
router.post('/send', requireAuth, messageController.sendMessage);

/**
 * @swagger
 * /api/messages/conversation/{userId}:
 *   get:
 *     summary: Получить переписку с пользователем
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Сообщения переписки
 */
router.get('/conversation/:userId', requireAuth, messageController.getConversation);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Получить список всех переписок пользователя
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список переписок
 */
router.get('/conversations', requireAuth, messageController.getUserConversations);

module.exports = router; 