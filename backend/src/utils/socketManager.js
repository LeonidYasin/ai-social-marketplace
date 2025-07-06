// Хранилище онлайн пользователей
const onlineUsers = new Map();

// Функция для отправки уведомления о новом сообщении
const sendMessageNotification = async (message, senderUsername, io) => {
  try {
    // Нужно найти получателя через chat_participants
    const { Pool } = require('pg');
    const pool = require('../utils/db');
    
    // Находим получателя через chat_participants
    const receiverQuery = `
      SELECT cp.user_id 
      FROM chat_participants cp 
      WHERE cp.chat_id = $1 AND cp.user_id != $2
      LIMIT 1
    `;
    
    const receiverResult = await pool.query(receiverQuery, [message.chat_id, message.sender_id]);
    
    if (receiverResult.rows.length === 0) {
      return;
    }
    
    const receiverId = receiverResult.rows[0].user_id;
    
    // Создаем уведомление в базе данных
    const Notification = require('../models/notification');
    const notificationData = {
      sender_id: message.sender_id,
      chat_id: message.chat_id,
      message_id: message.id
    };
    
    const notification = await Notification.create(
      receiverId,
      'message',
      `Новое сообщение от ${senderUsername}: ${message.content}`,
      `Новое сообщение`,
      notificationData
    );
    
    console.log(`SocketManager: Создано уведомление в БД:`, notification.id);
    
    // Находим socket получателя
    const receiverSocket = Array.from(onlineUsers.entries())
      .find(([_, user]) => user.userId === receiverId);
    
    if (receiverSocket && io) {
      console.log(`SocketManager: Найден получатель, отправляем уведомление на socket:`, receiverSocket[0]);
      
      // Отправляем уведомление через WebSocket
      io.to(receiverSocket[0]).emit('newMessage', {
        ...message,
        sender_username: senderUsername,
        notification_id: notification.id
      });
      
      // Отправляем событие нового уведомления
      io.to(receiverSocket[0]).emit('newNotification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        created_at: notification.created_at
      });
      
    } else {
      console.log(`SocketManager: Получатель не найден онлайн, уведомление сохранено в БД`);
    }
  } catch (error) {
    console.error('SocketManager: Ошибка при создании уведомления:', error);
  }
};

// Функция для добавления пользователя в онлайн
const addOnlineUser = (socketId, userData) => {
  onlineUsers.set(socketId, { ...userData, socketId });
};

// Функция для удаления пользователя из онлайн
const removeOnlineUser = (socketId) => {
  onlineUsers.delete(socketId);
};

// Функция для получения списка онлайн пользователей
const getOnlineUsers = () => {
  return Array.from(onlineUsers.values());
};

// Функция для получения пользователя по socketId
const getUserBySocketId = (socketId) => {
  return onlineUsers.get(socketId);
};

module.exports = {
  sendMessageNotification,
  addOnlineUser,
  removeOnlineUser,
  getOnlineUsers,
  getUserBySocketId,
  onlineUsers
}; 