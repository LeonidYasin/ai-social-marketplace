const passport = require('passport');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');
const bcrypt = require('bcrypt');

// Google OAuth Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Настройка Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      console.log('Google profile:', profile);
      
      // Проверяем, есть ли пользователь с таким Google ID
      let result = await query(
        'SELECT * FROM users WHERE google_id = $1',
        [profile.id]
      );
      
      if (result.rows.length > 0) {
        // Пользователь найден - обновляем время последнего входа
        await query(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = $1',
          [profile.id]
        );
        return cb(null, result.rows[0]);
      }
      
      // Пользователь не найден - создаем нового
      const email = profile.emails[0].value;
      const firstName = profile.name.givenName || '';
      const lastName = profile.name.familyName || '';
      const username = email.split('@')[0] + '_google';
      
      // Проверяем, не занят ли username
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );
      
      let finalUsername = username;
      if (existingUser.rows.length > 0) {
        finalUsername = username + '_' + Date.now();
      }
      
      // Создаем пользователя
      result = await query(
        `INSERT INTO users (username, email, first_name, last_name, google_id, avatar_url, bio) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          finalUsername,
          email,
          firstName,
          lastName,
          profile.id,
          profile.photos[0]?.value || '',
          `Google user - ${profile.displayName}`
        ]
      );
      
      return cb(null, result.rows[0]);
      
    } catch (error) {
      console.error('OAuth error:', error);
      return cb(error, null);
    }
  }
));

// Сериализация пользователя для сессии
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Десериализация пользователя из сессии
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

// Инициализация Google OAuth
const initGoogleAuth = (req, res) => {
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })(req, res);
};

// Callback для Google OAuth
const googleCallback = (req, res) => {
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login?error=oauth_failed',
    session: false 
  }, async (err, user) => {
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect('http://localhost:3000/login?error=oauth_failed');
    }
    
    if (!user) {
      return res.redirect('http://localhost:3000/login?error=user_not_found');
    }
    
    try {
      // Создаем JWT токен
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          email: user.email 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      // Перенаправляем на фронтенд с токеном
      res.redirect(`http://localhost:3000/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
      
    } catch (error) {
      console.error('JWT creation error:', error);
      res.redirect('http://localhost:3000/login?error=token_creation_failed');
    }
  })(req, res);
};

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

// Получение текущего пользователя
const getCurrentUser = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, first_name, last_name, email, avatar_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// Проверка JWT токена
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

// Обновление токена
const refreshToken = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, first_name, last_name FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const user = result.rows[0];
    const newToken = createToken(user);
    
    res.json({
      message: 'Токен обновлен',
      token: newToken,
      user
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  initGoogleAuth,
  googleCallback,
  verifyToken,
  getCurrentUser,
  refreshToken,
  passport
}; 