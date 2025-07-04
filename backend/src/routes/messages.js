const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/checkAdmin');

// Защищенные маршруты (требуют JWT токен)
router.post('/send', requireAuth, messageController.sendMessage);
router.get('/conversation/:userId', requireAuth, messageController.getConversation);
router.get('/conversations', requireAuth, messageController.getUserConversations);

module.exports = router; 