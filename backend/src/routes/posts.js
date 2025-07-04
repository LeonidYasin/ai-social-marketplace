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
const { requireAuth } = require('../middleware/checkAdmin');

// Импортируем контроллеры комментариев и реакций
const Comment = require('../models/comment');
const Reaction = require('../models/reaction');

// Публичные маршруты
router.get('/', getPosts);
router.get('/:id', getPostById);

// Защищенные маршруты (требуют JWT токен)
router.post('/', requireAuth, createPost);
router.put('/:id', requireAuth, updatePost);
router.delete('/:id', requireAuth, deletePost);
router.get('/user/:userId', requireAuth, getUserPosts);

// --- Вложенные маршруты для комментариев ---
// Создать комментарий к посту
router.post('/:postId/comments', requireAuth, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const userId = req.user.id;
    const postId = req.params.postId;
    const comment = await Comment.create({ postId, userId, content, parentId });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});
// Получить комментарии к посту
router.get('/:postId/comments', requireAuth, async (req, res) => {
  try {
    const comments = await Comment.findByPost(req.params.postId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// --- Вложенные маршруты для реакций ---
// Добавить реакцию к посту
router.post('/:postId/reactions', requireAuth, async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user.id;
    const postId = req.params.postId;
    const reaction = await Reaction.create({ userId, postId, type });
    res.status(201).json(reaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});
// Получить статистику по реакциям к посту
router.get('/:postId/reactions', requireAuth, async (req, res) => {
  try {
    const stats = await Reaction.getForPost(req.params.postId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

module.exports = router; 