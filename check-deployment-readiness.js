const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка готовности к развёртыванию на Render.com...\n');

// Список необходимых файлов
const requiredFiles = [
  'render.yaml',
  'backend/package.json',
  'frontend/package.json',
  'backend/src/app.js',
  'frontend/src/App.jsx',
  'setup_database.sql',
  'backend/init-db.js',
  'backend/health-check.js',
  'frontend/env.example'
];

// Список рекомендуемых файлов
const recommendedFiles = [
  'DEPLOYMENT_GUIDE.md',
  'README.md',
  '.gitignore'
];

let allGood = true;

// Проверяем необходимые файлы
console.log('📋 Проверка необходимых файлов:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - НЕ НАЙДЕН`);
    allGood = false;
  }
});

console.log('\n📋 Проверка рекомендуемых файлов:');
recommendedFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - не найден (рекомендуется)`);
  }
});

// Проверяем package.json файлы
console.log('\n📦 Проверка package.json файлов:');

// Backend package.json
try {
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const backendScripts = backendPackage.scripts || {};
  
  console.log('  Backend scripts:');
  ['start', 'init-db', 'health-check'].forEach(script => {
    if (backendScripts[script]) {
      console.log(`    ✅ ${script}`);
    } else {
      console.log(`    ❌ ${script} - отсутствует`);
      allGood = false;
    }
  });
} catch (error) {
  console.log('  ❌ Ошибка чтения backend/package.json');
  allGood = false;
}

// Frontend package.json
try {
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  const frontendScripts = frontendPackage.scripts || {};
  
  console.log('  Frontend scripts:');
  ['start', 'build'].forEach(script => {
    if (frontendScripts[script]) {
      console.log(`    ✅ ${script}`);
    } else {
      console.log(`    ❌ ${script} - отсутствует`);
      allGood = false;
    }
  });
} catch (error) {
  console.log('  ❌ Ошибка чтения frontend/package.json');
  allGood = false;
}

// Проверяем render.yaml
console.log('\n⚙️  Проверка render.yaml:');
try {
  const renderYaml = fs.readFileSync('render.yaml', 'utf8');
  
  const checks = [
    { name: 'PostgreSQL Database', pattern: 'type: pserv' },
    { name: 'Backend Service', pattern: 'name: social-marketplace-backend' },
    { name: 'Frontend Service', pattern: 'name: social-marketplace-frontend' },
    { name: 'Database Connection', pattern: 'fromDatabase:' },
    { name: 'Environment Variables', pattern: 'envVars:' }
  ];
  
  checks.forEach(check => {
    if (renderYaml.includes(check.pattern)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - не настроен`);
      allGood = false;
    }
  });
} catch (error) {
  console.log('  ❌ Ошибка чтения render.yaml');
  allGood = false;
}

// Проверяем .gitignore
console.log('\n📁 Проверка .gitignore:');
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const gitignoreChecks = [
    'node_modules',
    '.env',
    'logs',
    '*.log'
  ];
  
  gitignoreChecks.forEach(item => {
    if (gitignore.includes(item)) {
      console.log(`  ✅ ${item}`);
    } else {
      console.log(`  ⚠️  ${item} - не добавлен в .gitignore`);
    }
  });
} catch (error) {
  console.log('  ⚠️  .gitignore не найден');
}

// Итоговая оценка
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 Проект готов к развёртыванию на Render.com!');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Убедитесь, что код закоммичен в git');
  console.log('2. Создайте сервисы в Render Dashboard');
  console.log('3. Настройте переменные окружения');
  console.log('4. Инициализируйте базу данных');
  console.log('\n📖 Подробные инструкции см. в DEPLOYMENT_GUIDE.md');
} else {
  console.log('❌ Проект НЕ готов к развёртыванию');
  console.log('Исправьте указанные ошибки и запустите проверку снова');
}
console.log('='.repeat(50)); 