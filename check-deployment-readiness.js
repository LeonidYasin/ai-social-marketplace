#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка готовности к деплою на Render.com...\n');

let allChecksPassed = true;

// Проверка 1: render.yaml
console.log('1. Проверка render.yaml...');
if (fs.existsSync('render.yaml')) {
  const renderYaml = fs.readFileSync('render.yaml', 'utf8');
  if (renderYaml.includes('buildCommand: cd backend') && 
      renderYaml.includes('startCommand: cd backend') &&
      renderYaml.includes('buildCommand: cd frontend')) {
    console.log('✅ render.yaml настроен правильно');
  } else {
    console.log('❌ render.yaml требует исправлений');
    allChecksPassed = false;
  }
} else {
  console.log('❌ render.yaml не найден');
  allChecksPassed = false;
}

// Проверка 2: backend/package.json
console.log('\n2. Проверка backend/package.json...');
if (fs.existsSync('backend/package.json')) {
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  if (backendPackage.scripts && backendPackage.scripts.start) {
    console.log('✅ backend/package.json содержит скрипт start');
  } else {
    console.log('❌ backend/package.json не содержит скрипт start');
    allChecksPassed = false;
  }
} else {
  console.log('❌ backend/package.json не найден');
  allChecksPassed = false;
}

// Проверка 3: frontend/package.json
console.log('\n3. Проверка frontend/package.json...');
if (fs.existsSync('frontend/package.json')) {
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  if (frontendPackage.scripts && frontendPackage.scripts.build) {
    console.log('✅ frontend/package.json содержит скрипт build');
  } else {
    console.log('❌ frontend/package.json не содержит скрипт build');
    allChecksPassed = false;
  }
} else {
  console.log('❌ frontend/package.json не найден');
  allChecksPassed = false;
}

// Проверка 4: backend/src/app.js
console.log('\n4. Проверка backend/src/app.js...');
if (fs.existsSync('backend/src/app.js')) {
  console.log('✅ backend/src/app.js найден');
} else {
  console.log('❌ backend/src/app.js не найден');
  allChecksPassed = false;
}

// Проверка 5: frontend/src/App.jsx
console.log('\n5. Проверка frontend/src/App.jsx...');
if (fs.existsSync('frontend/src/App.jsx')) {
  console.log('✅ frontend/src/App.jsx найден');
} else {
  console.log('❌ frontend/src/App.jsx не найден');
  allChecksPassed = false;
}

// Проверка 6: Переменные окружения
console.log('\n6. Проверка переменных окружения...');
const envFiles = ['backend/config.env', 'frontend/.env', '.env'];
let envFileFound = false;

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    console.log(`✅ ${envFile} найден`);
    envFileFound = true;
    break;
  }
}

if (!envFileFound) {
  console.log('⚠️  Файл .env не найден (но это нормально для production)');
}

// Итоговая проверка
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('🎉 Проект готов к деплою на Render.com!');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Закоммитьте изменения: git add . && git commit -m "Fix render deployment"');
  console.log('2. Отправьте в репозиторий: git push origin main');
  console.log('3. Создайте новый проект в Render Dashboard');
  console.log('4. Выберите "Blueprint" и подключите ваш репозиторий');
  console.log('5. Настройте переменные окружения в Render Dashboard');
} else {
  console.log('❌ Проект требует исправлений перед деплоем');
  console.log('\n🔧 Необходимо исправить отмеченные выше проблемы');
}

console.log('\n📚 Дополнительная информация:');
console.log('- Подробная инструкция: QUICK_DEPLOY.md');
console.log('- Полная документация: DEPLOYMENT_GUIDE.md'); 