const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  registerUser, 
  loginUser, 
  updateProfile, 
  deleteUser,
  changeUserRole
} = require('../controllers/userController');
const { checkAdmin, requireAuth } = require('../middleware/checkAdmin');

// Публичные маршруты
router.post('/register', registerUser);
router.post('/login', loginUser);

// Защищенные маршруты (требуют JWT токен)
router.get('/', requireAuth, getUsers);
router.get('/:id', requireAuth, getUserById);
router.put('/:id', requireAuth, updateProfile);

// Админские маршруты
router.delete('/:id', checkAdmin, deleteUser);
router.patch('/:id/role', checkAdmin, changeUserRole);

module.exports = router; 