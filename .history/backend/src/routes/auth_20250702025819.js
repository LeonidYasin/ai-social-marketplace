const express = require('express');
const router = express.Router();
const { 
  initGoogleAuth, 
  googleCallback, 
  verifyToken, 
  getCurrentUser 
} = require('../controllers/authController');

// Google OAuth маршруты
router.get('/google', initGoogleAuth);
router.get('/google/callback', googleCallback);

// Защищенные маршруты (требуют JWT токен)
router.get('/me', verifyToken, getCurrentUser);

module.exports = router; 