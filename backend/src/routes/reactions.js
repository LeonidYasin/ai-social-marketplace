const express = require('express');
const Reaction = require('../models/reaction');

const router = express.Router();

/**
 * @swagger
 * /api/reactions:
 *   post:
 *     summary: Добавить реакцию
 *     tags: [Reactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               postId:
 *                 type: string
 *               commentId:
 *                 type: string
 *                 nullable: true
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Реакция добавлена
 */
router.post('/', async (req, res) => {
  const { userId, postId, commentId, type } = req.body;
  try {
    const reaction = await Reaction.create({ userId, postId, commentId, type });
    res.status(201).json(reaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

/**
 * @swagger
 * /api/reactions/post/{postId}:
 *   get:
 *     summary: Получить статистику по реакциям к посту
 *     tags: [Reactions]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поста
 *     responses:
 *       200:
 *         description: Статистика по реакциям к посту
 */
router.get('/post/:postId', async (req, res) => {
  try {
    const stats = await Reaction.getForPost(req.params.postId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

/**
 * @swagger
 * /api/reactions/comment/{commentId}:
 *   get:
 *     summary: Получить статистику по реакциям к комментарию
 *     tags: [Reactions]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID комментария
 *     responses:
 *       200:
 *         description: Статистика по реакциям к комментарию
 */
router.get('/comment/:commentId', async (req, res) => {
  try {
    const stats = await Reaction.getForComment(req.params.commentId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

module.exports = router; 