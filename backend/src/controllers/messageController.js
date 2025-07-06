const Message = require('../models/message');
const socketManager = require('../utils/socketManager');

const messageController = {
  // Отправить сообщение
  async sendMessage(req, res) {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.user.id; // ID из middleware requireAuth
      
      console.log('sendMessage - receiverId:', receiverId);
      console.log('sendMessage - content:', content);
      console.log('sendMessage - senderId:', senderId);

      if (!content || !receiverId) {
        return res.status(400).json({ error: 'Content and receiverId are required' });
      }

      const message = await Message.create(senderId, receiverId, content);
      console.log('sendMessage - message created:', message);
      
      // Отправляем WebSocket уведомление
      try {
        console.log('messageController: Начинаем создание уведомления...');
        const sender = await require('../models/user').findById(senderId);
        const senderUsername = sender ? `${sender.first_name} ${sender.last_name}`.trim() || sender.username : 'Пользователь';
        console.log('messageController: Отправитель найден:', senderUsername);
        
        // Получаем io из req.app.locals (будет установлено в app.js)
        const io = req.app.locals.io;
        console.log('messageController: io доступен:', !!io);
        
        console.log('messageController: Вызываем sendMessageNotification...');
        await socketManager.sendMessageNotification(message, senderUsername, io);
        console.log('messageController: sendMessageNotification завершен');
      } catch (error) {
        console.error('messageController: Error sending WebSocket notification:', error);
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },

  // Получить историю сообщений с пользователем
  async getConversation(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id; // ID из middleware requireAuth
      
      console.log('getConversation - userId:', userId);
      console.log('getConversation - currentUserId:', currentUserId);

      const messages = await Message.getConversation(currentUserId, userId);
      console.log('getConversation - messages found:', messages.length);
      res.json(messages);
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({ error: 'Failed to get conversation' });
    }
  },

  // Получить список всех диалогов пользователя
  async getUserConversations(req, res) {
    try {
      const userId = req.user.id; // ID из middleware requireAuth

      const conversations = await Message.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  }
};

module.exports = messageController; 