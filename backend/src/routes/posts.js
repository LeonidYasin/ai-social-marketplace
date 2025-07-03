const express = require('express');
const router = express.Router();
const { 
  getPosts, 
  getPostById, 
  createPost, 
  updatePost, 
  deletePost, 
  getUserPosts 
} = require('../controllers/postController');

// Получить все посты
router.get('/', getPosts);

// Получить пост по ID
router.get('/:id', getPostById);

// Создать новый пост
router.post('/', createPost);

// Обновить пост
router.put('/:id', updatePost);

// Удалить пост
router.delete('/:id', deletePost);

// Получить посты пользователя
router.get('/user/:userId', getUserPosts);

module.exports = router; 