const puppeteer = require('puppeteer');

async function testMessages() {
  console.log('🚀 Тест отправки сообщений между пользователями');
  
  let browser1, browser2;
  try {
    // Запуск первого браузера
    console.log('🌐 Запускаем первый браузер');
    browser1 = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page1 = await browser1.newPage();
    
    // Включаем логирование консоли
    page1.on('console', msg => console.log('📱 Браузер 1:', msg.text()));
    
    // Переход на главную страницу
    console.log('📱 Первый браузер: переходим на http://localhost:3000');
    await page1.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ищем кнопку "Продолжить как гость"
    console.log('🔍 Первый браузер: ищем кнопку "Продолжить как гость"');
    const guestButton1 = await page1.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Продолжить как гость'));
    });
    
    if (!guestButton1) {
      console.log('❌ Первый браузер: кнопка "Продолжить как гость" не найдена');
      throw new Error('Кнопка гостевого входа не найдена');
    }
    
    // Кликаем по кнопке
    console.log('🖱️ Первый браузер: кликаем по кнопке "Продолжить как гость"');
    await page1.evaluate(button => button.click(), guestButton1);
    
    // Ждем авторизации
    console.log('⏳ Первый браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Запуск второго браузера
    console.log('\n🌐 Запускаем второй браузер');
    browser2 = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page2 = await browser2.newPage();
    
    // Включаем логирование консоли
    page2.on('console', msg => console.log('📱 Браузер 2:', msg.text()));
    
    // Переход на главную страницу
    console.log('📱 Второй браузер: переходим на http://localhost:3000');
    await page2.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ищем кнопку "Продолжить как гость"
    console.log('🔍 Второй браузер: ищем кнопку "Продолжить как гость"');
    const guestButton2 = await page2.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Продолжить как гость'));
    });
    
    if (!guestButton2) {
      console.log('❌ Второй браузер: кнопка "Продолжить как гость" не найдена');
      throw new Error('Кнопка гостевого входа не найдена во втором браузере');
    }
    
    // Кликаем по кнопке
    console.log('🖱️ Второй браузер: кликаем по кнопке "Продолжить как гость"');
    await page2.evaluate(button => button.click(), guestButton2);
    
    // Ждем авторизации
    console.log('⏳ Второй браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Получаем информацию о пользователях
    const userInfo1 = await page1.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    
    const userInfo2 = await page2.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    
    console.log('👤 Первый браузер: пользователь:', userInfo1);
    console.log('👤 Второй браузер: пользователь:', userInfo2);
    
    // Ждем, чтобы пользователи появились в правых панелях
    console.log('⏳ Ждем появления пользователей в правых панелях...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // В первом браузере кликаем по пользователю из второго браузера
    console.log('🖱️ Первый браузер: кликаем по пользователю из второго браузера');
    const userClicked = await page1.evaluate((targetUser) => {
      const userItems = document.querySelectorAll('[data-testid="user-item"]');
      for (const item of userItems) {
        const nameElement = item.querySelector('[data-testid="user-name"]');
        if (nameElement && nameElement.textContent.includes(targetUser)) {
          item.click();
          return true;
        }
      }
      return false;
    }, userInfo2.split(' ')[0]); // Берем первое слово из имени
    
    if (!userClicked) {
      console.log('❌ Первый браузер: не удалось найти пользователя для клика');
      throw new Error('Пользователь не найден в правой панели');
    }
    
    console.log('✅ Первый браузер: чат открыт');
    
    // Ждем открытия чата
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Отправляем сообщение из первого браузера
    console.log('💬 Первый браузер: отправляем сообщение');
    await page1.evaluate(() => {
      const input = document.querySelector('input[placeholder*="сообщение"], textarea[placeholder*="сообщение"]');
      if (input) {
        input.value = 'Привет! Это тестовое сообщение от первого пользователя';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        const sendButton = document.querySelector('button[type="submit"], button:has(svg)');
        if (sendButton) {
          sendButton.click();
        }
      }
    });
    
    console.log('✅ Первый браузер: сообщение отправлено');
    
    // Ждем отправки сообщения
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Во втором браузере кликаем по пользователю из первого браузера
    console.log('🖱️ Второй браузер: кликаем по пользователю из первого браузера');
    const userClicked2 = await page2.evaluate((targetUser) => {
      const userItems = document.querySelectorAll('[data-testid="user-item"]');
      for (const item of userItems) {
        const nameElement = item.querySelector('[data-testid="user-name"]');
        if (nameElement && nameElement.textContent.includes(targetUser)) {
          item.click();
          return true;
        }
      }
      return false;
    }, userInfo1.split(' ')[0]); // Берем первое слово из имени
    
    if (!userClicked2) {
      console.log('❌ Второй браузер: не удалось найти пользователя для клика');
      throw new Error('Пользователь не найден в правой панели');
    }
    
    console.log('✅ Второй браузер: чат открыт');
    
    // Ждем открытия чата и загрузки сообщений
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Проверяем, есть ли сообщение во втором браузере
    console.log('🔍 Второй браузер: проверяем наличие сообщения');
    const messageFound = await page2.evaluate(() => {
      const messages = document.querySelectorAll('[class*="message"], [class*="chat"], .MuiBox-root');
      for (const msg of messages) {
        if (msg.textContent.includes('Привет! Это тестовое сообщение от первого пользователя')) {
          return true;
        }
      }
      return false;
    });
    
    if (messageFound) {
      console.log('✅ ВТОРОЙ БРАУЗЕР: СООБЩЕНИЕ ПОЛУЧЕНО!');
      console.log('🎉 ТЕСТ ПРОЙДЕН: Сообщения работают корректно!');
    } else {
      console.log('❌ ВТОРОЙ БРАУЗЕР: СООБЩЕНИЕ НЕ ПОЛУЧЕНО');
      console.log('❌ ТЕСТ ПРОВАЛЕН: Сообщения не доходят до адресата');
    }
    
    // Ждем для стабильности
    console.log('⏳ Ждем 10 секунд для стабильности...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Ошибка в тесте:', error.message);
  } finally {
    if (browser1) await browser1.close();
    if (browser2) await browser2.close();
  }
}

// Запуск теста
testMessages(); 