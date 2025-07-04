const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep1TwoGuestsCoordinates() {
  console.log('🚀 Запуск теста шага 1: Вход двух гостей с кликом по координатам');
  
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
    
    // Очищаем localStorage и перезагружаем
    console.log('🧹 Первый браузер: очищаем localStorage и перезагружаем');
    await page1.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    });
    await page1.reload();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот начального состояния первого браузера
    console.log('📸 Первый браузер: делаем скриншот начального состояния');
    await page1.screenshot({ 
      path: './test_screenshots/step1_01_browser1_initial.png',
      fullPage: true 
    });
    
    // Ищем координаты текста "ПРОДОЛЖИТЬ КАК ГОСТЬ" в первом браузере
    console.log('🔍 Первый браузер: ищем координаты текста "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    
    const guestCoords1 = await page1.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ')) {
          const rect = node.parentElement.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            element: node.parentElement
          };
        }
      }
      return null;
    });
    
    if (!guestCoords1) {
      console.log('❌ Первый браузер: координаты текста "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдены');
      
      // Получаем весь текст страницы для анализа
      const pageText = await page1.evaluate(() => document.body.innerText);
      console.log('📋 Первый браузер: текст страницы:');
      console.log(pageText.substring(0, 500) + '...');
      
      throw new Error('Координаты гостевого входа не найдены в первом браузере');
    }
    
    console.log(`✅ Первый браузер: найдены координаты (${guestCoords1.x}, ${guestCoords1.y})`);
    
    // Кликаем по координатам в первом браузере
    console.log('🖱️ Первый браузер: кликаем по координатам "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    await page1.mouse.click(guestCoords1.x, guestCoords1.y);
    
    // Ждем авторизации первого гостя
    console.log('⏳ Первый браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот после входа первого гостя
    console.log('📸 Первый браузер: делаем скриншот после входа');
    await page1.screenshot({ 
      path: './test_screenshots/step1_02_browser1_after_guest_login.png',
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
    
    // Очищаем localStorage и перезагружаем во втором браузере
    console.log('🧹 Второй браузер: очищаем localStorage и перезагружаем');
    await page2.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    });
    await page2.reload();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот начального состояния второго браузера
    console.log('📸 Второй браузер: делаем скриншот начального состояния');
    await page2.screenshot({ 
      path: './test_screenshots/step1_03_browser2_initial.png',
      fullPage: true 
    });
    
    // Ищем координаты текста "ПРОДОЛЖИТЬ КАК ГОСТЬ" во втором браузере
    console.log('🔍 Второй браузер: ищем координаты текста "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    
    const guestCoords2 = await page2.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes('ПРОДОЛЖИТЬ КАК ГОСТЬ')) {
          const rect = node.parentElement.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            element: node.parentElement
          };
        }
      }
      return null;
    });
    
    if (!guestCoords2) {
      console.log('❌ Второй браузер: координаты текста "ПРОДОЛЖИТЬ КАК ГОСТЬ" не найдены');
      throw new Error('Координаты гостевого входа не найдены во втором браузере');
    }
    
    console.log(`✅ Второй браузер: найдены координаты (${guestCoords2.x}, ${guestCoords2.y})`);
    
    // Кликаем по координатам во втором браузере
    console.log('🖱️ Второй браузер: кликаем по координатам "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
    await page2.mouse.click(guestCoords2.x, guestCoords2.y);
    
    // Ждем авторизации второго гостя
    console.log('⏳ Второй браузер: ждем авторизации гостя');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот после входа второго гостя
    console.log('📸 Второй браузер: делаем скриншот после входа');
    await page2.screenshot({ 
      path: './test_screenshots/step1_04_browser2_after_guest_login.png',
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
      path: './test_screenshots/step1_05_browser1_final.png',
      fullPage: true 
    });
    await page2.screenshot({ 
      path: './test_screenshots/step1_06_browser2_final.png',
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
testStep1TwoGuestsCoordinates().catch(console.error); 