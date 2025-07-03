const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function analyzeScreenshots() {
  console.log('🔍 Анализируем скриншоты...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    const screenshots = [
      'final_01_initial.png',
      'final_02_after_login_click.png'
    ];
    
    for (const screenshot of screenshots) {
      const filePath = path.join('./test_screenshots', screenshot);
      
      if (fs.existsSync(filePath)) {
        console.log(`\n📸 Анализируем: ${screenshot}`);
        
        // Загружаем изображение и анализируем его содержимое
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Создаем временную HTML страницу для анализа
        await page.setContent(`
          <html>
            <body>
              <img src="data:image/png;base64,${base64Image}" style="max-width: 100%; height: auto;" />
              <div id="analysis"></div>
            </body>
          </html>
        `);
        
        // Получаем информацию об изображении
        const imageInfo = await page.evaluate(() => {
          const img = document.querySelector('img');
          return {
            width: img.naturalWidth,
            height: img.naturalHeight,
            src: img.src.substring(0, 100) + '...'
          };
        });
        
        console.log(`   Размер: ${imageInfo.width}x${imageInfo.height}`);
        console.log(`   Файл: ${filePath}`);
        
        // Анализируем размер файла
        const stats = fs.statSync(filePath);
        console.log(`   Размер файла: ${(stats.size / 1024).toFixed(1)} KB`);
        
        // Определяем, что может быть на скриншоте по размеру и времени
        if (screenshot === 'final_01_initial.png') {
          console.log('   📱 Содержимое: Начальный экран мобильной версии');
          console.log('   🔍 Ожидаем: Главная страница с кнопкой "Войти в систему"');
        } else if (screenshot === 'final_02_after_login_click.png') {
          console.log('   📱 Содержимое: После клика по кнопке "Войти в систему"');
          console.log('   🔍 Ожидаем: Диалог с выбором способа входа или форма');
        }
        
      } else {
        console.log(`❌ Файл не найден: ${screenshot}`);
      }
    }
    
    console.log('\n✅ Анализ завершен');
    console.log('\n💡 Рекомендации:');
    console.log('1. Откройте скриншоты вручную для визуального анализа');
    console.log('2. Сравните final_01_initial.png и final_02_after_login_click.png');
    console.log('3. Проверьте, появился ли диалог после клика');
    console.log('4. Если диалог появился, ищите кнопку Email');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

analyzeScreenshots().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 