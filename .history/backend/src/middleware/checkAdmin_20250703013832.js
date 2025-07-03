const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

// Middleware для проверки JWT токена
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Получаем актуальные данные пользователя из БД
    const result = await query(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

// Middleware для проверки админских прав
const checkAdmin = async (req, res, next) => {
  try {
    // Сначала проверяем токен
    await verifyToken(req, res, () => {});
    
    // Проверяем роль пользователя
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен: только для админов' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
};

// Middleware для проверки аутентификации (без проверки роли)
const requireAuth = async (req, res, next) => {
  try {
    await verifyToken(req, res, () => {});
    next();
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
};

module.exports = {
  verifyToken,
  checkAdmin,
  requireAuth
}; 