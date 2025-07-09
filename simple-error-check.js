#!/usr/bin/env node

/**
 * Простая проверка ошибок проекта
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка проекта на ошибки...\n');

// Проверка структуры проекта
console.log('📁 Проверка структуры проекта:');
const requiredDirs = ['backend', 'frontend', 'logs'];
const requiredFiles = ['package.json', 'backend/package.json', 'frontend/package.json'];

for (const dir of requiredDirs) {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - НЕ НАЙДЕН`);
  }
}

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - НЕ НАЙДЕН`);
  }
}

// Проверка логов
console.log('\n📋 Проверка логов:');
const logsDir = path.join(__dirname, 'logs');
if (fs.existsSync(logsDir)) {
  const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.json'));
  console.log(`✅ Найдено ${logFiles.length} файлов логов`);
  
  // Проверяем последний файл на ошибки
  if (logFiles.length > 0) {
    const latestLog = logFiles
      .map(f => ({ file: f, mtime: fs.statSync(path.join(logsDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime)[0];
    
    try {
      const logPath = path.join(logsDir, latestLog.file);
      const logContent = fs.readFileSync(logPath, 'utf8');
      const logData = JSON.parse(logContent);
      
      if (logData.logs) {
        const errors = logData.logs.filter(log => 
          log.level?.toLowerCase() === 'error' || 
          log.message?.toLowerCase().includes('error')
        );
        
        if (errors.length > 0) {
          console.log(`⚠️ Найдено ${errors.length} ошибок в последнем логе`);
          errors.slice(0, 3).forEach(error => {
            console.log(`   - ${error.message}`);
          });
        } else {
          console.log('✅ Ошибок в логах не найдено');
        }
      }
    } catch (error) {
      console.log(`❌ Ошибка при чтении логов: ${error.message}`);
    }
  }
} else {
  console.log('❌ Папка logs не найдена');
}

// Проверка конфигурации
console.log('\n🔧 Проверка конфигурации:');

// Проверяем backend/config.env
const configPath = path.join(__dirname, 'backend', 'config.env');
if (fs.existsSync(configPath)) {
  console.log('✅ backend/config.env найден');
} else {
  console.log('❌ backend/config.env НЕ НАЙДЕН');
}

// Проверяем package.json файлы
const packageFiles = ['package.json', 'backend/package.json', 'frontend/package.json'];
for (const pkgFile of packageFiles) {
  if (fs.existsSync(pkgFile)) {
    try {
      const pkgData = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      if (pkgData.dependencies) {
        console.log(`✅ ${pkgFile} - зависимости найдены`);
      } else {
        console.log(`⚠️ ${pkgFile} - нет зависимостей`);
      }
    } catch (error) {
      console.log(`❌ ${pkgFile} - ошибка чтения: ${error.message}`);
    }
  } else {
    console.log(`❌ ${pkgFile} - НЕ НАЙДЕН`);
  }
}

// Проверка основных файлов приложения
console.log('\n📄 Проверка основных файлов:');
const appFiles = [
  'backend/src/app.js',
  'backend/src/utils/db.js',
  'backend/src/utils/logger.js',
  'frontend/src/App.jsx'
];

for (const appFile of appFiles) {
  if (fs.existsSync(appFile)) {
    console.log(`✅ ${appFile}`);
  } else {
    console.log(`❌ ${appFile} - НЕ НАЙДЕН`);
  }
}

// Проверка render.yaml
console.log('\n🚀 Проверка деплоя:');
const renderYaml = 'render.yaml';
if (fs.existsSync(renderYaml)) {
  console.log('✅ render.yaml найден');
} else {
  console.log('❌ render.yaml НЕ НАЙДЕН');
}

console.log('\n' + '='.repeat(50));
console.log('✅ Проверка завершена');
console.log('='.repeat(50)); 