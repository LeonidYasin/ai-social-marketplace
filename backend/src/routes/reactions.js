const express = require('express');
const Reaction = require('../models/reaction');

const router = express.Router();

// Добавить реакцию
router.post('/', async (req, res) => {
  const { userId, postId, commentId, type } = req.body;
  try {
    const reaction = await Reaction.create({ userId, postId, commentId, type });
    res.status(201).json(reaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Получить статистику по реакциям к посту
router.get('/post/:postId', async (req, res) => {
  try {
    const stats = await Reaction.getForPost(req.params.postId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

// Получить статистику по реакциям к комментарию
router.get('/comment/:commentId', async (req, res) => {
  try {
    const stats = await Reaction.getForComment(req.params.commentId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

module.exports = router; 