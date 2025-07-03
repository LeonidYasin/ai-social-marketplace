const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Отправить сообщение
router.post('/send', messageController.sendMessage);

// Получить историю сообщений с пользователем
router.get('/conversation/:userId', messageController.getConversation);

// Получить список всех диалогов пользователя
router.get('/conversations', messageController.getUserConversations);

module.exports = router; 