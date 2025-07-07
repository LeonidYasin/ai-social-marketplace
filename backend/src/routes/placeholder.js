const express = require('express');
const router = express.Router();
const Jimp = require('jimp');

// Placeholder image generator на Jimp
router.get('/:width/:height/:bgColor/:textColor/:text', async (req, res) => {
  try {
    const { width, height, bgColor, textColor, text } = req.params;
    const w = parseInt(width) || 150;
    const h = parseInt(height) || 150;
    const bg = `#${bgColor}`;
    const fg = `#${textColor}`;
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    // Создаём картинку
    const image = new Jimp(w, h, bg);
    // Вычисляем размер текста
    const textWidth = Jimp.measureText(font, text);
    const textHeight = Jimp.measureTextHeight(font, text, w);
    // Центрируем текст
    const x = (w - textWidth) / 2;
    const y = (h - textHeight) / 2;
    // Рисуем текст
    image.print(font, x, y, {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    }, textWidth, textHeight);
    // Если цвет текста не чёрный, перекрашиваем текст
    if (fg.toLowerCase() !== '#000000') {
      image.scan(0, 0, w, h, function (x, y, idx) {
        // Если пиксель чёрный (текст), перекрашиваем
        if (this.bitmap.data[idx] === 0 && this.bitmap.data[idx+1] === 0 && this.bitmap.data[idx+2] === 0 && this.bitmap.data[idx+3] > 0) {
          const hex = Jimp.cssColorToHex(fg);
          this.bitmap.data[idx] = (hex >> 16) & 0xFF;
          this.bitmap.data[idx+1] = (hex >> 8) & 0xFF;
          this.bitmap.data[idx+2] = hex & 0xFF;
        }
      });
    }
    // Отправляем PNG
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    console.error('Placeholder generation error:', error);
    res.status(500).json({ error: 'Failed to generate placeholder image' });
  }
});

module.exports = router; 