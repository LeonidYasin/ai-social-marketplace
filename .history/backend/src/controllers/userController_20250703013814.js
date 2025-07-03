const { query } = require('../utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Функция для создания JWT токена
const createToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      email: user.email 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Получить всех пользователей
const getUsers = async (req, res) => {
  try {
    console.log('[getUsers] Получен запрос на список пользователей');
    const result = await query(
      'SELECT id, username, first_name, last_name, avatar_url, bio, created_at FROM users ORDER BY created_at DESC'
    );
    console.log(`[getUsers] Найдено пользователей: ${result.rows.length}`);
    res.json(result.rows);
  } catch (error) {
    console.error('[getUsers] Ошибка при получении пользователей:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Получить пользователя по ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, username, first_name, last_name, avatar_url, bio, location, website, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Регистрация нового пользователя
const registerUser = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, bio } = req.body;
    
    // Проверка обязательных полей
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }
    
    // Проверка уникальности username и email
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким username или email уже существует' });
    }
    
    // Хеширование пароля
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Создание пользователя
    const result = await query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, bio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, first_name, last_name, email, created_at',
      [username, email, hashedPassword, first_name, last_name, bio || '']
    );
    
    const user = result.rows[0];
    const token = createToken(user);
    
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user,
      token
    });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Авторизация пользователя
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username и password обязательны' });
    }
    
    // Поиск пользователя
    const result = await query(
      'SELECT id, username, password_hash, first_name, last_name, email FROM users WHERE username = $1 OR email = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    const user = result.rows[0];
    
    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    // Обновление времени последнего входа
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Удаляем пароль из ответа
    delete user.password_hash;
    
    const token = createToken(user);
    
    res.json({
      message: 'Авторизация успешна',
      user,
      token
    });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Обновление профиля пользователя
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, bio, location, website, avatar_url } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           bio = COALESCE($3, bio),
           location = COALESCE($4, location),
           website = COALESCE($5, website),
           avatar_url = COALESCE($6, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, username, first_name, last_name, bio, location, website, avatar_url, updated_at`,
      [first_name, last_name, bio, location, website, avatar_url, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json({
      message: 'Профиль обновлен',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Удаление пользователя по ID
const deleteUser = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен: только для админов' });
  }
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ message: 'Пользователь удалён', id });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Смена роли пользователя (только для админа)
const changeUserRole = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен: только для админов' });
  }
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Недопустимая роль' });
  }
  try {
    const result = await query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role', [role, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ message: 'Роль пользователя обновлена', user: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при смене роли пользователя:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  registerUser,
  loginUser,
  updateProfile,
  deleteUser,
  changeUserRole
}; 