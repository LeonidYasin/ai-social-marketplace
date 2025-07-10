const express = require('express');
const router = express.Router();
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

// Создаем папку для кэша если её нет
const CACHE_DIR = path.join(__dirname, '../../cache/placeholders');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Функция для генерации имени файла кэша
function getCacheFileName(width, height, bgColor, textColor, text) {
  const sanitizedText = text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  return `${width}x${height}_${bgColor}_${textColor}_${sanitizedText}.png`;
}

// Функция для генерации placeholder изображения
async function generatePlaceholder(width, height, bgColor, textColor, text) {
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
  
  return await image.getBufferAsync(Jimp.MIME_PNG);
}

// Placeholder image generator с кэшированием
router.get('/:width/:height/:bgColor/:textColor/:text', async (req, res) => {
  try {
    const { width, height, bgColor, textColor, text } = req.params;
    
    // Генерируем имя файла кэша
    const cacheFileName = getCacheFileName(width, height, bgColor, textColor, text);
    const cacheFilePath = path.join(CACHE_DIR, cacheFileName);
    
    // Проверяем, есть ли файл в кэше
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Serving cached placeholder: ${cacheFileName}`);
      const cachedImage = fs.readFileSync(cacheFilePath);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Cache', 'HIT');
      return res.send(cachedImage);
    }
    
    // Если файла нет в кэше, генерируем новое изображение
    console.log(`Generating new placeholder: ${cacheFileName}`);
    const imageBuffer = await generatePlaceholder(width, height, bgColor, textColor, text);
    
    // Сохраняем в кэш
    fs.writeFileSync(cacheFilePath, imageBuffer);
    
    // Отправляем изображение
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Cache', 'MISS');
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Placeholder generation error:', error);
    res.status(500).json({ error: 'Failed to generate placeholder image' });
  }
});

// Эндпоинт для очистки кэша
router.delete('/cache', (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    let deletedCount = 0;
    
    files.forEach(file => {
      if (file.endsWith('.png')) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
        deletedCount++;
      }
    });
    
    res.json({ 
      success: true, 
      message: `Cache cleared. Deleted ${deletedCount} files.` 
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Эндпоинт для получения статистики кэша
router.get('/cache/stats', (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const pngFiles = files.filter(file => file.endsWith('.png'));
    
    let totalSize = 0;
    pngFiles.forEach(file => {
      const stats = fs.statSync(path.join(CACHE_DIR, file));
      totalSize += stats.size;
    });
    
    res.json({
      totalFiles: pngFiles.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

module.exports = router; 