const fs = require('fs');
const path = require('path');

// Функция для чтения логов с правильной кодировкой UTF-8
function readLogFile(filePath, lines = 20) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    // Читаем файл в UTF-8
    const content = fs.readFileSync(filePath, 'utf8');
    const linesArray = content.split('\n');
    
    console.log(`\n=== ${path.basename(filePath)} (Last ${lines} lines) ===`);
    console.log('='.repeat(60));
    
    const recentLines = linesArray.slice(-lines);
    recentLines.forEach(line => {
      if (line.trim()) {
        console.log(line);
      }
    });
    
    console.log('='.repeat(60));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

// Читаем логи бэкенда
readLogFile('backend/logs/backend.log', 30);

// Читаем логи фронтенда
readLogFile('backend/logs/frontend.log', 20);

// Читаем логи ошибок
readLogFile('backend/logs/errors.log', 15);

console.log('\n=== Checking for SASL errors ===');
console.log('='.repeat(60));

// Проверяем наличие SASL ошибок
try {
  const backendLog = fs.readFileSync('backend/logs/backend.log', 'utf8');
  
  const saslErrors = backendLog.match(/SASL.*client password must be a string/gi);
  if (saslErrors) {
    console.log('Found SASL errors:');
    saslErrors.forEach(error => {
      console.log(`- ${error}`);
    });
  } else {
    console.log('No SASL errors found in recent logs');
  }
  
  // Проверяем ошибки подключения к базе данных
  const dbErrors = backendLog.match(/database.*error|connection.*error|password.*error/gi);
  if (dbErrors) {
    console.log('\nDatabase-related errors:');
    dbErrors.slice(0, 10).forEach(error => {
      console.log(`- ${error}`);
    });
  }
  
} catch (error) {
  console.error('Error checking for SASL errors:', error.message);
}

console.log('='.repeat(60)); 