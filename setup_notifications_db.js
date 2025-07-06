const { query } = require('./backend/src/utils/db');
const fs = require('fs');
const path = require('path');

async function setupNotificationsTable() {
  try {
    console.log('🔧 Настройка таблицы уведомлений...');
    
    // Читаем SQL-скрипт
    const sqlPath = path.join(__dirname, 'recreate_notifications_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Выполняем SQL-скрипт
    await query(sql);
    
    console.log('✅ Таблица notifications успешно создана!');
    
    // Проверяем, что таблица создана
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Таблица notifications найдена в базе данных');
      
      // Показываем структуру таблицы
      const columns = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Структура таблицы notifications:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
    } else {
      console.error('❌ Таблица notifications не найдена в базе данных');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при создании таблицы notifications:', error);
    process.exit(1);
  }
}

// Запускаем настройку
setupNotificationsTable(); 