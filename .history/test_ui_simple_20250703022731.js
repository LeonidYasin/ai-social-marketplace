const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Создаем папку для скриншотов
const screenshotsDir = './test_screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function testMultiUser() {
  console.log('🚀 Запускаем простой тест многопользовательской работы...');
  
  let browser;
  let page1, page2;
  
  try {
    // Запускаем браузер
    console.log('📱 Запускаем браузер...');
    browser = await puppeteer.launch({ 
      headless: false, // Показываем браузер
      slowMo: 1000, // Замедляем действия для лучшего наблюдения
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Создаем две страницы
    page1 = await browser.newPage();
    page2 = await browser.newPage();

    console.log('🌐 Открываем приложение...');
    
    // Очищаем localStorage и открываем приложение
    await page1.goto('http://localhost:3000');
    await page1.evaluate(() => localStorage.clear());
    await page1.reload({ waitUntil: 'networkidle0' });
    
    await page2.goto('http://localhost:3000');
    await page2.evaluate(() => localStorage.clear());
    await page2.reload({ waitUntil: 'networkidle0' });

    console.log('✅ Приложение загружено');

    // Делаем скриншот начального состояния
    await page1.screenshot({ path: path.join(screenshotsDir, '01_initial_page1.png') });
    await page2.screenshot({ path: path.join(screenshotsDir, '01_initial_page2.png') });

    // Тест 1: Регистрация первого пользователя
    console.log('👤 Регистрируем первого пользователя...');
    await registerUser(page1, 'testuser1@example.com', 'password123', 'page1');
    
    // Тест 2: Регистрация второго пользователя
    console.log('👤 Регистрируем второго пользователя...');
    await registerUser(page2, 'testuser2@example.com', 'password123', 'page2');

    // Ждем немного для синхронизации
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Тест 3: Проверяем отображение пользователей
    console.log('🔍 Проверяем отображение пользователей...');
    await checkUsers(page1, 'page1');
    await checkUsers(page2, 'page2');

    // Тест 4: Проверяем localStorage
    console.log('💾 Проверяем localStorage...');
    await checkLocalStorage(page1, 'page1');
    await checkLocalStorage(page2, 'page2');

    console.log('✅ Все тесты завершены!');

  } catch (error) {
    console.error('❌ Ошибка в тесте:', error.message);
  } finally {
    // Делаем финальные скриншоты
    if (page1) {
      await page1.screenshot({ path: path.join(screenshotsDir, 'final_page1.png') });
    }
    if (page2) {
      await page2.screenshot({ path: path.join(screenshotsDir, 'final_page2.png') });
    }
    
    // Оставляем браузер открытым для ручной проверки
    console.log('🔍 Браузер оставлен открытым для ручной проверки');
    console.log('📸 Скриншоты сохранены в папке test_screenshots/');
  }
}

// Регистрация пользователя
async function registerUser(page, email, password, pageName) {
  try {
    console.log(`[${pageName}] Открываем диалог настроек...`);
    
    // Ждем загрузки страницы
    await page.waitForSelector('button[aria-label*="Войти"], button[aria-label*="Login"], [data-testid="settings-button"]', { timeout: 10000 });
    
    // Ищем кнопку настроек/входа (последняя кнопка в AppBar)
    const settingsButton = await page.$('button[aria-label*="Войти"], button[aria-label*="Login"]');
    if (!settingsButton) {
      // Попробуем найти по иконке или последней кнопке в AppBar
      const buttons = await page.$$('button');
      const lastButton = buttons[buttons.length - 1];
      if (lastButton) {
        console.log(`[${pageName}] Нажимаем последнюю кнопку в AppBar...`);
        await lastButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      console.log(`[${pageName}] Нажимаем кнопку входа...`);
      await settingsButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Ждем появления диалога
    await page.waitForSelector('[role="dialog"], [data-testid="user-settings-dialog"]', { timeout: 10000 });
    
    // Делаем скриншот диалога
    await page.screenshot({ path: path.join(screenshotsDir, `02_dialog_opened_${pageName}.png`) });
    
    // Ищем кнопку "Email" для перехода к форме входа
    const emailButton = await page.$('button:has-text("Email"), button:has-text("Регистрация по email")');
    if (emailButton) {
      console.log(`[${pageName}] Переходим к форме email...`);
      await emailButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Ждем форму входа
    await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
    
    console.log(`[${pageName}] Заполняем форму...`);
    
    // Заполняем email
    await page.click('[data-testid="email-input"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.type('[data-testid="email-input"]', email);
    
    // Заполняем пароль
    await page.click('[data-testid="password-input"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.type('[data-testid="password-input"]', password);
    
    // Делаем скриншот заполненной формы
    await page.screenshot({ path: path.join(screenshotsDir, `03_form_filled_${pageName}.png`) });
    
    // Нажимаем кнопку входа
    console.log(`[${pageName}] Нажимаем кнопку входа...`);
    await page.click('[data-testid="submit-button"]');
    
    // Ждем успешной регистрации (исчезновение формы или появление токена)
    await page.waitForFunction(() => {
      const form = document.querySelector('[data-testid="email-input"]');
      const token = localStorage.getItem('authToken');
      return !form || token;
    }, { timeout: 15000 });
    
    console.log(`✅ [${pageName}] Пользователь зарегистрирован/вошел`);
    
    // Делаем скриншот после регистрации
    await page.screenshot({ path: path.join(screenshotsDir, `04_after_register_${pageName}.png`) });
    
  } catch (error) {
    console.error(`❌ [${pageName}] Ошибка регистрации:`, error.message);
    // Делаем скриншот при ошибке
    await page.screenshot({ path: path.join(screenshotsDir, `error_${pageName}.png`) });
  }
}

// Проверка пользователей
async function checkUsers(page, pageName) {
  try {
    console.log(`[${pageName}] Проверяем список пользователей...`);
    
    // Ждем появления правой панели
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('[data-testid="sidebar-right"]');
      return sidebar && sidebar.offsetParent !== null;
    }, { timeout: 10000 });
    
    // Получаем список пользователей
    const users = await page.evaluate(() => {
      const userElements = document.querySelectorAll('[data-testid="user-item"]');
      return Array.from(userElements).map(el => ({
        name: el.querySelector('[data-testid="user-name"]')?.textContent || 'Неизвестно',
        isMe: el.querySelector('[data-testid="user-me"]') !== null,
        isRealUser: el.querySelector('[data-testid="user-real"]') !== null
      }));
    });
    
    console.log(`[${pageName}] Найдено пользователей: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`  - ${user.name} (Вы: ${user.isMe}, Реальный: ${user.isRealUser})`);
    });
    
    if (users.length >= 2) {
      console.log(`✅ [${pageName}] Многопользовательский режим работает!`);
    } else {
      console.log(`⚠️ [${pageName}] Мало пользователей: ${users.length}`);
    }
    
    // Делаем скриншот правой панели
    const sidebar = await page.$('[data-testid="sidebar-right"]');
    if (sidebar) {
      await sidebar.screenshot({ path: path.join(screenshotsDir, `05_users_panel_${pageName}.png`) });
    }
    
  } catch (error) {
    console.error(`❌ [${pageName}] Ошибка проверки пользователей:`, error.message);
  }
}

// Проверка localStorage
async function checkLocalStorage(page, pageName) {
  try {
    const storage = await page.evaluate(() => {
      return {
        authToken: localStorage.getItem('authToken'),
        currentUser: localStorage.getItem('currentUser'),
        hasToken: !!localStorage.getItem('authToken'),
        hasUser: !!localStorage.getItem('currentUser')
      };
    });
    
    console.log(`[${pageName}] localStorage:`);
    console.log(`  - Токен: ${storage.hasToken ? '✅ Есть' : '❌ Нет'}`);
    console.log(`  - Пользователь: ${storage.hasUser ? '✅ Есть' : '❌ Нет'}`);
    
    if (storage.hasToken && storage.hasUser) {
      console.log(`✅ [${pageName}] JWT аутентификация работает!`);
    } else {
      console.log(`⚠️ [${pageName}] Проблемы с аутентификацией`);
    }
    
  } catch (error) {
    console.error(`❌ [${pageName}] Ошибка проверки localStorage:`, error.message);
  }
}

// Запуск теста
testMultiUser().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 