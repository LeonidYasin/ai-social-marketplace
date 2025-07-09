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

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Получить список постов
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Список постов
 */
router.get('/', getPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Получить пост по ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поста
 *     responses:
 *       200:
 *         description: Данные поста
 */
router.get('/:id', getPostById);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Создать пост
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пост создан
 */
router.post('/', requireAuth, createPost);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Обновить пост по ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поста
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пост обновлён
 */
router.put('/:id', requireAuth, updatePost);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Удалить пост по ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поста
 *     responses:
 *       200:
 *         description: Пост удалён
 */
router.delete('/:id', requireAuth, deletePost);

/**
 * @swagger
 * /api/posts/user/{userId}:
 *   get:
 *     summary: Получить посты пользователя
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Список постов пользователя
 */
router.get('/user/:userId', requireAuth, getUserPosts);

// --- Вложенные маршруты для комментариев ---
/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Создать комментарий к посту
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поста
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Комментарий создан
 */
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
/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Получить комментарии к посту
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поста
 *     responses:
 *       200:
 *         description: Список комментариев
 */
router.get('/:postId/comments', requireAuth, async (req, res) => {
  try {
    const comments = await Comment.findByPost(req.params.postId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// --- Вложенные маршруты для реакций ---
/**
 * @swagger
 * /api/posts/{postId}/reactions:
 *   post:
 *     summary: Добавить реакцию к посту
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поста
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Реакция добавлена
 */
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
/**
 * @swagger
 * /api/posts/{postId}/reactions:
 *   get:
 *     summary: Получить статистику по реакциям к посту
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поста
 *     responses:
 *       200:
 *         description: Статистика по реакциям
 */
router.get('/:postId/reactions', requireAuth, async (req, res) => {
  try {
    const stats = await Reaction.getForPost(req.params.postId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

module.exports = router; 