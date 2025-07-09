const express = require('express');
const Comment = require('../models/comment');

const router = express.Router();

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Создать комментарий
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               postId:
 *                 type: string
 *               userId:
 *                 type: string
 *               content:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Комментарий создан
 */
router.post('/', async (req, res) => {
  const { postId, userId, content, parentId } = req.body;
  try {
    const comment = await Comment.create({ postId, userId, content, parentId });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/**
 * @swagger
 * /api/comments/{postId}:
 *   get:
 *     summary: Получить комментарии к посту
 *     tags: [Comments]
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
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.findByPost(req.params.postId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

module.exports = router; 