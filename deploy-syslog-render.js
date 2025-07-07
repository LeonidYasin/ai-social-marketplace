const fs = require('fs');
const path = require('path');

console.log('🚀 Подготовка к деплою на Render с syslog сервером...\n');

// Проверка наличия необходимых файлов
const requiredFiles = [
  'backend/src/utils/syslogServer.js',
  'backend/src/routes/syslog.js',
  'render-blueprint.yaml',
  'SYSLOG_RENDER_SETUP.md'
];

console.log('📋 Проверка файлов...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - НЕ НАЙДЕН`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Некоторые файлы отсутствуют. Создайте их перед деплоем.');
  process.exit(1);
}

// Проверка package.json
console.log('\n📦 Проверка зависимостей...');
const packagePath = 'backend/package.json';
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageJson.dependencies.dgram) {
    console.log('✅ dgram зависимость найдена');
  } else {
    console.log('❌ dgram зависимость отсутствует');
    console.log('Добавьте "dgram": "^1.0.1" в dependencies');
  }
} else {
  console.log('❌ backend/package.json не найден');
}

// Создание инструкций по деплою
console.log('\n📝 Создание инструкций по деплою...');

const deployInstructions = `
# Инструкции по деплою на Render

## 1. Подготовка репозитория

Убедитесь, что все изменения закоммичены:

\`\`\`bash
git add .
git commit -m "Add syslog server for Render deployment"
git push origin main
\`\`\`

## 2. Деплой через Blueprint (рекомендуется)

1. Зайдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите "New" → "Blueprint"
3. Подключите ваш GitHub репозиторий
4. Выберите файл \`render-blueprint.yaml\`
5. Нажмите "Apply"

## 3. Ручная настройка

Если Blueprint не работает:

1. Создайте новый Web Service
2. Подключите ваш репозиторий
3. Установите переменные окружения:

\`\`\`env
NODE_ENV=production
ENABLE_SYSLOG=true
SYSLOG_PORT=514
SYSLOG_HOST=0.0.0.0
RENDER_SYSLOG_ENABLED=true
RENDER_SYSLOG_ENDPOINT=localhost:514
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
\`\`\`

4. Build Command: \`cd backend && npm install\`
5. Start Command: \`cd backend && npm start\`

## 4. Настройка syslog в Render

После деплоя:

1. Зайдите в настройки сервиса
2. Найдите раздел "Logs"
3. Включите "Log Streaming"
4. Установите:
   - Protocol: UDP
   - Host: ваш-домен.onrender.com
   - Port: 514

## 5. Тестирование

После деплоя проверьте:

\`\`\`bash
# Статус syslog сервера
curl https://your-app.onrender.com/api/syslog/status

# Конфигурация
curl https://your-app.onrender.com/api/syslog/config

# Логи
curl https://your-app.onrender.com/api/syslog/logs

# Render логи
curl https://your-app.onrender.com/api/syslog/render-logs
\`\`\`

## 6. Мониторинг

Создайте скрипт для мониторинга:

\`\`\`javascript
const axios = require('axios');

async function monitorSyslog() {
  try {
    const response = await axios.get('https://your-app.onrender.com/api/syslog/status');
    console.log('Syslog status:', response.data.data.isRunning ? '✅ Running' : '❌ Stopped');
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
  }
}

// Проверять каждые 5 минут
setInterval(monitorSyslog, 5 * 60 * 1000);
\`\`\`

## 7. Устранение неполадок

### Сервер не запускается
- Проверьте переменные окружения
- Проверьте логи: \`curl https://your-app.onrender.com/api/logs\`

### Логи не поступают
- Проверьте настройки syslog в Render Dashboard
- Убедитесь, что протокол UDP
- Проверьте правильность хоста и порта

### Проблемы с производительностью
- Ограничьте количество логов в API
- Настройте ротацию логов

## 8. Безопасность

- Ограничьте доступ к API endpoints
- Мониторьте размер лог файлов
- Настройте ротацию логов
- Рассмотрите использование TLS в production

## 9. Преимущества

✅ Автоматический прием логов от Render
✅ Не требует API токенов
✅ Работает на бесплатном тарифе
✅ Полный контроль над логами
✅ API для управления и мониторинга
✅ Простая интеграция через Blueprint

## 10. Следующие шаги

1. Настройте автоматические алерты
2. Добавьте мониторинг производительности
3. Настройте ротацию логов
4. Добавьте аутентификацию для API
5. Настройте резервное копирование логов
`;

fs.writeFileSync('DEPLOY_INSTRUCTIONS.md', deployInstructions);
console.log('✅ Создан файл DEPLOY_INSTRUCTIONS.md');

// Создание скрипта для быстрого тестирования
const testScript = `
const axios = require('axios');

async function testSyslogDeployment() {
  const baseUrl = process.argv[2] || 'http://localhost:8000';
  
  console.log(\`🧪 Тестирование syslog сервера на \${baseUrl}\`);
  
  const endpoints = [
    '/api/syslog/status',
    '/api/syslog/config',
    '/api/syslog/logs?limit=10',
    '/api/syslog/render-logs?limit=10'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(\`\${baseUrl}\${endpoint}\`);
      console.log(\`✅ \${endpoint}: \${response.status}\`);
      
      if (endpoint.includes('status') && response.data.data) {
        console.log(\`   Сервер: \${response.data.data.isRunning ? 'Запущен' : 'Остановлен'}\`);
        console.log(\`   Порт: \${response.data.data.port}\`);
      }
    } catch (error) {
      console.log(\`❌ \${endpoint}: \${error.response?.status || error.message}\`);
    }
  }
}

testSyslogDeployment();
`;

fs.writeFileSync('test-syslog-deployment.js', testScript);
console.log('✅ Создан файл test-syslog-deployment.js');

// Создание скрипта для мониторинга
const monitorScript = `
const axios = require('axios');

class SyslogMonitor {
  constructor(baseUrl, interval = 5 * 60 * 1000) {
    this.baseUrl = baseUrl;
    this.interval = interval;
    this.isRunning = false;
  }
  
  async checkHealth() {
    try {
      const response = await axios.get(\`\${this.baseUrl}/api/syslog/status\`);
      const status = response.data.data;
      
      const timestamp = new Date().toISOString();
      
      if (status.isRunning) {
        console.log(\`[\${timestamp}] ✅ Syslog сервер работает на порту \${status.port}\`);
      } else {
        console.log(\`[\${timestamp}] ❌ Syslog сервер остановлен\`);
      }
      
      return status.isRunning;
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.log(\`[\${timestamp}] ❌ Ошибка проверки: \${error.message}\`);
      return false;
    }
  }
  
  async getLogs(limit = 10) {
    try {
      const response = await axios.get(\`\${this.baseUrl}/api/syslog/logs?limit=\${limit}\`);
      return response.data.data.logs;
    } catch (error) {
      console.error('Ошибка получения логов:', error.message);
      return [];
    }
  }
  
  start() {
    if (this.isRunning) {
      console.log('Мониторинг уже запущен');
      return;
    }
    
    this.isRunning = true;
    console.log(\`🚀 Запуск мониторинга syslog сервера (\${this.baseUrl})\`);
    console.log(\`⏰ Интервал проверки: \${this.interval / 1000} секунд\`);
    
    // Первая проверка
    this.checkHealth();
    
    // Периодические проверки
    this.intervalId = setInterval(() => {
      this.checkHealth();
    }, this.interval);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log('🛑 Мониторинг остановлен');
    }
  }
}

// Использование
const baseUrl = process.argv[2] || 'http://localhost:8000';
const monitor = new SyslogMonitor(baseUrl);

monitor.start();

// Обработка завершения
process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});
`;

fs.writeFileSync('syslog-monitor.js', monitorScript);
console.log('✅ Создан файл syslog-monitor.js');

console.log('\n🎉 Подготовка завершена!');
console.log('\n📋 Следующие шаги:');
console.log('1. Проверьте файл DEPLOY_INSTRUCTIONS.md');
console.log('2. Запустите: node test-syslog-deployment.js [URL]');
console.log('3. Для мониторинга: node syslog-monitor.js [URL]');
console.log('4. Следуйте инструкциям для деплоя на Render');
console.log('\n🔗 Документация: SYSLOG_RENDER_SETUP.md'); 