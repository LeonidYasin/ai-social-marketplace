const Message = require('../models/message');
const jwt = require('jsonwebtoken');

const messageController = {
  // Отправить сообщение
  async sendMessage(req, res) {
    try {
      const { receiverId, content } = req.body;
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const senderId = decoded.userId;

      if (!content || !receiverId) {
        return res.status(400).json({ error: 'Content and receiverId are required' });
      }

      const message = await Message.create(senderId, receiverId, content);
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
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUserId = decoded.userId;

      const messages = await Message.getConversation(currentUserId, userId);
      res.json(messages);
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({ error: 'Failed to get conversation' });
    }
  },

  // Получить список всех диалогов пользователя
  async getUserConversations(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      const conversations = await Message.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  }
};

module.exports = messageController; 