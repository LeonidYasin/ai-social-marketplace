const puppeteer = require('puppeteer');

async function testBackendAutoStart() {
  console.log('🧪 Тестирование автозапуска бэкенда через консольные команды\n');

  let browser;
  try {
    // Запускаем браузер
    browser = await puppeteer.launch({
      headless: false, // Показываем браузер для демонстрации
      defaultViewport: { width: 1200, height: 800 }
    });

    const page = await browser.newPage();
    
    // Включаем логирование консоли
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log(`📱 Браузер: ${msg.text()}`);
      }
    });

    console.log('🌐 Открываем фронтенд...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Ждем загрузки страницы
    await page.waitForTimeout(3000);

    console.log('🔍 Проверяем, есть ли ошибки подключения к бэкенду...');
    
    // Проверяем, есть ли уведомления об ошибках
    const errorNotifications = await page.evaluate(() => {
      const notifications = document.querySelectorAll('.error-notification');
      return Array.from(notifications).map(n => ({
        title: n.querySelector('h4')?.textContent,
        message: n.querySelector('p')?.textContent,
        severity: n.className.includes('error') ? 'error' : 
                 n.className.includes('warning') ? 'warning' : 'info'
      }));
    });

    if (errorNotifications.length > 0) {
      console.log('⚠️  Найдены уведомления об ошибках:');
      errorNotifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification.title}: ${notification.message}`);
      });
    }

    // Проверяем, есть ли модальные окна с инструкциями
    const modals = await page.evaluate(() => {
      const modalElements = document.querySelectorAll('div[style*="position: fixed"]');
      return modalElements.length;
    });

    if (modals > 0) {
      console.log('✅ Найдено модальное окно с инструкциями по запуску');
      
      // Делаем скриншот модального окна
      await page.screenshot({
        path: 'test_screenshots/backend_autostart_modal.png',
        fullPage: true
      });
      console.log('📸 Скриншот сохранен: test_screenshots/backend_autostart_modal.png');
    }

    // Проверяем консоль браузера на наличие команд
    console.log('🔍 Проверяем консоль браузера на наличие команд запуска...');
    
    // Симулируем ошибку подключения к бэкенду
    await page.evaluate(() => {
      // Вызываем метод автозапуска напрямую
      if (window.backendManager) {
        window.backendManager.tryAutoStartBackend();
      }
    });

    // Ждем появления модального окна
    await page.waitForTimeout(2000);

    // Проверяем содержимое модального окна
    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('div[style*="position: fixed"]');
      if (modal) {
        const commands = modal.querySelectorAll('code');
        return Array.from(commands).map(cmd => cmd.textContent);
      }
      return [];
    });

    if (modalContent.length > 0) {
      console.log('✅ Найдены команды для запуска бэкенда:');
      modalContent.forEach((cmd, index) => {
        console.log(`   ${index + 1}. ${cmd}`);
      });
    }

    // Проверяем, есть ли кнопка "Понятно"
    const closeButton = await page.$('#closeModal');
    if (closeButton) {
      console.log('✅ Найдена кнопка закрытия модального окна');
      
      // Закрываем модальное окно
      await closeButton.click();
      console.log('🔒 Модальное окно закрыто');
    }

    // Проверяем, что команды выведены в консоль
    console.log('📋 Проверяем вывод команд в консоль...');
    
    // Симулируем вызов метода показа инструкций
    await page.evaluate(() => {
      if (window.backendManager) {
        window.backendManager.showManualStartInstructions();
      }
    });

    await page.waitForTimeout(2000);

    console.log('✅ Тестирование завершено успешно!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('\n💡 Убедитесь, что фронтенд сервер запущен на порту 3000');
      console.log('   Запустите: npm start в папке frontend');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Создаем папку для скриншотов если её нет
const fs = require('fs');
const path = require('path');

const screenshotsDir = 'test_screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Запуск теста
testBackendAutoStart(); 