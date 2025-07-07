/**
 * Контроллер сообщений
 * --------------------
 * Обрабатывает HTTP-запросы для работы с сообщениями:
 *  - POST /api/messages/send - отправить сообщение
 *  - GET /api/messages/conversation/:userId - получить историю сообщений
 *  - GET /api/messages/conversations - получить список диалогов
 *
 * ВАЖНО:
 * - При отправке сообщения автоматически создаётся уведомление
 * - Все методы требуют аутентификации (requireAuth middleware)
 * - Логируются только критические операции и ошибки
 */

const Message = require('../models/message');
const socketManager = require('../utils/socketManager');

const messageController = {
  // Отправить сообщение
  async sendMessage(req, res) {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.user.id; // ID из middleware requireAuth
      
      console.log(`[MessageController.sendMessage] senderId=${senderId}, receiverId=${receiverId}, content=${content.substring(0, 50)}...`);

      if (!content || !receiverId) {
        console.log(`[MessageController.sendMessage] ВАЛИДАЦИЯ: отсутствуют обязательные поля`);
        return res.status(400).json({ error: 'Content and receiverId are required' });
      }

      const message = await Message.create(senderId, receiverId, content);
      console.log(`[MessageController.sendMessage] Сообщение создано: messageId=${message.id}`);
      
      // Отправляем WebSocket уведомление
      try {
        console.log(`[MessageController.sendMessage] Начинаем создание уведомления...`);
        const sender = await require('../models/user').findById(senderId);
        const senderUsername = sender ? `${sender.first_name} ${sender.last_name}`.trim() || sender.username : 'Пользователь';
        console.log(`[MessageController.sendMessage] Отправитель найден: senderUsername=${senderUsername}`);
        
        // Получаем io из req.app.locals (будет установлено в app.js)
        const io = req.app.locals.io;
        console.log(`[MessageController.sendMessage] io доступен: ${!!io}`);
        
        console.log(`[MessageController.sendMessage] Вызываем sendMessageNotification...`);
        await socketManager.sendMessageNotification(message, senderUsername, io);
        console.log(`[MessageController.sendMessage] sendMessageNotification завершен`);
      } catch (error) {
        console.error('[MessageController.sendMessage] КРИТИЧЕСКАЯ ОШИБКА при создании уведомления:', error);
      }
      
      console.log(`[MessageController.sendMessage] OK, messageId=${message.id}`);
      res.status(201).json(message);
    } catch (error) {
      console.error('[MessageController.sendMessage] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },

  // Получить историю сообщений с пользователем
  async getConversation(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id; // ID из middleware requireAuth
      
      console.log(`[MessageController.getConversation] currentUserId=${currentUserId}, userId=${userId}`);

      const messages = await Message.getConversation(currentUserId, userId);
      console.log(`[MessageController.getConversation] OK, count=${messages.length}`);
      res.json(messages);
    } catch (error) {
      console.error('[MessageController.getConversation] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to get conversation' });
    }
  },

  // Получить список всех диалогов пользователя
  async getUserConversations(req, res) {
    try {
      const userId = req.user.id; // ID из middleware requireAuth

      const conversations = await Message.getUserConversations(userId);
      console.log(`[MessageController.getUserConversations] OK, count=${conversations.length}`);
      res.json(conversations);
    } catch (error) {
      console.error('[MessageController.getUserConversations] КРИТИЧЕСКАЯ ОШИБКА:', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  }
};

module.exports = messageController; 