const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function analyzeSidebarScreenshot() {
  console.log('🔍 Анализ скриншота боковой панели...');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    const screenshot = 'user1_06_sidebar_check.png';
    const filePath = path.join('./test_screenshots/multiuser', screenshot);
    
    if (fs.existsSync(filePath)) {
      console.log(`\n📸 Анализируем: ${screenshot}`);
      
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      const stats = fs.statSync(filePath);
      
      console.log(`   📐 Размер файла: ${(stats.size / 1024).toFixed(1)} KB`);
      console.log(`   📅 Дата создания: ${stats.birthtime.toLocaleString()}`);
      
      // Создаем HTML страницу для анализа
      await page.setContent(`
        <html>
          <head>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f0f0f0; }
              .container { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .screenshot-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
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
                <h1>🔍 Анализ боковой панели пользователей</h1>
                <p>Проверка отображения других пользователей в правой боковой панели</p>
              </div>
              
              <div class="screenshot-container">
                <h2>👥 Боковая панель пользователей</h2>
                <div class="info">
                  <p><strong>Файл:</strong> ${screenshot}</p>
                  <p><strong>Размер:</strong> ${(stats.size / 1024).toFixed(1)} KB</p>
                  <p><strong>Дата:</strong> ${stats.birthtime.toLocaleString()}</p>
                  <p><strong>Описание:</strong> Скриншот после проверки боковой панели</p>
                </div>
                <div class="screenshot">
                  <img src="data:image/png;base64,${base64Image}" />
                </div>
                <div class="analysis">
                  <h3>🔍 Что ищем в боковой панели:</h3>
                  <ul>
                    <li>Заголовок "Пользователи" или "Users"</li>
                    <li>Список других пользователей</li>
                    <li>Имена пользователей (user2, testuser2)</li>
                    <li>Аватары или иконки пользователей</li>
                    <li>Кнопки для начала чата</li>
                    <li>Статус онлайн/оффлайн</li>
                  </ul>
                </div>
                <div class="key-findings">
                  <h3>🎯 Ключевые вопросы:</h3>
                  <ol>
                    <li><strong>Видна ли боковая панель?</strong> Отображается ли правая панель с пользователями?</li>
                    <li><strong>Есть ли пользователи?</strong> Показаны ли другие пользователи в списке?</li>
                    <li><strong>Интерактивность:</strong> Можно ли кликнуть по пользователю?</li>
                    <li><strong>Дизайн:</strong> Как выглядит панель - список, карточки, иконки?</li>
                    <li><strong>Пустая панель:</strong> Если панель пустая, почему пользователи не отображаются?</li>
                  </ol>
                </div>
                <div class="analysis">
                  <h3>💡 Возможные проблемы:</h3>
                  <ul>
                    <li>Пользователи не зарегистрированы в системе</li>
                    <li>Боковая панель не отображается на мобильной версии</li>
                    <li>Неправильные селекторы в тесте</li>
                    <li>Панель скрыта или свернута</li>
                    <li>Ошибки в загрузке списка пользователей</li>
                  </ul>
                </div>
                <div class="analysis">
                  <h3>🔧 Рекомендации для исправления:</h3>
                  <ol>
                    <li>Проверьте, что оба пользователя зарегистрированы и активны</li>
                    <li>Убедитесь, что боковая панель отображается на мобильной версии</li>
                    <li>Проверьте консоль браузера на ошибки JavaScript</li>
                    <li>Обновите селекторы в тестовом скрипте</li>
                    <li>Добавьте ожидания для загрузки списка пользователей</li>
                    <li>Проверьте API для получения списка пользователей</li>
                  </ol>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      
      // Сохраняем HTML отчет
      const htmlContent = await page.content();
      const reportPath = './test_screenshots/sidebar_analysis.html';
      fs.writeFileSync(reportPath, htmlContent);
      console.log(`\n📄 HTML отчет анализа сохранен: ${reportPath}`);
      
    } else {
      console.log(`❌ Файл не найден: ${screenshot}`);
    }
    
    console.log('\n✅ Анализ завершен');
    console.log('\n💡 Следующие шаги:');
    console.log('1. Откройте HTML отчет анализа в браузере');
    console.log('2. Проанализируйте, отображается ли боковая панель');
    console.log('3. Проверьте, есть ли пользователи в списке');
    console.log('4. Определите, почему тест не может найти элементы');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

analyzeSidebarScreenshot().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 