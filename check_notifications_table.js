const { query } = require('./backend/src/utils/db');

async function checkNotificationsTable() {
  try {
    console.log('🔍 Проверка структуры таблицы notifications...');
    
    // Проверяем, существует ли таблица
    const tableExists = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    `);
    
    if (tableExists.rows.length === 0) {
      console.log('❌ Таблица notifications не существует');
      return;
    }
    
    console.log('✅ Таблица notifications существует');
    
    // Показываем текущую структуру
    const columns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Текущая структура таблицы notifications:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Проверяем, какие поля отсутствуют
    const existingColumns = columns.rows.map(col => col.column_name);
    const requiredColumns = ['id', 'user_id', 'type', 'title', 'message', 'data', 'is_read', 'is_delivered', 'delivered_at', 'read_at', 'created_at', 'updated_at'];
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\n⚠️ Отсутствующие поля:', missingColumns);
    } else {
      console.log('\n✅ Все необходимые поля присутствуют');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке таблицы:', error);
  }
}

checkNotificationsTable(); 