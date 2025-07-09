const express = require('express');
const router = express.Router();
const { 
  handleTelegramLogin, 
  getBotInfo 
} = require('../controllers/telegramController');

/**
 * @swagger
 * /api/telegram/login:
 *   post:
 *     summary: Вход через Telegram OAuth
 *     tags: [Telegram]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegramId:
 *                 type: string
 *               authData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Успешная аутентификация через Telegram
 */
router.post('/login', handleTelegramLogin);

/**
 * @swagger
 * /api/telegram/bot-info:
 *   get:
 *     summary: Получить информацию о Telegram-боте
 *     tags: [Telegram]
 *     responses:
 *       200:
 *         description: Информация о боте
 */
router.get('/bot-info', getBotInfo);

module.exports = router; 