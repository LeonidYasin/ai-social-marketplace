const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function analyzeMultiuserInitial() {
  console.log('🔍 Анализ начальных скриншотов мультипользовательского теста...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    const screenshots = [
      { name: 'user1_01_initial.png', description: 'Пользователь 1 - Начальный экран' },
      { name: 'user2_01_initial.png', description: 'Пользователь 2 - Начальный экран' }
    ];
    
    const screenshotData = [];
    
    for (const screenshot of screenshots) {
      const filePath = path.join('./test_screenshots/multiuser', screenshot.name);
      
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
      // Создаем HTML страницу для анализа
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
              .key-findings { background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; }
              h1 { color: #333; }
              h2 { color: #666; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔍 Анализ начальных экранов мультипользовательского теста</h1>
                <p>Сравнение того, что видят пользователи после входа в систему</p>
              </div>
              
              <div class="comparison">
                <div class="screenshot-container">
                  <h2>👤 ${screenshotData[0].description}</h2>
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
                      <li>Правая боковая панель с пользователями</li>
                      <li>Другой пользователь в списке</li>
                      <li>Кнопка для начала чата</li>
                      <li>Лента постов</li>
                      <li>Навигационное меню</li>
                    </ul>
                  </div>
                </div>
                
                <div class="screenshot-container">
                  <h2>👤 ${screenshotData[1].description}</h2>
                  <div class="info">
                    <p><strong>Файл:</strong> ${screenshotData[1].name}</p>
                    <p><strong>Размер:</strong> ${screenshotData[1].fileSize} KB</p>
                    <p><strong>Дата:</strong> ${screenshotData[1].creationDate}</p>
                  </div>
                  <div class="screenshot">
                    <img src="data:image/png;base64,${screenshotData[1].base64}" />
                  </div>
                  <div class="analysis">
                    <h3>🔍 Что ищем:</h3>
                    <ul>
                      <li>Правая боковая панель с пользователями</li>
                      <li>Другой пользователь в списке</li>
                      <li>Кнопка для начала чата</li>
                      <li>Лента постов</li>
                      <li>Навигационное меню</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="key-findings">
                <h2>🎯 Ключевые вопросы для анализа:</h2>
                <ol>
                  <li><strong>Боковая панель:</strong> Отображается ли правая боковая панель с пользователями?</li>
                  <li><strong>Другие пользователи:</strong> Видны ли другие пользователи в списке?</li>
                  <li><strong>Интерактивность:</strong> Можно ли кликнуть по пользователю?</li>
                  <li><strong>Чат:</strong> Открывается ли чат после клика?</li>
                  <li><strong>Различия:</strong> Есть ли различия между экранами пользователей?</li>
                </ol>
              </div>
              
              <div class="analysis">
                <h2>💡 Рекомендации для исправления теста:</h2>
                <ol>
                  <li>Проверьте, что пользователи действительно зарегистрированы и видны друг другу</li>
                  <li>Убедитесь, что боковая панель отображается корректно</li>
                  <li>Проверьте селекторы для пользователей в боковой панели</li>
                  <li>Добавьте ожидания для загрузки списка пользователей</li>
                  <li>Проверьте, что чат открывается после клика по пользователю</li>
                </ol>
              </div>
              
              <div class="analysis">
                <h2>📋 Следующие шаги:</h2>
                <ol>
                  <li>Проанализируйте скриншоты боковой панели (user1_06_sidebar_check.png)</li>
                  <li>Проверьте скриншоты чата (user1_08_chat_check.png)</li>
                  <li>Изучите скриншоты сообщений (user1_11_messages_check.png)</li>
                  <li>Сравните с ожидаемым поведением</li>
                  <li>Обновите селекторы в тестовом скрипте</li>
                </ol>
              </div>
            </div>
          </body>
        </html>
      `);
      
      // Сохраняем HTML отчет
      const htmlContent = await page.content();
      const reportPath = './test_screenshots/multiuser_initial_analysis.html';
      fs.writeFileSync(reportPath, htmlContent);
      console.log(`\n📄 HTML отчет анализа сохранен: ${reportPath}`);
      
    }
    
    console.log('\n✅ Анализ завершен');
    console.log('\n💡 Следующие шаги:');
    console.log('1. Откройте HTML отчет анализа в браузере');
    console.log('2. Проанализируйте, что видят пользователи после входа');
    console.log('3. Проверьте наличие боковой панели с пользователями');
    console.log('4. Определите, почему тест не может найти элементы');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

analyzeMultiuserInitial().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 