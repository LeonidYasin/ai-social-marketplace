const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStep2Success() {
  console.log('🚀 Запуск успешного теста шага 2');
  
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
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот начального состояния первого браузера
    console.log('📸 Первый браузер: делаем скриншот начального состояния');
    await page1.screenshot({ 
      path: './test_screenshots/step2_01_browser1_initial.png',
      fullPage: true 
    });
    
    // Проверяем, нужно ли войти
    console.log('🔍 Первый браузер: проверяем, нужно ли войти');
    const needsLogin1 = await page1.evaluate(() => {
      return document.body.innerText.includes('Добро пожаловать');
    });
    
    if (needsLogin1) {
      console.log('⚠️ Первый браузер: нужно войти, используем координаты для кнопки входа');
      
      // Координаты для кнопки "ВОЙТИ В СИСТЕМУ" (которая открывает форму выбора способа)
      const loginCoords1 = { x: 640, y: 350 }; // Центр экрана
      
      console.log(`✅ Первый браузер: используем координаты (${loginCoords1.x}, ${loginCoords1.y})`);
      
      // Кликаем по координатам
      console.log('🖱️ Первый браузер: кликаем по кнопке входа');
      await page1.mouse.click(loginCoords1.x, loginCoords1.y);
      
      // Ждем появления формы выбора способа входа
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Проверяем, появилась ли форма выбора способа входа
      const hasLoginForm1 = await page1.evaluate(() => {
        return document.body.innerText.includes('Выберите способ входа');
      });
      
      if (hasLoginForm1) {
        console.log('✅ Первый браузер: появилась форма выбора способа входа');
        
        // Ищем кнопку EMAIL и кликаем по ней
        console.log('🔍 Первый браузер: ищем кнопку EMAIL');
        const emailButton1 = await page1.evaluate(() => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          
          let node;
          while (node = walker.nextNode()) {
            if (node.textContent.includes('EMAIL')) {
              const rect = node.parentElement.getBoundingClientRect();
              return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
              };
            }
          }
          return null;
        });
        
        if (emailButton1) {
          console.log(`✅ Первый браузер: найдена кнопка EMAIL по координатам (${emailButton1.x}, ${emailButton1.y})`);
          await page1.mouse.click(emailButton1.x, emailButton1.y);
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('✅ Первый браузер: кликнули по EMAIL');
        } else {
          console.log('⚠️ Первый браузер: кнопка EMAIL не найдена, используем фиксированные координаты');
          await page1.mouse.click(640, 500); // Примерные координаты EMAIL
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        console.log('⚠️ Первый браузер: форма выбора способа входа не появилась');
      }
      
      // Ждем авторизации
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Первый браузер: попытались войти');
    } else {
      console.log('✅ Первый браузер: уже авторизован');
    }
    
    // Делаем скриншот после входа первого пользователя
    console.log('📸 Первый браузер: делаем скриншот после входа');
    await page1.screenshot({ 
      path: './test_screenshots/step2_02_browser1_after_login.png',
      fullPage: true 
    });
    
    // Проверяем авторизацию первого пользователя
    console.log('🔍 Первый браузер: проверяем авторизацию');
    const isLoggedIn1 = await page1.evaluate(() => {
      // Проверяем наличие текста "Гость" и отсутствие "Добро пожаловать"
      const hasGuest = document.body.innerText.includes('Гость');
      const hasWelcome = document.body.innerText.includes('Добро пожаловать');
      return hasGuest && !hasWelcome;
    });
    
    if (isLoggedIn1) {
      console.log('✅ Первый браузер: пользователь авторизован');
    } else {
      console.log('❌ Первый браузер: пользователь не авторизован');
    }
    
    // Ищем информацию о текущем пользователе
    const userInfo1 = await page1.evaluate(() => {
      // Ищем текст с "Гость" и "(Вы)"
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes('Гость') && node.textContent.includes('(Вы)')) {
          return node.textContent.trim();
        }
      }
      return 'Пользователь не найден';
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
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Делаем скриншот начального состояния второго браузера
    console.log('📸 Второй браузер: делаем скриншот начального состояния');
    await page2.screenshot({ 
      path: './test_screenshots/step2_03_browser2_initial.png',
      fullPage: true 
    });
    
    // Проверяем, нужно ли войти во втором браузере
    console.log('🔍 Второй браузер: проверяем, нужно ли войти');
    const needsLogin2 = await page2.evaluate(() => {
      return document.body.innerText.includes('Добро пожаловать');
    });
    
    if (needsLogin2) {
      console.log('⚠️ Второй браузер: нужно войти, используем координаты для кнопки входа');
      
      // Координаты для кнопки "ВОЙТИ В СИСТЕМУ"
      const loginCoords2 = { x: 640, y: 350 }; // Центр экрана
      
      console.log(`✅ Второй браузер: используем координаты (${loginCoords2.x}, ${loginCoords2.y})`);
      
      // Кликаем по координатам
      console.log('🖱️ Второй браузер: кликаем по кнопке входа');
      await page2.mouse.click(loginCoords2.x, loginCoords2.y);
      
      // Ждем появления формы выбора способа входа
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Проверяем, появилась ли форма выбора способа входа
      const hasLoginForm2 = await page2.evaluate(() => {
        return document.body.innerText.includes('Выберите способ входа');
      });
      
      if (hasLoginForm2) {
        console.log('✅ Второй браузер: появилась форма выбора способа входа');
        
        // Ищем кнопку EMAIL и кликаем по ней
        console.log('🔍 Второй браузер: ищем кнопку EMAIL');
        const emailButton2 = await page2.evaluate(() => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          
          let node;
          while (node = walker.nextNode()) {
            if (node.textContent.includes('EMAIL')) {
              const rect = node.parentElement.getBoundingClientRect();
              return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
              };
            }
          }
          return null;
        });
        
        if (emailButton2) {
          console.log(`✅ Второй браузер: найдена кнопка EMAIL по координатам (${emailButton2.x}, ${emailButton2.y})`);
          await page2.mouse.click(emailButton2.x, emailButton2.y);
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('✅ Второй браузер: кликнули по EMAIL');
        } else {
          console.log('⚠️ Второй браузер: кнопка EMAIL не найдена, используем фиксированные координаты');
          await page2.mouse.click(640, 500); // Примерные координаты EMAIL
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        console.log('⚠️ Второй браузер: форма выбора способа входа не появилась');
      }
      
      // Ждем авторизации
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Второй браузер: попытались войти');
    } else {
      console.log('✅ Второй браузер: уже авторизован');
    }
    
    // Делаем скриншот после входа второго пользователя
    console.log('📸 Второй браузер: делаем скриншот после входа');
    await page2.screenshot({ 
      path: './test_screenshots/step2_04_browser2_after_login.png',
      fullPage: true 
    });
    
    // Проверяем авторизацию второго пользователя
    console.log('🔍 Второй браузер: проверяем авторизацию');
    const isLoggedIn2 = await page2.evaluate(() => {
      // Проверяем наличие текста "Гость" и отсутствие "Добро пожаловать"
      const hasGuest = document.body.innerText.includes('Гость');
      const hasWelcome = document.body.innerText.includes('Добро пожаловать');
      return hasGuest && !hasWelcome;
    });
    
    if (isLoggedIn2) {
      console.log('✅ Второй браузер: пользователь авторизован');
    } else {
      console.log('❌ Второй браузер: пользователь не авторизован');
    }
    
    // Ищем информацию о текущем пользователе во втором браузере
    const userInfo2 = await page2.evaluate(() => {
      // Ищем текст с "Гость" и "(Вы)"
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes('Гость') && node.textContent.includes('(Вы)')) {
          return node.textContent.trim();
        }
      }
      return 'Пользователь не найден';
    });
    console.log('👤 Второй браузер: информация о пользователе:', userInfo2);
    
    // Ищем пользователей в сайдбаре в первом браузере
    console.log('🔍 Первый браузер: ищем пользователей в сайдбаре');
    const sidebarUsers1 = await page1.evaluate(() => {
      // Ищем все тексты, которые содержат "Пользователь" или "User"
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const users = [];
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text.includes('Пользователь') || text.includes('User') || text.includes('Гость')) {
          if (!text.includes('(Вы)') && text.length > 0) {
            users.push(text);
          }
        }
      }
      return users;
    });
    
    console.log('👥 Первый браузер: пользователи в сайдбаре:', sidebarUsers1);
    
    // Ищем пользователей в сайдбаре во втором браузере
    console.log('🔍 Второй браузер: ищем пользователей в сайдбаре');
    const sidebarUsers2 = await page2.evaluate(() => {
      // Ищем все тексты, которые содержат "Пользователь" или "User"
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const users = [];
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text.includes('Пользователь') || text.includes('User') || text.includes('Гость')) {
          if (!text.includes('(Вы)') && text.length > 0) {
            users.push(text);
          }
        }
      }
      return users;
    });
    
    console.log('👥 Второй браузер: пользователи в сайдбаре:', sidebarUsers2);
    
    // Проверяем, что пользователи видят друг друга
    const usersSeeEachOther = sidebarUsers1.length > 0 && sidebarUsers2.length > 0;
    if (usersSeeEachOther) {
      console.log('✅ Пользователи видят друг друга в сайдбаре');
    } else {
      console.log('⚠️ Пользователи не видят друг друга в сайдбаре');
    }
    
    // Ждем немного для проверки стабильности
    console.log('⏳ Ждем 5 секунд для проверки стабильности...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Финальные скриншоты
    await page1.screenshot({ 
      path: './test_screenshots/step2_05_browser1_final.png',
      fullPage: true 
    });
    await page2.screenshot({ 
      path: './test_screenshots/step2_06_browser2_final.png',
      fullPage: true 
    });
    
    console.log('✅ Тест шага 2 завершен!');
    console.log(`   Пользователь 1: ${userInfo1}`);
    console.log(`   Пользователь 2: ${userInfo2}`);
    console.log(`   Авторизованы: ${isLoggedIn1 && isLoggedIn2 ? 'Да' : 'Нет'}`);
    console.log(`   Видят друг друга: ${usersSeeEachOther ? 'Да' : 'Нет'}`);
    
    if (isLoggedIn1 && isLoggedIn2 && usersSeeEachOther) {
      console.log('🎉 ТЕСТ ПРОЙДЕН УСПЕШНО! Два пользователя авторизованы и видят друг друга!');
    } else {
      console.log('⚠️ Тест частично пройден. Некоторые проверки не выполнены.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка в тесте шага 2:', error.message);
    
    // Делаем скриншоты ошибок
    if (browser1) {
      const page1 = (await browser1.pages())[0];
      if (page1) {
        await page1.screenshot({ 
          path: './test_screenshots/step2_error_browser1.png',
          fullPage: true 
        });
      }
    }
    
    if (browser2) {
      const page2 = (await browser2.pages())[0];
      if (page2) {
        await page2.screenshot({ 
          path: './test_screenshots/step2_error_browser2.png',
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
testStep2Success().catch(console.error); 