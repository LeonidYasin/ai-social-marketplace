const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

// Валидация данных от Telegram Login Widget
const validateTelegramData = (data) => {
  const { hash, ...userData } = data;
  
  // Создаем строку для проверки
  const checkString = Object.keys(userData)
    .sort()
    .map(key => `${key}=${userData[key]}`)
    .join('\n');
  
  // Создаем HMAC-SHA-256 хеш
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN || 'your-bot-token').digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
  
  return calculatedHash === hash;
};

// Обработка входа через Telegram
const handleTelegramLogin = async (req, res) => {
  try {
    const telegramData = req.body;
    
    // Проверяем, что данные пришли от Telegram
    if (!validateTelegramData(telegramData)) {
      return res.status(401).json({ error: 'Недействительные данные от Telegram' });
    }
    
    const {
      id: telegramId,
      first_name,
      last_name,
      username,
      photo_url,
      auth_date
    } = telegramData;
    
    // Проверяем, не устарели ли данные (больше 24 часов)
    const authTime = parseInt(auth_date) * 1000;
    const currentTime = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 часа
    
    if (currentTime - authTime > maxAge) {
      return res.status(401).json({ error: 'Данные авторизации устарели' });
    }
    
    // Проверяем, есть ли пользователь с таким Telegram ID
    let result = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId.toString()]
    );
    
    let user;
    
    if (result.rows.length > 0) {
      // Пользователь найден - обновляем время последнего входа
      user = result.rows[0];
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE telegram_id = $1',
        [telegramId.toString()]
      );
    } else {
      // Пользователь не найден - создаем нового
      const email = `telegram_${telegramId}@telegram.local`;
      const displayName = `${first_name} ${last_name || ''}`.trim();
      const username_db = username || `telegram_${telegramId}`;
      
      // Проверяем, не занят ли username
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1',
        [username_db]
      );
      
      let finalUsername = username_db;
      if (existingUser.rows.length > 0) {
        finalUsername = username_db + '_' + Date.now();
      }
      
      // Создаем пользователя
      result = await query(
        `INSERT INTO users (username, email, first_name, last_name, telegram_id, avatar_url, bio) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          finalUsername,
          email,
          first_name,
          last_name || '',
          telegramId.toString(),
          photo_url || '',
          `Telegram user - ${displayName}`
        ]
      );
      
      user = result.rows[0];
    }
    
    // Создаем JWT токен
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        email: user.email,
        telegramId: telegramId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Удаляем пароль из ответа
    delete user.password_hash;
    
    res.json({
      message: 'Авторизация через Telegram успешна',
      token,
      user
    });
    
  } catch (error) {
    console.error('Telegram login error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получение информации о боте
const getBotInfo = async (req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Telegram Bot Token не настроен' });
    }
    
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    
    res.json({
      bot: response.data.result,
      widgetUrl: `https://t.me/${response.data.result.username}`
    });
    
  } catch (error) {
    console.error('Bot info error:', error);
    res.status(500).json({ error: 'Ошибка получения информации о боте' });
  }
};

module.exports = {
  handleTelegramLogin,
  getBotInfo,
  validateTelegramData
}; 