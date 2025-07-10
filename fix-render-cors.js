const https = require('https');

// Функция для проверки CORS
async function checkCors(url) {
  return new Promise((resolve) => {
    const options = {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://social-marketplace-frontend.onrender.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    const req = https.request(url, options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log('Headers:', res.headers);
      
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers'],
        'access-control-allow-credentials': res.headers['access-control-allow-credentials']
      };
      
      console.log('CORS Headers:', corsHeaders);
      resolve({ status: res.statusCode, headers: corsHeaders });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      resolve({ error: error.message });
    });

    req.end();
  });
}

// Проверяем различные эндпоинты
async function testEndpoints() {
  const baseUrl = 'https://social-marketplace-api.onrender.com';
  const endpoints = [
    '/api/health',
    '/api/users',
    '/api/posts',
    '/api/client-log'
  ];

  console.log('🔍 Проверка CORS на Render...\n');

  for (const endpoint of endpoints) {
    console.log(`\n📡 Тестируем: ${baseUrl}${endpoint}`);
    const result = await checkCors(`${baseUrl}${endpoint}`);
    
    if (result.error) {
      console.log(`❌ Ошибка: ${result.error}`);
    } else if (result.status === 200) {
      console.log(`✅ CORS настроен правильно`);
    } else {
      console.log(`⚠️  Статус: ${result.status}`);
    }
  }
}

// Проверяем обычные GET запросы
async function testGetRequests() {
  const baseUrl = 'https://social-marketplace-api.onrender.com';
  const endpoints = [
    '/api/health',
    '/api/users',
    '/api/posts'
  ];

  console.log('\n🔍 Проверка GET запросов...\n');

  for (const endpoint of endpoints) {
    console.log(`\n📡 GET: ${baseUrl}${endpoint}`);
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      console.log(`✅ Статус: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📄 Данные: ${JSON.stringify(data).substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
    }
  }
}

// Запускаем тесты
async function main() {
  console.log('🚀 Начинаем диагностику CORS проблем на Render\n');
  
  await testEndpoints();
  await testGetRequests();
  
  console.log('\n📋 Рекомендации по исправлению:');
  console.log('1. Убедитесь, что в backend/src/app.js правильно настроен CORS');
  console.log('2. Проверьте, что NODE_ENV=production на Render');
  console.log('3. Убедитесь, что фронтенд использует правильный URL бэкенда');
  console.log('4. Проверьте переменные окружения REACT_APP_API_URL');
}

main().catch(console.error); 