const fs = require('fs');
const path = require('path');

console.log('🔧 Исправление проблем с render.yaml...\n');

// Проверяем существование файлов
const renderYamlPath = path.join(__dirname, 'render.yaml');
const renderMinimalPath = path.join(__dirname, 'render-minimal.yaml');

if (!fs.existsSync(renderYamlPath)) {
  console.log('❌ Файл render.yaml не найден');
  process.exit(1);
}

if (!fs.existsSync(renderMinimalPath)) {
  console.log('❌ Файл render-minimal.yaml не найден');
  process.exit(1);
}

try {
  // Создаём резервную копию
  const backupPath = path.join(__dirname, 'render.yaml.backup');
  fs.copyFileSync(renderYamlPath, backupPath);
  console.log('✅ Создана резервная копия: render.yaml.backup');

  // Копируем минимальную версию
  fs.copyFileSync(renderMinimalPath, renderYamlPath);
  console.log('✅ Заменён render.yaml на минимальную версию');

  console.log('\n📋 Следующие шаги:');
  console.log('1. Закоммитьте изменения:');
  console.log('   git add .');
  console.log('   git commit -m "Use minimal render.yaml"');
  console.log('   git push origin main');
  console.log('');
  console.log('2. Попробуйте развёртывание снова в Render Dashboard');
  console.log('');
  console.log('3. После создания сервисов настройте переменные окружения вручную:');
  console.log('   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  console.log('   - JWT_SECRET, SESSION_SECRET');
  console.log('   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
  console.log('   - TELEGRAM_BOT_TOKEN');
  console.log('   - REACT_APP_API_URL, REACT_APP_WS_URL');

} catch (error) {
  console.error('❌ Ошибка при исправлении:', error.message);
  process.exit(1);
} 