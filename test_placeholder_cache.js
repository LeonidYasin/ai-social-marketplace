const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8000';

async function testPlaceholderCache() {
  console.log('🧪 Тестирование системы кэширования placeholder изображений\n');

  try {
    // Тест 1: Первый запрос (должен сгенерировать изображение)
    console.log('📸 Тест 1: Первый запрос (генерация)');
    const start1 = Date.now();
    const response1 = await fetch(`${BASE_URL}/api/placeholder/150/150/cccccc/000000/Test%20Image`);
    const end1 = Date.now();
    
    if (response1.ok) {
      console.log(`✅ Статус: ${response1.status}`);
      console.log(`⏱️  Время: ${end1 - start1}ms`);
      console.log(`📊 Кэш: ${response1.headers.get('X-Cache')}`);
      console.log(`📦 Размер: ${response1.headers.get('Content-Length')} байт\n`);
    } else {
      console.log(`❌ Ошибка: ${response1.status} - ${response1.statusText}\n`);
      return;
    }

    // Тест 2: Повторный запрос (должен взять из кэша)
    console.log('🔄 Тест 2: Повторный запрос (кэш)');
    const start2 = Date.now();
    const response2 = await fetch(`${BASE_URL}/api/placeholder/150/150/cccccc/000000/Test%20Image`);
    const end2 = Date.now();
    
    if (response2.ok) {
      console.log(`✅ Статус: ${response2.status}`);
      console.log(`⏱️  Время: ${end2 - start2}ms`);
      console.log(`📊 Кэш: ${response2.headers.get('X-Cache')}`);
      console.log(`📦 Размер: ${response2.headers.get('Content-Length')} байт\n`);
    } else {
      console.log(`❌ Ошибка: ${response2.status} - ${response2.statusText}\n`);
      return;
    }

    // Тест 3: Другой размер (новое изображение)
    console.log('🆕 Тест 3: Новый размер (генерация)');
    const start3 = Date.now();
    const response3 = await fetch(`${BASE_URL}/api/placeholder/300/200/eeeeee/333333/Another%20Image`);
    const end3 = Date.now();
    
    if (response3.ok) {
      console.log(`✅ Статус: ${response3.status}`);
      console.log(`⏱️  Время: ${end3 - start3}ms`);
      console.log(`📊 Кэш: ${response3.headers.get('X-Cache')}`);
      console.log(`📦 Размер: ${response3.headers.get('Content-Length')} байт\n`);
    } else {
      console.log(`❌ Ошибка: ${response3.status} - ${response3.statusText}\n`);
      return;
    }

    // Тест 4: Статистика кэша
    console.log('📊 Тест 4: Статистика кэша');
    const statsResponse = await fetch(`${BASE_URL}/api/placeholder/cache/stats`);
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log(`✅ Файлов в кэше: ${stats.totalFiles}`);
      console.log(`📦 Общий размер: ${stats.totalSizeMB} MB`);
      console.log(`💾 Размер в байтах: ${stats.totalSizeBytes}\n`);
    } else {
      console.log(`❌ Ошибка получения статистики: ${statsResponse.status}\n`);
    }

    // Тест 5: Проверка файлов в кэше
    console.log('📁 Тест 5: Проверка файлов в кэше');
    const cacheDir = path.join(__dirname, 'backend/cache/placeholders');
    
    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir);
      const pngFiles = files.filter(file => file.endsWith('.png'));
      
      console.log(`✅ Папка кэша существует`);
      console.log(`📄 PNG файлов: ${pngFiles.length}`);
      
      if (pngFiles.length > 0) {
        console.log('📋 Список файлов:');
        pngFiles.forEach(file => {
          const filePath = path.join(cacheDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   - ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
        });
      }
    } else {
      console.log(`❌ Папка кэша не найдена: ${cacheDir}`);
    }

    console.log('\n🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Убедитесь, что backend сервер запущен на порту 8000');
      console.log('   Запустите: npm start в папке backend');
    }
  }
}

// Запуск теста
testPlaceholderCache(); 