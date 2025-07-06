const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.log('🔧 Переключение версии render.yaml\n');
  console.log('Использование: node switch-render-version.js <version>');
  console.log('\nДоступные версии:');
  console.log('  full     - render.yaml (полная версия)');
  console.log('  auto     - render-auto.yaml (упрощённая)');
  console.log('  minimal  - render-minimal.yaml (минимальная)');
  console.log('  working  - render-working.yaml (рабочая версия)');
  console.log('  ultra    - render-ultra-simple.yaml (ультра-простая)');
  console.log('  final    - render-final.yaml (финальная версия)');
  console.log('\nПример: node switch-render-version.js final');
  process.exit(1);
}

const versions = {
  full: 'render.yaml',
  auto: 'render-auto.yaml',
  minimal: 'render-minimal.yaml',
  working: 'render-working.yaml',
  ultra: 'render-ultra-simple.yaml',
  final: 'render-final.yaml'
};

const targetFile = versions[version];

if (!targetFile) {
  console.log('❌ Неизвестная версия:', version);
  console.log('Доступные версии:', Object.keys(versions).join(', '));
  process.exit(1);
}

if (!fs.existsSync(targetFile)) {
  console.log('❌ Файл не найден:', targetFile);
  process.exit(1);
}

try {
  // Создаём резервную копию текущего
  if (fs.existsSync('render.yaml')) {
    fs.copyFileSync('render.yaml', 'render.yaml.backup');
    console.log('✅ Создана резервная копия: render.yaml.backup');
  }

  // Копируем нужную версию
  fs.copyFileSync(targetFile, 'render.yaml');
  console.log(`✅ Активирована версия: ${targetFile}`);

  console.log('\n📋 Следующие шаги:');
  console.log('1. Закоммитьте изменения:');
  console.log('   git add .');
  console.log(`   git commit -m "Switch to ${version} render.yaml version"`);
  console.log('   git push origin main');
  console.log('');
  console.log('2. Попробуйте развёртывание в Render Dashboard');

} catch (error) {
  console.error('❌ Ошибка при переключении:', error.message);
  process.exit(1);
} 