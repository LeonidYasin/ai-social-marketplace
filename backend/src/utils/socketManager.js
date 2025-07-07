/**
 * WebSocket Manager для уведомлений
 * ---------------------------------
 * Управляет WebSocket-соединениями и доставкой уведомлений:
 *  - Хранит список онлайн пользователей
 *  - Создаёт уведомления при отправке сообщений
 *  - Доставляет уведомления через WebSocket
 *  - Обрабатывает подтверждения доставки/прочтения
 *
 * ВАЖНО:
 * - Уведомления создаются ВСЕГДА в базе данных
 * - WebSocket используется только для мгновенной доставки
 * - Если пользователь офлайн, уведомление остаётся в базе
 * - Логируются только критические операции и ошибки
 */

// Хранилище онлайн пользователей
const onlineUsers = new Map();

// Функция для отправки уведомления о новом сообщении
const sendMessageNotification = async (message, senderUsername, io) => {
  try {
    console.log(`[SocketManager.sendMessageNotification] Начало создания уведомления для сообщения ${message.id}`);
    
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
      console.log(`[SocketManager.sendMessageNotification] Получатель не найден в chat_participants: chat_id=${message.chat_id}, sender_id=${message.sender_id}`);
      return;
    }
    
    const receiverId = receiverResult.rows[0].user_id;
    console.log(`[SocketManager.sendMessageNotification] Найден получатель: receiverId=${receiverId}`);
    
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
    
    console.log(`[SocketManager.sendMessageNotification] Уведомление создано в БД: id=${notification.id}`);
    
    // Находим socket получателя
    const receiverSocket = Array.from(onlineUsers.entries())
      .find(([_, user]) => user.userId === receiverId);
    
    if (receiverSocket && io) {
      console.log(`[SocketManager.sendMessageNotification] Получатель онлайн, отправляем WebSocket: socketId=${receiverSocket[0]}`);
      
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
      
      console.log(`[SocketManager.sendMessageNotification] WebSocket события отправлены`);
      
    } else {
      console.log(`[SocketManager.sendMessageNotification] Получатель офлайн (receiverId=${receiverId}), уведомление сохранено в БД`);
    }
  } catch (error) {
    console.error('[SocketManager.sendMessageNotification] КРИТИЧЕСКАЯ ОШИБКА:', error);
  }
};

// Функция для добавления пользователя в онлайн
const addOnlineUser = (socketId, userData) => {
  onlineUsers.set(socketId, { ...userData, socketId });
  console.log(`[SocketManager.addOnlineUser] Пользователь добавлен: socketId=${socketId}, userId=${userData.userId}, username=${userData.username}`);
};

// Функция для удаления пользователя из онлайн
const removeOnlineUser = (socketId) => {
  const user = onlineUsers.get(socketId);
  if (user) {
    onlineUsers.delete(socketId);
    console.log(`[SocketManager.removeOnlineUser] Пользователь удалён: socketId=${socketId}, userId=${user.userId}, username=${user.username}`);
  }
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