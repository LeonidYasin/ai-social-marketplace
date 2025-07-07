const { query } = require('../utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminPasswordUtils = require('../utils/adminPassword');

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
    const result = await query(
      'SELECT id, username, first_name, last_name, avatar_url, bio, created_at FROM users ORDER BY created_at DESC'
    );
    
    // Проверяем, не были ли уже отправлены заголовки
    if (!res.headersSent) {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('[getUsers] Error getting users:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
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
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получение текущего пользователя
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // ID из JWT токена
    
    const result = await query(
      'SELECT id, username, email, first_name, last_name, bio, location, website, avatar_url, role, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Регистрация нового пользователя
const registerUser = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, bio } = req.body;
    
    // Проверка обязательных полей
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }
    
    // Проверка уникальности username и email
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
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
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Авторизация пользователя
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Поиск пользователя
    const result = await query(
      'SELECT id, username, password_hash, first_name, last_name, email FROM users WHERE username = $1 OR email = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'Profile updated',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновление профиля текущего пользователя
const updateCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
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
      [first_name, last_name, bio, location, website, avatar_url, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'Profile updated',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating current user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удаление пользователя (только для админов)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Изменение роли пользователя (только для админов)
const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const result = await query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, role',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User role updated',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Смена роли на admin по admin-паролю
const becomeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body;
    const userId = req.user.id;

    if (!adminPassword) {
      return res.status(400).json({ error: 'Не указан пароль администратора' });
    }
    if (userId.toString() !== id.toString()) {
      return res.status(403).json({ error: 'Можно сменить роль только себе' });
    }
    const isValid = await adminPasswordUtils.checkAdminPassword(adminPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверный пароль администратора' });
    }
    // Меняем роль на admin
    const result = await query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, role',
      ['admin', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      message: 'Теперь вы администратор',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error becoming admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  getCurrentUser,
  registerUser,
  loginUser,
  updateProfile,
  updateCurrentUserProfile,
  deleteUser,
  changeUserRole,
  becomeAdmin
}; 