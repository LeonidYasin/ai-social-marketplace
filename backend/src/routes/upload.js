const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    // Создаем папку, если её нет
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB лимит
  },
  fileFilter: function (req, file, cb) {
    // Разрешаем только изображения
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'), false);
    }
  }
});

// Эндпоинт для загрузки файла
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Файл не был загружен',
        message: 'Пожалуйста, выберите файл для загрузки'
      });
    }

    // Возвращаем информацию о загруженном файле
    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/${req.file.filename}`
    });

  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки файла',
      message: error.message 
    });
  }
});

// Обработка ошибок multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'Файл слишком большой',
        message: 'Максимальный размер файла: 10MB'
      });
    }
    return res.status(400).json({ 
      error: 'Ошибка загрузки файла',
      message: error.message 
    });
  }
  
  if (error.message === 'Только изображения разрешены') {
    return res.status(400).json({ 
      error: 'Неподдерживаемый тип файла',
      message: 'Разрешены только изображения (jpg, png, gif, webp)'
    });
  }
  
  next(error);
});

module.exports = router; 