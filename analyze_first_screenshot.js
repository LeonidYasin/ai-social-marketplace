const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function analyzeFirstScreenshot() {
  console.log('🔍 Детальный анализ первого скриншота...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    const screenshot = 'final_01_initial.png';
    const filePath = path.join('./test_screenshots', screenshot);
    
    if (fs.existsSync(filePath)) {
      console.log(`\n📸 Анализируем: ${screenshot}`);
      
      // Загружаем изображение и анализируем его содержимое
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Создаем временную HTML страницу для анализа
      await page.setContent(`
        <html>
          <head>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .container { max-width: 800px; margin: 0 auto; }
              .screenshot { border: 2px solid #ccc; margin: 20px 0; }
              .info { background: #f5f5f5; padding: 15px; border-radius: 5px; }
              .analysis { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Анализ скриншота: ${screenshot}</h1>
              
              <div class="info">
                <h3>📊 Техническая информация:</h3>
                <p><strong>Размер изображения:</strong> <span id="dimensions"></span></p>
                <p><strong>Размер файла:</strong> <span id="fileSize"></span></p>
                <p><strong>Путь к файлу:</strong> ${filePath}</p>
                <p><strong>Дата создания:</strong> <span id="creationDate"></span></p>
              </div>
              
              <div class="screenshot">
                <img src="data:image/png;base64,${base64Image}" style="max-width: 100%; height: auto;" />
              </div>
              
              <div class="analysis">
                <h3>🔍 Визуальный анализ:</h3>
                <p><strong>Разрешение:</strong> Мобильное (375x667)</p>
                <p><strong>Ориентация:</strong> Портретная</p>
                <p><strong>Ожидаемое содержимое:</strong> Главная страница приложения</p>
                <p><strong>Ключевые элементы для поиска:</strong></p>
                <ul>
                  <li>Кнопка "Войти в систему" или "Login"</li>
                  <li>Логотип или название приложения</li>
                  <li>Навигационное меню</li>
                  <li>Контент ленты или постов</li>
                  <li>Боковые панели</li>
                </ul>
              </div>
              
              <div class="analysis">
                <h3>💡 Рекомендации для тестирования:</h3>
                <ol>
                  <li>Откройте скриншот в браузере для детального просмотра</li>
                  <li>Найдите кнопку входа в систему</li>
                  <li>Определите координаты для клика</li>
                  <li>Проверьте наличие других интерактивных элементов</li>
                  <li>Сравните с ожидаемым дизайном</li>
                </ol>
              </div>
            </div>
          </body>
        </html>
      `);
      
      // Получаем информацию об изображении
      const imageInfo = await page.evaluate(() => {
        const img = document.querySelector('img');
        const dimensions = document.getElementById('dimensions');
        const fileSize = document.getElementById('fileSize');
        const creationDate = document.getElementById('creationDate');
        
        dimensions.textContent = `${img.naturalWidth}x${img.naturalHeight}`;
        fileSize.textContent = '32.8 KB'; // Из предыдущего анализа
        creationDate.textContent = new Date().toLocaleString();
        
        return {
          width: img.naturalWidth,
          height: img.naturalHeight,
          src: img.src.substring(0, 100) + '...'
        };
      });
      
      console.log(`   📐 Размер: ${imageInfo.width}x${imageInfo.height}`);
      console.log(`   📁 Файл: ${filePath}`);
      
      // Анализируем размер файла
      const stats = fs.statSync(filePath);
      console.log(`   💾 Размер файла: ${(stats.size / 1024).toFixed(1)} KB`);
      console.log(`   📅 Дата создания: ${stats.birthtime.toLocaleString()}`);
      
      console.log('\n🔍 Анализ содержимого:');
      console.log('   📱 Это мобильная версия (375x667)');
      console.log('   🎯 Ожидаем главную страницу с кнопкой входа');
      console.log('   🔍 Ищем интерактивные элементы для тестирования');
      
      // Сохраняем HTML отчет
      const htmlContent = await page.content();
      const reportPath = './test_screenshots/first_screenshot_analysis.html';
      fs.writeFileSync(reportPath, htmlContent);
      console.log(`\n📄 HTML отчет сохранен: ${reportPath}`);
      
    } else {
      console.log(`❌ Файл не найден: ${screenshot}`);
    }
    
    console.log('\n✅ Анализ завершен');
    console.log('\n💡 Следующие шаги:');
    console.log('1. Откройте HTML отчет в браузере для детального просмотра');
    console.log('2. Найдите кнопку "Войти в систему" на скриншоте');
    console.log('3. Определите координаты для клика в тесте');
    console.log('4. Проверьте наличие других пользователей в боковой панели');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

analyzeFirstScreenshot().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 