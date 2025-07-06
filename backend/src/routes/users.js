const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkAdmin, requireAuth } = require('../middleware/checkAdmin');

// Публичные маршруты
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/', userController.getUsers);

// Защищенные маршруты (требуют JWT токен)
router.put('/profile', requireAuth, userController.updateCurrentUserProfile);
router.get('/profile', requireAuth, userController.getCurrentUser);
router.get('/:id', requireAuth, userController.getUserById);
router.put('/:id', requireAuth, userController.updateProfile);

// Админские маршруты
router.delete('/:id', checkAdmin, userController.deleteUser);
router.patch('/:id/role', checkAdmin, userController.changeUserRole);

module.exports = router; 