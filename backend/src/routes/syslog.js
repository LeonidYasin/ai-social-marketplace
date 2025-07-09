const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/syslog/status:
 *   get:
 *     summary: Получить статус syslog-сервера
 *     tags: [Syslog]
 *     responses:
 *       200:
 *         description: Текущий статус syslog-сервера
 */
router.get('/status', (req, res) => {
  try {
    const syslogServer = req.app.locals.syslogServer;
    if (!syslogServer) {
      return res.status(503).json({
        error: 'Syslog server not available',
        message: 'Syslog server is not initialized'
      });
    }

    const status = syslogServer.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get syslog status',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/syslog/logs:
 *   get:
 *     summary: Получить последние syslog-логи
 *     tags: [Syslog]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Максимальное количество логов
 *     responses:
 *       200:
 *         description: Список логов
 */
router.get('/logs', (req, res) => {
  try {
    const syslogServer = req.app.locals.syslogServer;
    if (!syslogServer) {
      return res.status(503).json({
        error: 'Syslog server not available',
        message: 'Syslog server is not initialized'
      });
    }

    const limit = parseInt(req.query.limit) || 100;
    const logs = syslogServer.getRecentLogs(limit);
    
    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get syslog logs',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/syslog/render-logs:
 *   get:
 *     summary: Получить Render-логи
 *     tags: [Syslog]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Максимальное количество логов
 *     responses:
 *       200:
 *         description: Список Render-логов
 */
router.get('/render-logs', (req, res) => {
  try {
    const syslogServer = req.app.locals.syslogServer;
    if (!syslogServer) {
      return res.status(503).json({
        error: 'Syslog server not available',
        message: 'Syslog server is not initialized'
      });
    }

    const limit = parseInt(req.query.limit) || 100;
    const logs = syslogServer.getRenderLogs(limit);
    
    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get render logs',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/syslog/start:
 *   post:
 *     summary: Запустить syslog-сервер (только для админа)
 *     tags: [Syslog]
 *     responses:
 *       200:
 *         description: Сервер запущен
 */
router.post('/start', (req, res) => {
  try {
    const syslogServer = req.app.locals.syslogServer;
    if (!syslogServer) {
      return res.status(503).json({
        error: 'Syslog server not available',
        message: 'Syslog server is not initialized'
      });
    }

    if (syslogServer.isRunning) {
      return res.status(400).json({
        error: 'Syslog server already running',
        message: 'Server is already started'
      });
    }

    syslogServer.start()
      .then(() => {
        res.json({
          success: true,
          message: 'Syslog server started successfully',
          data: syslogServer.getStatus()
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: 'Failed to start syslog server',
          message: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start syslog server',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/syslog/stop:
 *   post:
 *     summary: Остановить syslog-сервер (только для админа)
 *     tags: [Syslog]
 *     responses:
 *       200:
 *         description: Сервер остановлен
 */
router.post('/stop', (req, res) => {
  try {
    const syslogServer = req.app.locals.syslogServer;
    if (!syslogServer) {
      return res.status(503).json({
        error: 'Syslog server not available',
        message: 'Syslog server is not initialized'
      });
    }

    if (!syslogServer.isRunning) {
      return res.status(400).json({
        error: 'Syslog server not running',
        message: 'Server is already stopped'
      });
    }

    syslogServer.stop()
      .then(() => {
        res.json({
          success: true,
          message: 'Syslog server stopped successfully',
          data: syslogServer.getStatus()
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: 'Failed to stop syslog server',
          message: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop syslog server',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/syslog/restart:
 *   post:
 *     summary: Перезапустить syslog-сервер (только для админа)
 *     tags: [Syslog]
 *     responses:
 *       200:
 *         description: Сервер перезапущен
 */
router.post('/restart', (req, res) => {
  try {
    const syslogServer = req.app.locals.syslogServer;
    if (!syslogServer) {
      return res.status(503).json({
        error: 'Syslog server not available',
        message: 'Syslog server is not initialized'
      });
    }

    syslogServer.stop()
      .then(() => {
        return syslogServer.start();
      })
      .then(() => {
        res.json({
          success: true,
          message: 'Syslog server restarted successfully',
          data: syslogServer.getStatus()
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: 'Failed to restart syslog server',
          message: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to restart syslog server',
      message: error.message
    });
  }
});

// Get syslog configuration info
router.get('/config', (req, res) => {
  try {
    const config = {
      port: process.env.SYSLOG_PORT || 514,
      host: process.env.SYSLOG_HOST || '0.0.0.0',
      enabled: process.env.ENABLE_SYSLOG === 'true',
      renderIntegration: {
        enabled: process.env.RENDER_SYSLOG_ENABLED === 'true',
        endpoint: process.env.RENDER_SYSLOG_ENDPOINT || 'localhost:514',
        protocol: 'UDP'
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get syslog configuration',
      message: error.message
    });
  }
});

module.exports = router; 