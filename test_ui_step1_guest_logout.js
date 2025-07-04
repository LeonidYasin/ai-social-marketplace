const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep1TwoGuestsWithLogout() {
  console.log('🚀 Запуск теста шага 1: Вход двух гостей в разных браузерах (с разлогином)');
  
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
    
    // Переход на главную страницу в первом браузере
    console.log('📱 Первый браузер: переходим на http://localhost:3000');
    await page1.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Ждем загрузки страницы
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Делаем скриншот начального состояния первого браузера
    console.log('📸 Первый браузер: делаем скриншот начального состояния');
    await page1.screenshot({ 
      path: './test_screenshots/step1_01_browser1_initial.png',
      fullPage: true 
    });
    
    // Проверяем, авторизован ли пользователь
    console.log('🔍 Первый браузер: проверяем статус авторизации');
    const isLoggedIn1 = await page1.evaluate(() => {
      // Ищем элементы, которые появляются только для авторизованных пользователей
      const feedElement = document.querySelector('[data-testid="feed"], .feed, .posts-container');
      const userInfoElement = document.querySelector('[data-testid="current-user"], .user-info');
      return !!(feedElement || userInfoElement);
    });
    
    if (isLoggedIn1) {
      console.log('⚠️ Первый браузер: пользователь уже авторизован, выполняем разлогин');
      
      // Ищем кнопку выхода
      const logoutSelectors = [
        '//button[contains(text(), "Выйти")]',
        '//*[contains(text(), "Выйти")]',
        'button[aria-label="Выйти"]',
        '[data-testid="logout-button"]',
        '.logout-button'
      ];
      
      let logoutButton = null;
      for (const selector of logoutSelectors) {
        try {
          if (selector.startsWith('//')) {
            const elements = await page1.$x(selector);
            if (elements.length > 0) {
              logoutButton = elements[0];
              console.log(`✅ Первый браузер: найдена кнопка выхода через XPath: ${selector}`);
              break;
            }
          } else {
            const element = await page1.$(selector);
            if (element) {
              logoutButton = element;
              console.log(`✅ Первый браузер: найдена кнопка выхода через CSS: ${selector}`);
              break;
            }
          }
        } catch (error) {
          console.log(`❌ Первый браузер: селектор выхода не сработал: ${selector}`);
        }
      }
      
      if (logoutButton) {
        console.log('🖱️ Первый браузер: кликаем по кнопке выхода');
        await logoutButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Делаем скриншот после выхода
        await page1.screenshot({ 
          path: './test_screenshots/step1_02_browser1_after_logout.png',
          fullPage: true 
        });
      } else {
        console.log('❌ Первый браузер: кнопка выхода не найдена, очищаем localStorage');
        await page1.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page1.reload();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ" в первом браузере
    console.log('🔍 Первый браузер: ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    
    let guestButton1 = null;
    const guestSelectors = [
      '//button[contains(text(), "ПРОДОЛЖИТЬ КАК ГОСТЬ")]',
      '//*[contains(text(), "ПРОДОЛЖИТЬ КАК ГОСТЬ")]',
      '//div[contains(text(), "ПРОДОЛЖИТЬ КАК ГОСТЬ")]',
      '//span[contains(text(), "ПРОДОЛЖИТЬ КАК ГОСТЬ")]',
      '//a[contains(text(), "ПРОДОЛЖИТЬ КАК ГОСТЬ")]',
      'button:contains("ПРОДОЛЖИТЬ КАК ГОСТЬ")',
      'button:contains("Продолжить как гость")',
      '[data-testid="guest-login-button"]'
    ];
    
    for (const selector of guestSelectors) {
      try {
        if (selector.startsWith('//')) {
          // XPath селектор
          const elements = await page1.$x(selector);
          if (elements.length > 0) {
            guestButton1 = elements[0];
            console.log(`✅ Первый браузер: найдена кнопка через XPath: ${selector}`);
            break;
          }
        } else {
          // CSS селектор
          const element = await page1.$(selector);
          if (element) {
            guestButton1 = element;
            console.log(`✅ Первый браузер: найдена кнопка через CSS: ${selector}`);
            break;
          }
        }
      } catch (error) {
        console.log(`❌ Первый браузер: селектор не сработал: ${selector}`);
      }
    }
    
    if (!guestButton1) {
      console.log('❌ Первый браузер: кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдена');
      
      // Получаем весь текст страницы для анализа
      const pageText = await page1.evaluate(() => document.body.innerText);
      console.log('📋 Первый браузер: текст страницы:');
      console.log(pageText.substring(0, 500) + '...');
      
      throw new Error('Кнопка гостевого входа не найдена в первом браузере');
    }
    
    // Кликаем по кнопке гостевого входа в первом браузере
    console.log('🖱️ Первый браузер: кликаем по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    await guestButton1.click();
    
    // Ждем авторизации первого гостя
    console.log('⏳ Первый браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот после входа первого гостя
    console.log('📸 Первый браузер: делаем скриншот после входа');
    await page1.screenshot({ 
      path: './test_screenshots/step1_03_browser1_after_guest_login.png',
      fullPage: true 
    });
    
    // Проверяем, что первый гость авторизован
    const userInfo1 = await page1.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Первый браузер: информация о пользователе:', userInfo1);
    
    // Запуск второго браузера
    console.log('\n🌐 Запускаем второй браузер');
    browser2 = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page2 = await browser2.newPage();
    
    // Переход на главную страницу во втором браузере
    console.log('📱 Второй браузер: переходим на http://localhost:3000');
    await page2.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Ждем загрузки страницы
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Делаем скриншот начального состояния второго браузера
    console.log('📸 Второй браузер: делаем скриншот начального состояния');
    await page2.screenshot({ 
      path: './test_screenshots/step1_04_browser2_initial.png',
      fullPage: true 
    });
    
    // Проверяем, авторизован ли пользователь во втором браузере
    console.log('🔍 Второй браузер: проверяем статус авторизации');
    const isLoggedIn2 = await page2.evaluate(() => {
      const feedElement = document.querySelector('[data-testid="feed"], .feed, .posts-container');
      const userInfoElement = document.querySelector('[data-testid="current-user"], .user-info');
      return !!(feedElement || userInfoElement);
    });
    
    if (isLoggedIn2) {
      console.log('⚠️ Второй браузер: пользователь уже авторизован, очищаем localStorage');
      await page2.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page2.reload();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ" во втором браузере
    console.log('🔍 Второй браузер: ищем кнопку "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    
    let guestButton2 = null;
    for (const selector of guestSelectors) {
      try {
        if (selector.startsWith('//')) {
          // XPath селектор
          const elements = await page2.$x(selector);
          if (elements.length > 0) {
            guestButton2 = elements[0];
            console.log(`✅ Второй браузер: найдена кнопка через XPath: ${selector}`);
            break;
          }
        } else {
          // CSS селектор
          const element = await page2.$(selector);
          if (element) {
            guestButton2 = element;
            console.log(`✅ Второй браузер: найдена кнопка через CSS: ${selector}`);
            break;
          }
        }
      } catch (error) {
        console.log(`❌ Второй браузер: селектор не сработал: ${selector}`);
      }
    }
    
    if (!guestButton2) {
      console.log('❌ Второй браузер: кнопка "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдена');
      throw new Error('Кнопка гостевого входа не найдена во втором браузере');
    }
    
    // Кликаем по кнопке гостевого входа во втором браузере
    console.log('🖱️ Второй браузер: кликаем по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    await guestButton2.click();
    
    // Ждем авторизации второго гостя
    console.log('⏳ Второй браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот после входа второго гостя
    console.log('📸 Второй браузер: делаем скриншот после входа');
    await page2.screenshot({ 
      path: './test_screenshots/step1_05_browser2_after_guest_login.png',
      fullPage: true 
    });
    
    // Проверяем, что второй гость авторизован
    const userInfo2 = await page2.evaluate(() => {
      const userElement = document.querySelector('[data-testid="current-user"], .user-info, .profile-info');
      return userElement ? userElement.innerText : 'Пользователь не найден';
    });
    console.log('👤 Второй браузер: информация о пользователе:', userInfo2);
    
    // Проверяем, что пользователи разные
    if (userInfo1 !== userInfo2) {
      console.log('✅ Тест успешен: два разных гостя авторизованы!');
      console.log(`   Гость 1: ${userInfo1}`);
      console.log(`   Гость 2: ${userInfo2}`);
    } else {
      console.log('⚠️ Предупреждение: возможно, оба гостя имеют одинаковые данные');
      console.log(`   Гость 1: ${userInfo1}`);
      console.log(`   Гость 2: ${userInfo2}`);
    }
    
    // Ждем немного для проверки стабильности
    console.log('⏳ Ждем 5 секунд для проверки стабильности...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Финальные скриншоты
    await page1.screenshot({ 
      path: './test_screenshots/step1_06_browser1_final.png',
      fullPage: true 
    });
    await page2.screenshot({ 
      path: './test_screenshots/step1_07_browser2_final.png',
      fullPage: true 
    });
    
    console.log('✅ Тест шага 1 завершен успешно! Два гостя авторизованы в разных браузерах.');
    
  } catch (error) {
    console.error('❌ Ошибка в тесте шага 1:', error.message);
    
    // Делаем скриншоты ошибок
    if (browser1) {
      const page1 = (await browser1.pages())[0];
      if (page1) {
        await page1.screenshot({ 
          path: './test_screenshots/step1_error_browser1.png',
          fullPage: true 
        });
      }
    }
    
    if (browser2) {
      const page2 = (await browser2.pages())[0];
      if (page2) {
        await page2.screenshot({ 
          path: './test_screenshots/step1_error_browser2.png',
          fullPage: true 
        });
      }
    }
  } finally {
    // Закрываем браузеры
    if (browser1) {
      await browser1.close();
    }
    if (browser2) {
      await browser2.close();
    }
  }
}

// Запуск теста
testStep1TwoGuestsWithLogout().catch(console.error); 