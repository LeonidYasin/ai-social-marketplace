const express = require('express');
const router = express.Router();
const { 
  initGoogleAuth, 
  googleCallback, 
  verifyToken, 
  getCurrentUser, 
  refreshToken 
} = require('../controllers/authController');
const { verifyToken: checkAdminToken } = require('../middleware/checkAdmin');

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Инициализация Google OAuth
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Перенаправление на страницу Google OAuth
 */
router.get('/google', initGoogleAuth);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback Google OAuth
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Успешная аутентификация через Google
 */
router.get('/google/callback', googleCallback);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя (JWT)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя
 */
router.get('/me', checkAdminToken, getCurrentUser);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить JWT токен
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Новый JWT токен
 */
router.post('/refresh', checkAdminToken, refreshToken);

module.exports = router; 