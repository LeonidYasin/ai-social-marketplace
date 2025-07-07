const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Middleware для проверки авторизации (опционально)
const checkAuth = (req, res, next) => {
  // Можно добавить проверку токена для безопасности
  next();
};

// Получить логи бэкенда
router.get('/backend', checkAuth, (req, res) => {
  try {
    const logPath = path.join(__dirname, '..', '..', 'logs', 'backend.log');
    
    if (!fs.existsSync(logPath)) {
      return res.json({
        success: false,
        message: 'Log file not found',
        logs: []
      });
    }

    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());
    
    // Парсим логи в структурированный формат
    const logs = lines.map(line => {
      try {
        // Пытаемся распарсить JSON
        const parsed = JSON.parse(line);
        return {
          timestamp: parsed.timestamp || new Date().toISOString(),
          level: parsed.level || 'info',
          message: parsed.message || line,
          data: parsed.data || null,
          raw: line
        };
      } catch (e) {
        // Если не JSON, возвращаем как есть
        return {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line,
          data: null,
          raw: line
        };
      }
    });

    // Фильтрация по параметрам запроса
    let filteredLogs = logs;
    
    if (req.query.level) {
      filteredLogs = filteredLogs.filter(log => 
        log.level.toLowerCase() === req.query.level.toLowerCase()
      );
    }
    
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm))
      );
    }
    
    if (req.query.limit) {
      const limit = parseInt(req.query.limit) || 100;
      filteredLogs = filteredLogs.slice(-limit);
    }

    res.json({
      success: true,
      count: filteredLogs.length,
      logs: filteredLogs
    });

  } catch (error) {
    logger.error('Error reading backend logs', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error reading logs',
      error: error.message
    });
  }
});

// Получить логи фронтенда
router.get('/frontend', checkAuth, (req, res) => {
  try {
    const logPath = path.join(__dirname, '..', '..', 'logs', 'frontend.log');
    
    if (!fs.existsSync(logPath)) {
      return res.json({
        success: false,
        message: 'Frontend log file not found',
        logs: []
      });
    }

    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());
    
    const logs = lines.map(line => {
      try {
        const parsed = JSON.parse(line);
        return {
          timestamp: parsed.timestamp || new Date().toISOString(),
          level: parsed.level || 'info',
          message: parsed.message || line,
          data: parsed.data || null,
          raw: line
        };
      } catch (e) {
        return {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line,
          data: null,
          raw: line
        };
      }
    });

    // Фильтрация
    let filteredLogs = logs;
    
    if (req.query.level) {
      filteredLogs = filteredLogs.filter(log => 
        log.level.toLowerCase() === req.query.level.toLowerCase()
      );
    }
    
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm))
      );
    }
    
    if (req.query.limit) {
      const limit = parseInt(req.query.limit) || 100;
      filteredLogs = filteredLogs.slice(-limit);
    }

    res.json({
      success: true,
      count: filteredLogs.length,
      logs: filteredLogs
    });

  } catch (error) {
    logger.error('Error reading frontend logs', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error reading frontend logs',
      error: error.message
    });
  }
});

// Получить все логи (объединенные)
router.get('/all', checkAuth, (req, res) => {
  try {
    const backendLogPath = path.join(__dirname, '..', '..', 'logs', 'backend.log');
    const frontendLogPath = path.join(__dirname, '..', '..', 'logs', 'frontend.log');
    
    let allLogs = [];
    
    // Читаем логи бэкенда
    if (fs.existsSync(backendLogPath)) {
      const backendContent = fs.readFileSync(backendLogPath, 'utf8');
      const backendLines = backendContent.split('\n').filter(line => line.trim());
      
      backendLines.forEach(line => {
        try {
          const parsed = JSON.parse(line);
          allLogs.push({
            source: 'backend',
            timestamp: parsed.timestamp || new Date().toISOString(),
            level: parsed.level || 'info',
            message: parsed.message || line,
            data: parsed.data || null,
            raw: line
          });
        } catch (e) {
          allLogs.push({
            source: 'backend',
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line,
            data: null,
            raw: line
          });
        }
      });
    }
    
    // Читаем логи фронтенда
    if (fs.existsSync(frontendLogPath)) {
      const frontendContent = fs.readFileSync(frontendLogPath, 'utf8');
      const frontendLines = frontendContent.split('\n').filter(line => line.trim());
      
      frontendLines.forEach(line => {
        try {
          const parsed = JSON.parse(line);
          allLogs.push({
            source: 'frontend',
            timestamp: parsed.timestamp || new Date().toISOString(),
            level: parsed.level || 'info',
            message: parsed.message || line,
            data: parsed.data || null,
            raw: line
          });
        } catch (e) {
          allLogs.push({
            source: 'frontend',
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line,
            data: null,
            raw: line
          });
        }
      });
    }
    
    // Сортируем по времени
    allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Фильтрация
    if (req.query.source) {
      allLogs = allLogs.filter(log => log.source === req.query.source);
    }
    
    if (req.query.level) {
      allLogs = allLogs.filter(log => 
        log.level.toLowerCase() === req.query.level.toLowerCase()
      );
    }
    
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      allLogs = allLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm))
      );
    }
    
    if (req.query.limit) {
      const limit = parseInt(req.query.limit) || 100;
      allLogs = allLogs.slice(-limit);
    }

    res.json({
      success: true,
      count: allLogs.length,
      logs: allLogs
    });

  } catch (error) {
    logger.error('Error reading all logs', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error reading logs',
      error: error.message
    });
  }
});

// Получить статистику логов
router.get('/stats', checkAuth, (req, res) => {
  try {
    const backendLogPath = path.join(__dirname, '..', '..', 'logs', 'backend.log');
    const frontendLogPath = path.join(__dirname, '..', '..', 'logs', 'frontend.log');
    
    const stats = {
      backend: { total: 0, errors: 0, warnings: 0, info: 0 },
      frontend: { total: 0, errors: 0, warnings: 0, info: 0 },
      total: 0
    };
    
    // Статистика бэкенда
    if (fs.existsSync(backendLogPath)) {
      const backendContent = fs.readFileSync(backendLogPath, 'utf8');
      const backendLines = backendContent.split('\n').filter(line => line.trim());
      
      backendLines.forEach(line => {
        try {
          const parsed = JSON.parse(line);
          const level = parsed.level?.toLowerCase() || 'info';
          stats.backend.total++;
          stats.backend[level]++;
        } catch (e) {
          stats.backend.total++;
          stats.backend.info++;
        }
      });
    }
    
    // Статистика фронтенда
    if (fs.existsSync(frontendLogPath)) {
      const frontendContent = fs.readFileSync(frontendLogPath, 'utf8');
      const frontendLines = frontendContent.split('\n').filter(line => line.trim());
      
      frontendLines.forEach(line => {
        try {
          const parsed = JSON.parse(line);
          const level = parsed.level?.toLowerCase() || 'info';
          stats.frontend.total++;
          stats.frontend[level]++;
        } catch (e) {
          stats.frontend.total++;
          stats.frontend.info++;
        }
      });
    }
    
    stats.total = stats.backend.total + stats.frontend.total;
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Error getting log stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting log stats',
      error: error.message
    });
  }
});

module.exports = router; 