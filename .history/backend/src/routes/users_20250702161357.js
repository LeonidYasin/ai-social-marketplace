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
const checkAdmin = require('../middleware/checkAdmin');

// Получить всех пользователей
router.get('/', getUsers);

// Получить пользователя по ID
router.get('/:id', getUserById);

// Регистрация нового пользователя
router.post('/register', registerUser);

// Авторизация пользователя
router.post('/login', loginUser);

// Обновление профиля пользователя
router.put('/:id', updateProfile);

// Удаление пользователя по ID
router.delete('/:id', checkAdmin, deleteUser);

// Смена роли пользователя (только для админа)
router.patch('/:id/role', checkAdmin, changeUserRole);

module.exports = router; 