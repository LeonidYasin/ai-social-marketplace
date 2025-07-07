const express = require('express');
const router = express.Router();
const { createCanvas } = require('canvas');

// Placeholder image generator
router.get('/:width/:height/:bgColor/:textColor/:text', (req, res) => {
  try {
    const { width, height, bgColor, textColor, text } = req.params;
    
    // Parse dimensions
    const w = parseInt(width) || 150;
    const h = parseInt(height) || 150;
    
    // Create canvas
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = `#${bgColor}`;
    ctx.fillRect(0, 0, w, h);
    
    // Add text
    ctx.fillStyle = `#${textColor}`;
    ctx.font = `${Math.min(w, h) / 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    
    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send image
    res.send(canvas.toBuffer());
    
  } catch (error) {
    console.error('Placeholder generation error:', error);
    res.status(500).json({ error: 'Failed to generate placeholder image' });
  }
});

module.exports = router; 