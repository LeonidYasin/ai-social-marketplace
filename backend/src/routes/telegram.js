const express = require('express');
const router = express.Router();
const { 
  handleTelegramLogin, 
  getBotInfo 
} = require('../controllers/telegramController');

// Telegram OAuth маршруты
router.post('/login', handleTelegramLogin);
router.get('/bot-info', getBotInfo);

module.exports = router; 