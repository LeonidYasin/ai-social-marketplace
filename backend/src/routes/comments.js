const express = require('express');
const Comment = require('../models/comment');

const router = express.Router();

// Создать комментарий
router.post('/', async (req, res) => {
  const { postId, userId, content, parentId } = req.body;
  try {
    const comment = await Comment.create({ postId, userId, content, parentId });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Получить комментарии к посту
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.findByPost(req.params.postId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

module.exports = router; 