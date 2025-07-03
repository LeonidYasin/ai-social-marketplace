const express = require('express');
const Post = require('../models/post');

const router = express.Router();

// Получить ленту постов (GET /api/feed?limit=20&offset=0)
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