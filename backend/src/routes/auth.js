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

// Google OAuth маршруты
router.get('/google', initGoogleAuth);
router.get('/google/callback', googleCallback);

// Защищенные маршруты (требуют JWT токен)
router.get('/me', checkAdminToken, getCurrentUser);
router.post('/refresh', checkAdminToken, refreshToken);

module.exports = router; 