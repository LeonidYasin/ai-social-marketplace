const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function compareScreenshots() {
  console.log('🔍 Сравнение скриншотов...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    const screenshots = [
      { name: 'final_01_initial.png', description: 'Начальный экран' },
      { name: 'final_02_after_login_click.png', description: 'После клика по кнопке входа' }
    ];
    
    const screenshotData = [];
    
    for (const screenshot of screenshots) {
      const filePath = path.join('./test_screenshots', screenshot.name);
      
      if (fs.existsSync(filePath)) {
        console.log(`\n📸 Анализируем: ${screenshot.name}`);
        
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        const stats = fs.statSync(filePath);
        
        screenshotData.push({
          name: screenshot.name,
          description: screenshot.description,
          base64: base64Image,
          filePath: filePath,
          fileSize: (stats.size / 1024).toFixed(1),
          creationDate: stats.birthtime.toLocaleString()
        });
        
        console.log(`   📐 Размер файла: ${(stats.size / 1024).toFixed(1)} KB`);
        console.log(`   📅 Дата создания: ${stats.birthtime.toLocaleString()}`);
        
      } else {
        console.log(`❌ Файл не найден: ${screenshot.name}`);
      }
    }
    
    if (screenshotData.length === 2) {
      // Создаем HTML страницу для сравнения
      await page.setContent(`
        <html>
          <head>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f0f0f0; }
              .container { max-width: 1200px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .comparison { display: flex; gap: 20px; margin-bottom: 30px; }
              .screenshot-container { flex: 1; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .screenshot { border: 2px solid #ddd; border-radius: 5px; margin: 10px 0; }
              .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
              .analysis { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .changes { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
              h1 { color: #333; }
              h2 { color: #666; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔍 Сравнение скриншотов UI теста</h1>
                <p>Анализ изменений после клика по кнопке входа</p>
              </div>
              
              <div class="comparison">
                <div class="screenshot-container">
                  <h2>📱 ${screenshotData[0].description}</h2>
                  <div class="info">
                    <p><strong>Файл:</strong> ${screenshotData[0].name}</p>
                    <p><strong>Размер:</strong> ${screenshotData[0].fileSize} KB</p>
                    <p><strong>Дата:</strong> ${screenshotData[0].creationDate}</p>
                  </div>
                  <div class="screenshot">
                    <img src="data:image/png;base64,${screenshotData[0].base64}" />
                  </div>
                  <div class="analysis">
                    <h3>🔍 Что ищем:</h3>
                    <ul>
                      <li>Кнопка "Войти в систему" или "Login"</li>
                      <li>Логотип приложения</li>
                      <li>Навигационное меню</li>
                      <li>Контент ленты</li>
                      <li>Боковые панели с пользователями</li>
                    </ul>
                  </div>
                </div>
                
                <div class="screenshot-container">
                  <h2>🔄 ${screenshotData[1].description}</h2>
                  <div class="info">
                    <p><strong>Файл:</strong> ${screenshotData[1].name}</p>
                    <p><strong>Размер:</strong> ${screenshotData[1].fileSize} KB</p>
                    <p><strong>Дата:</strong> ${screenshotData[1].creationDate}</p>
                  </div>
                  <div class="screenshot">
                    <img src="data:image/png;base64,${screenshotData[1].base64}" />
                  </div>
                  <div class="analysis">
                    <h3>🔍 Что изменилось:</h3>
                    <ul>
                      <li>Появился ли диалог входа?</li>
                      <li>Есть ли кнопка Email?</li>
                      <li>Изменился ли интерфейс?</li>
                      <li>Показаны ли пользователи в боковой панели?</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="changes">
                <h2>💡 Ключевые вопросы для анализа:</h2>
                <ol>
                  <li><strong>Кнопка входа:</strong> Видна ли кнопка "Войти в систему" на первом скриншоте?</li>
                  <li><strong>Диалог входа:</strong> Появился ли диалог с выбором способа входа после клика?</li>
                  <li><strong>Кнопка Email:</strong> Есть ли кнопка Email в диалоге?</li>
                  <li><strong>Пользователи:</strong> Видны ли другие пользователи в правой боковой панели?</li>
                  <li><strong>Интерактивность:</strong> Можно ли кликнуть по пользователю для начала чата?</li>
                </ol>
              </div>
              
              <div class="analysis">
                <h2>🎯 Рекомендации для исправления теста:</h2>
                <ol>
                  <li>Проверьте селекторы кнопок в тесте</li>
                  <li>Убедитесь, что пользователи зарегистрированы в системе</li>
                  <li>Проверьте, что боковая панель отображается корректно</li>
                  <li>Добавьте ожидания для загрузки контента</li>
                  <li>Проверьте консоль браузера на ошибки JavaScript</li>
                </ol>
              </div>
            </div>
          </body>
        </html>
      `);
      
      // Сохраняем HTML отчет
      const htmlContent = await page.content();
      const reportPath = './test_screenshots/screenshots_comparison.html';
      fs.writeFileSync(reportPath, htmlContent);
      console.log(`\n📄 HTML отчет сравнения сохранен: ${reportPath}`);
      
    }
    
    console.log('\n✅ Сравнение завершено');
    console.log('\n💡 Следующие шаги:');
    console.log('1. Откройте HTML отчет сравнения в браузере');
    console.log('2. Проанализируйте различия между скриншотами');
    console.log('3. Определите, почему тест не находит элементы');
    console.log('4. Проверьте селекторы в тестовом скрипте');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

compareScreenshots().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 