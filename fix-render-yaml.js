const fs = require('fs');
const path = require('path');

console.log('🔧 Исправление проблем с render.yaml...\n');

// Проверяем существование файлов
const renderYamlPath = path.join(__dirname, 'render.yaml');
const renderSimplePath = path.join(__dirname, 'render-simple.yaml');

if (!fs.existsSync(renderYamlPath)) {
  console.log('❌ Файл render.yaml не найден');
  process.exit(1);
}

if (!fs.existsSync(renderSimplePath)) {
  console.log('❌ Файл render-simple.yaml не найден');
  process.exit(1);
}

try {
  // Создаём резервную копию
  const backupPath = path.join(__dirname, 'render.yaml.backup');
  fs.copyFileSync(renderYamlPath, backupPath);
  console.log('✅ Создана резервная копия: render.yaml.backup');

  // Копируем упрощённую версию
  fs.copyFileSync(renderSimplePath, renderYamlPath);
  console.log('✅ Заменён render.yaml на упрощённую версию');

  console.log('\n📋 Следующие шаги:');
  console.log('1. Закоммитьте изменения:');
  console.log('   git add .');
  console.log('   git commit -m "Fix render.yaml syntax"');
  console.log('   git push origin main');
  console.log('');
  console.log('2. Попробуйте развёртывание снова в Render Dashboard');
  console.log('');
  console.log('3. Если проблема остаётся, используйте ручное создание сервисов');

} catch (error) {
  console.error('❌ Ошибка при исправлении:', error.message);
  process.exit(1);
} 