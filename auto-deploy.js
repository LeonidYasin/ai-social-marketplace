const fs = require('fs');
const path = require('path');

console.log('🚀 Автоматическое развёртывание на Render.com\n');

const versions = [
  { name: 'render.yaml', description: 'Полная версия с зависимостями' },
  { name: 'render-auto.yaml', description: 'Упрощённая версия без fromService' },
  { name: 'render-minimal.yaml', description: 'Минимальная версия' }
];

console.log('📋 Доступные версии render.yaml:');
versions.forEach((version, index) => {
  const exists = fs.existsSync(version.name);
  console.log(`  ${index + 1}. ${version.name} - ${version.description} ${exists ? '✅' : '❌'}`);
});

console.log('\n🎯 Рекомендуемый порядок попыток:');
console.log('1. Сначала попробуйте render.yaml (полная версия)');
console.log('2. Если ошибка - используйте render-auto.yaml');
console.log('3. Если снова ошибка - используйте render-minimal.yaml');
console.log('4. В крайнем случае - ручное развёртывание');

console.log('\n📋 Инструкции для Render Dashboard:');
console.log('1. Перейдите в https://dashboard.render.com/');
console.log('2. Нажмите "New +" → "Blueprint"');
console.log('3. Подключите ваш GitHub репозиторий');
console.log('4. Нажмите "Create Blueprint Instance"');
console.log('5. Если ошибка - используйте другую версию render.yaml');

console.log('\n🔄 Для смены версии render.yaml:');
console.log('1. Переименуйте текущий: mv render.yaml render.yaml.current');
console.log('2. Активируйте нужную: mv render-auto.yaml render.yaml');
console.log('3. Закоммитьте: git add . && git commit -m "Switch render.yaml version"');
console.log('4. Отправьте: git push origin main');

console.log('\n📖 Дополнительная документация:');
console.log('- MANUAL_DEPLOYMENT.md - ручное развёртывание');
console.log('- QUICK_DEPLOY.md - быстрое руководство');
console.log('- DEPLOYMENT_GUIDE.md - подробное руководство');

console.log('\n🎉 Удачного развёртывания!'); 