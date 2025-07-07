const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

try {
  const logPath = path.join(__dirname, 'backend', 'logs', 'backend.log');
  
  if (!fs.existsSync(logPath)) {
    console.log('❌ Файл логов не найден:', logPath);
    return;
  }
  
  // Читаем весь файл как UTF-8 (Buffer)
  const logBuffer = fs.readFileSync(logPath);
  const logContent = logBuffer.toString('utf8');
  
  // Разбиваем на строки и берем последние 30
  const lines = logContent.split('\n');
  const lastLines = lines.slice(-30);
  
  console.log('=== Последние 30 строк логов бэкенда ===');
  console.log('');
  
  lastLines.forEach((line, index) => {
    if (line.trim()) {
      // Перекодируем строку в Windows-1251 для корректного вывода в консоль
      const win1251 = iconv.encode(line, 'win1251');
      process.stdout.write(`${index + 1}: `);
      process.stdout.write(win1251);
      process.stdout.write('\n');
    }
  });
  
} catch (error) {
  console.error('❌ Ошибка чтения логов:', error.message);
} 