const express = require('express');
const Post = require('../models/post');

const router = express.Router();

/**
 * @swagger
 * /api/feed:
 *   get:
 *     summary: Получить ленту постов
 *     tags: [Feed]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Количество постов
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Смещение
 *     responses:
 *       200:
 *         description: Лента постов
 */
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;
  try {
    const posts = await Post.getFeed(limit, offset);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

module.exports = router; 