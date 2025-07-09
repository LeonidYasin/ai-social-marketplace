const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const adminPasswordUtils = require('../utils/adminPassword');
const { checkAdmin } = require('../middleware/checkAdmin');

// Административный пароль (в продакшене должен быть в переменных окружения)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware для проверки административного пароля
const checkAdminPassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password || password !== ADMIN_PASSWORD) {
    logger.warn('Неверная попытка доступа к админ API', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Неверный пароль администратора'
    });
  }
  
  next();
};

/**
 * @swagger
 * /api/admin/fix-database:
 *   post:
 *     summary: Исправить структуру базы данных (только для админа)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Админ-пароль
 *     responses:
 *       200:
 *         description: Структура базы данных исправлена
 */
router.post('/fix-database', checkAdminPassword, async (req, res) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    logger.info('Начало исправления структуры базы данных');
    
    // SQL скрипт для исправления таблицы notifications
    const fixNotificationsSQL = `
      -- Добавить колонку type если её нет
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'notifications' AND column_name = 'type') THEN
              ALTER TABLE notifications ADD COLUMN type VARCHAR(32) NOT NULL DEFAULT 'message';
              RAISE NOTICE 'Added column "type" to notifications table';
          ELSE
              RAISE NOTICE 'Column "type" already exists in notifications table';
          END IF;
      END $$;

      -- Добавить колонку is_delivered если её нет
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'notifications' AND column_name = 'is_delivered') THEN
              ALTER TABLE notifications ADD COLUMN is_delivered BOOLEAN NOT NULL DEFAULT FALSE;
              RAISE NOTICE 'Added column "is_delivered" to notifications table';
          ELSE
              RAISE NOTICE 'Column "is_delivered" already exists in notifications table';
          END IF;
      END $$;

      -- Добавить колонку delivered_at если её нет
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'notifications' AND column_name = 'delivered_at') THEN
              ALTER TABLE notifications ADD COLUMN delivered_at TIMESTAMP;
              RAISE NOTICE 'Added column "delivered_at" to notifications table';
          ELSE
              RAISE NOTICE 'Column "delivered_at" already exists in notifications table';
          END IF;
      END $$;

      -- Добавить колонку read_at если её нет
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
              ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP;
              RAISE NOTICE 'Added column "read_at" to notifications table';
          ELSE
              RAISE NOTICE 'Column "read_at" already exists in notifications table';
          END IF;
      END $$;
    `;

    // Выполняем исправление
    await pool.query(fixNotificationsSQL);
    
    // Получаем текущую структуру таблицы
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);

    logger.info('Структура базы данных успешно исправлена');
    
    res.json({
      success: true,
      message: 'Структура базы данных исправлена',
      tableStructure: structureResult.rows
    });

  } catch (error) {
    logger.error('Ошибка при исправлении базы данных', error);
    res.status(500).json({
      error: 'Database fix failed',
      message: error.message
    });
  } finally {
    await pool.end();
  }
});

/**
 * @swagger
 * /api/admin/database-info:
 *   get:
 *     summary: Получить информацию о структуре базы данных (только для админа)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: password
 *         schema:
 *           type: string
 *         description: Админ-пароль
 *     responses:
 *       200:
 *         description: Информация о структуре базы данных
 */
router.get('/database-info', checkAdminPassword, async (req, res) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Получаем список всех таблиц
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    // Получаем структуру таблицы notifications
    const notificationsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);

    res.json({
      tables: tablesResult.rows.map(row => row.table_name),
      notificationsStructure: notificationsStructure.rows
    });

  } catch (error) {
    logger.error('Ошибка при получении информации о БД', error);
    res.status(500).json({
      error: 'Failed to get database info',
      message: error.message
    });
  } finally {
    await pool.end();
  }
});

/**
 * @swagger
 * /api/admin/recreate-notifications:
 *   post:
 *     summary: Пересоздать таблицу notifications (только для админа)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Админ-пароль
 *     responses:
 *       200:
 *         description: Таблица notifications пересоздана
 */
router.post('/recreate-notifications', checkAdminPassword, async (req, res) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    logger.info('Начало пересоздания таблицы notifications');
    
    // SQL для пересоздания таблицы
    const recreateSQL = `
      -- Удаляем старую таблицу если существует
      DROP TABLE IF EXISTS notifications CASCADE;
      
      -- Создаем новую таблицу с правильной структурой
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(32) NOT NULL DEFAULT 'message',
        title VARCHAR(255),
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        is_delivered BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP
      );
      
      -- Создаем индексы для производительности
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX idx_notifications_is_delivered ON notifications(is_delivered);
    `;

    await pool.query(recreateSQL);
    
    logger.info('Таблица notifications успешно пересоздана');
    
    res.json({
      success: true,
      message: 'Таблица notifications пересоздана с правильной структурой'
    });

  } catch (error) {
    logger.error('Ошибка при пересоздании таблицы notifications', error);
    res.status(500).json({
      error: 'Failed to recreate notifications table',
      message: error.message
    });
  } finally {
    await pool.end();
  }
});

// Смена admin-пароля (только для admin)
router.post('/change-admin-password', checkAdmin, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Необходимо указать старый и новый пароль' });
  }
  const isValid = await adminPasswordUtils.checkAdminPassword(oldPassword);
  if (!isValid) {
    return res.status(401).json({ error: 'Старый пароль неверен' });
  }
  await adminPasswordUtils.setAdminPassword(newPassword);
  res.json({ success: true, message: 'Пароль администратора успешно изменён' });
});

module.exports = router; 