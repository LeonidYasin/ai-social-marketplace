const fetch = require('node-fetch');

async function testBackendStatus() {
  console.log('🔍 Тестирование исправления статуса бэкенда...\n');
  
  try {
    // Проверяем health endpoint
    console.log('1. Проверка health endpoint...');
    const healthResponse = await fetch('http://localhost:8000/api/health', {
      timeout: 5000
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint отвечает:', healthData.status);
    } else {
      console.log('❌ Health endpoint ошибка:', healthResponse.status);
    }
    
    // Проверяем admin health endpoint
    console.log('\n2. Проверка admin health endpoint...');
    const adminHealthResponse = await fetch('http://localhost:8000/api/admin/health', {
      timeout: 5000
    });
    
    if (adminHealthResponse.ok) {
      const adminHealthData = await adminHealthResponse.json();
      console.log('✅ Admin health endpoint отвечает:', adminHealthData.status);
    } else {
      console.log('❌ Admin health endpoint ошибка:', adminHealthResponse.status);
    }
    
    // Проверяем frontend
    console.log('\n3. Проверка frontend...');
    const frontendResponse = await fetch('http://localhost:3000', {
      timeout: 5000
    });
    
    if (frontendResponse.ok) {
      console.log('✅ Frontend отвечает:', frontendResponse.status);
    } else {
      console.log('❌ Frontend ошибка:', frontendResponse.status);
    }
    
    console.log('\n🎉 Тест завершен!');
    console.log('\n📋 Инструкции для проверки в браузере:');
    console.log('1. Откройте http://localhost:3000');
    console.log('2. Проверьте лампочку статуса - должна быть зеленой');
    console.log('3. Проверьте ленту событий - не должно быть "Бэкенд не отвечает"');
    console.log('4. Откройте консоль браузера (F12) и проверьте логи');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    console.log('\n🔧 Возможные решения:');
    console.log('1. Убедитесь, что серверы запущены (start-all.ps1)');
    console.log('2. Проверьте порты 8000 и 3000');
    console.log('3. Проверьте логи в консоли');
  }
}

testBackendStatus(); 